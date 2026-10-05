// 裂纹的逐帧绘制。几何见 crackGeometry.ts。
//
// 重点是**画面(碎片填充+棱面高光)**, 而不是画线; 线条一律发丝级、平头、无辉光、中性白/黑,
// 彩色辉光只会读成电弧或魔法阵。
//
// 性能约定(全屏画布 × 最高 2 倍采样, 每帧的调用次数直接决定会不会掉帧):
//   · 每片碎片的填充色与高光渐变在准备阶段一次建好, 逐帧只改 globalAlpha ——
//     原先每帧给每片碎片新建一个 CanvasGradient, 一帧近两百个。
//   · 裂纹线按线宽分桶, 同一桶并成一条路径一次 stroke —— 原先逐段 stroke, 三遍叠画一帧近千次。
//     分桶步长 0.1px, 发丝级线条在这个精度下肉眼不可分。
//   · CRACK_SETTLE_MS 之后画面逐像素不再变化, 调用方应在那一帧之后停止循环。

import { clamp, lerp, type Fracture, type Point } from "./crackGeometry";

const PROPAGATE_MS = 260; // 断裂前沿从冲击点铺满全屏的时间
const GLINT_MS = 420; // 碎片棱面高光的渐显时长
const GLINT_DELAY_MS = PROPAGATE_MS * 0.45;
const FLASH_MS = 130; // 冲击白闪

/** 画面定格的时刻: 前沿铺满、高光吃透、白闪已过。此后每一帧都与上一帧完全相同。 */
export const CRACK_SETTLE_MS = Math.max(PROPAGATE_MS, GLINT_DELAY_MS + GLINT_MS, FLASH_MS);

const WIDTH_STEP = 0.1;

interface ShardPaint {
  fill: string;
  /** 高光渐变按 glint=1 的满值建好, 逐帧用 globalAlpha 乘上 glint —— 与逐帧重建逐像素等价。 */
  glint: CanvasGradient;
}

interface EdgeBucket {
  width: number;
  edges: number[];
}

// 裂纹线: 暗缝 → 斜下方的厚度倒角 → 发丝白芯, 三层叠出玻璃断面。
const STROKE_PASSES: {
  color: string;
  width: (edgeWidth: number) => number;
  offset: number;
  alpha: (glint: number) => number;
}[] = [
  { color: "rgb(6 9 13 / 0.62)", width: (w) => w * 2.1 + 0.6, offset: 0, alpha: () => 1 },
  { color: "rgb(255 255 255 / 0.22)", width: (w) => w * 0.9, offset: 0.9, alpha: (g) => 0.55 + 0.45 * g },
  { color: "rgb(255 255 255 / 0.9)", width: (w) => Math.max(0.35, w * 0.62), offset: 0, alpha: () => 1 },
];

export interface CrackScene {
  fracture: Fracture;
  origin: Point;
  maxRadius: number;
  shardPaint: ShardPaint[];
  buckets: EdgeBucket[];
  /** 每条裂纹当前的生长比例, 每帧原地复用, 三遍描边共用。 */
  progress: Float32Array;
}

export function prepareCrackScene(ctx: CanvasRenderingContext2D, fracture: Fracture, origin: Point): CrackScene {
  const shardPaint = fracture.shards.map((shard) => {
    const glint = ctx.createLinearGradient(shard.glint.x0, shard.glint.y0, shard.glint.x1, shard.glint.y1);
    glint.addColorStop(0, "rgb(255 255 255 / 0.16)");
    glint.addColorStop(0.62, "rgb(255 255 255 / 0)");
    glint.addColorStop(1, "rgb(4 9 14 / 0.07)");
    return {
      fill: shard.tone >= 0 ? `rgb(255 255 255 / ${shard.tone})` : `rgb(6 10 14 / ${-shard.tone})`,
      glint,
    };
  });

  const bucketMap = new Map<number, EdgeBucket>();
  fracture.edges.forEach((edge, index) => {
    const key = Math.round(edge.width / WIDTH_STEP);
    let bucket = bucketMap.get(key);
    if (!bucket) {
      bucket = { width: key * WIDTH_STEP, edges: [] };
      bucketMap.set(key, bucket);
    }
    bucket.edges.push(index);
  });

  return {
    fracture,
    origin,
    maxRadius: Math.max(...fracture.shards.map((shard) => shard.outer), 1),
    shardPaint,
    buckets: [...bucketMap.values()],
    progress: new Float32Array(fracture.edges.length),
  };
}

function tracePolygon(ctx: CanvasRenderingContext2D, poly: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let index = 1; index < poly.length; index++) ctx.lineTo(poly[index].x, poly[index].y);
  ctx.closePath();
}

export function paintCrackFrame(
  ctx: CanvasRenderingContext2D,
  scene: CrackScene,
  elapsed: number,
  width: number,
  height: number,
): void {
  const { fracture, origin, shardPaint, buckets, progress } = scene;
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.shadowBlur = 0;

  // 断裂前沿: 先快后慢地推出去, 和真实裂纹的减速传播一致。
  const front = scene.maxRadius * (1 - (1 - clamp(elapsed / PROPAGATE_MS)) ** 2.2);
  const glint = clamp((elapsed - GLINT_DELAY_MS) / GLINT_MS);

  // ── ① 碎片面: 明暗差 + 棱面高光。这层才是"玻璃碎了"的主要信息量 ──
  fracture.shards.forEach((shard, index) => {
    const reveal = clamp((front - shard.outer) / 46);
    if (reveal <= 0) return;
    tracePolygon(ctx, shard.poly);
    ctx.globalAlpha = reveal;
    ctx.fillStyle = shardPaint[index].fill;
    ctx.fill();
    if (glint <= 0) return;
    ctx.globalAlpha = reveal * glint;
    ctx.fillStyle = shardPaint[index].glint;
    ctx.fill();
  });

  // ── ② 裂纹线: 生长比例每帧算一次, 三遍描边按线宽分桶各画一条路径 ──
  fracture.edges.forEach((edge, index) => {
    progress[index] = clamp((front - edge.near) / Math.max(1, edge.far - edge.near));
  });
  for (const pass of STROKE_PASSES) {
    ctx.strokeStyle = pass.color;
    ctx.globalAlpha = pass.alpha(glint);
    for (const bucket of buckets) {
      ctx.beginPath();
      let any = false;
      for (const index of bucket.edges) {
        const t = progress[index];
        if (t <= 0) continue;
        const edge = fracture.edges[index];
        ctx.moveTo(edge.a.x + pass.offset, edge.a.y + pass.offset);
        ctx.lineTo(lerp(edge.a.x, edge.b.x, t) + pass.offset, lerp(edge.a.y, edge.b.y, t) + pass.offset);
        any = true;
      }
      if (!any) continue;
      ctx.lineWidth = pass.width(bucket.width);
      ctx.stroke();
    }
  }

  // ── ③ 冲击点粉碎区: 不透明白斑 + 溅散颗粒。有它才读得出"这里被砸了" ──
  const crushIn = clamp(elapsed / 70);
  if (crushIn > 0) {
    ctx.globalAlpha = crushIn;
    tracePolygon(ctx, fracture.crush);
    ctx.fillStyle = "rgb(246 251 255 / 0.62)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(255 255 255 / 0.85)";
    ctx.stroke();

    ctx.fillStyle = "rgb(255 255 255 / 0.62)";
    ctx.beginPath();
    for (const dot of fracture.speck) {
      if (Math.hypot(dot.x - origin.x, dot.y - origin.y) > front) continue;
      ctx.moveTo(dot.x + dot.r, dot.y);
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // ── ④ 撞击白闪: 只有两三帧, 用来遮住裂纹网络"凭空出现"的那一瞬 ──
  const flash = clamp(elapsed / FLASH_MS);
  if (flash < 1) {
    const radius = 40 + flash * 180;
    const glow = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, radius);
    glow.addColorStop(0, `rgb(255 255 255 / ${0.85 * (1 - flash)})`);
    glow.addColorStop(0.45, `rgb(238 246 255 / ${0.3 * (1 - flash)})`);
    glow.addColorStop(1, "rgb(255 255 255 / 0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(origin.x - radius, origin.y - radius, radius * 2, radius * 2);
  }

  ctx.globalAlpha = 1;
}
