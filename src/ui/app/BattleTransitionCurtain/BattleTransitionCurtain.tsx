import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { TransitionOrigin } from "@/ui/app/transitionOrigin";
import {
  BATTLE_CRACK_DRAW_MS,
  BATTLE_CRACK_HOLD_MS,
  BATTLE_RIPPLE_START_MS,
  BATTLE_RIPPLE_EXIT_MS,
  BATTLE_RIPPLE_MS,
} from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import { playSfx } from "@/ui/audio";
import s from "./BattleTransitionCurtain.module.css";

interface Props {
  phase: "exit" | "enter";
  origin: TransitionOrigin | null;
}

interface Point {
  x: number;
  y: number;
}

// ============================================================================
// 「一点受击的平板玻璃」拟真裂纹。
//
// 形态依据: 玻璃被点状冲击时不会长成蛛网装饰, 而是
//   ① 冲击点一小块被压成粉末(crush zone, 不透明白);
//   ② 从粉碎区放射出若干条**径向裂纹**, 越往外越细、并非全部等长;
//   ③ 径向裂纹之间被**同心裂纹**横向连接, 围出一格一格四边形碎片;
//   ④ 碎片仍嵌在原位不动, 但各自朝不同角度反光 —— 这是"碎了"最主要的视觉信号,
//      所以本实现的重点是**画面(碎片填充+棱面高光)**, 而不是画线。
// 因此线条一律发丝级、平头、无辉光、中性白/黑; 彩色辉光只会读成电弧或魔法阵。
//
// 时序: 真实断裂是毫秒级瞬发, 这里放慢到 PROPAGATE_MS 让人眼能读出"从冲击点炸开",
// 之后碎片棱边渐渐吃光(GLINT_MS), 网络成型后保持静止, 等黑色涟漪盖掉。
// ============================================================================

const MAX_PIXEL_RATIO = 2; // 发丝级裂纹需要比 1.5 更高的采样率, 否则会糊成灰线
const SPOKES = 20; // 径向裂纹条数
const CRUSH_RADIUS = 22; // 冲击点粉碎区半径(px)
const RING_GROWTH_MIN = 1.42; // 同心裂纹半径的等比增长区间: 越往外碎片越大
const RING_GROWTH_MAX = 1.9;
const PROPAGATE_MS = 260; // 断裂前沿从冲击点铺满全屏的时间
const GLINT_MS = 420; // 碎片棱面高光的渐显时长
const FLASH_MS = 130; // 冲击白闪

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPoint = (a: Point, b: Point, t: number): Point => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** 一条裂纹线段。near/far 为两端到冲击点的距离, 断裂前沿据此决定它何时、以多少比例出现。 */
interface Edge {
  a: Point;
  b: Point;
  near: number;
  far: number;
  width: number;
}

/** 一块玻璃碎片。tone 为相对底图的明暗偏移(正=偏亮), glint 为棱面高光的渐变方向。 */
interface Shard {
  poly: Point[];
  outer: number; // 顶点到冲击点的最大距离 —— 前沿越过它之后这片才算裂开
  tone: number;
  glint: { x0: number; y0: number; x1: number; y1: number };
}

interface Fracture {
  edges: Edge[];
  shards: Shard[];
  speck: { x: number; y: number; r: number }[];
  crush: Point[];
}

// 并查集: 被"没画出来的裂纹"分隔的相邻碎片其实是同一整片, 必须共用同一个 tone,
// 否则会在本不存在的缝隙两侧露出明暗断层。
function makeUnionFind(size: number) {
  const parent = Array.from({ length: size }, (_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    while (parent[index] !== root) {
      const next = parent[index];
      parent[index] = root;
      index = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  return { find, union };
}

function buildFracture(origin: Point, width: number, height: number): Fracture {
  // 覆盖半径按「冲击点到最远屏角」算, 否则从边角点击时另一侧会露出没裂的区域。
  const maxRadius =
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(width - origin.x, origin.y),
      Math.hypot(origin.x, height - origin.y),
      Math.hypot(width - origin.x, height - origin.y),
    ) * 1.08;

  // ── 径向裂纹的角度: 权重归一化保证首尾闭合, 同时让扇区宽窄不均(等分会显得太规整) ──
  const weights = Array.from({ length: SPOKES }, () => randomBetween(0.58, 1.42));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const angles: number[] = [];
  let angleAcc = Math.random() * Math.PI * 2;
  for (const weight of weights) {
    angles.push(angleAcc);
    angleAcc += (Math.PI * 2 * weight) / weightSum;
  }

  // ── 同心裂纹的半径: 等比增长, 靠近冲击点密、远处疏 ──
  const ringRadius: number[] = [CRUSH_RADIUS];
  while (ringRadius[ringRadius.length - 1] < maxRadius) {
    ringRadius.push(ringRadius[ringRadius.length - 1] * randomBetween(RING_GROWTH_MIN, RING_GROWTH_MAX));
  }
  const rings = ringRadius.length;

  // ── 顶点网格: vertex[ring][spoke]。逐点扰动既让径向裂纹蜿蜒, 也让同心裂纹不成正圆 ──
  const vertex: Point[][] = [];
  for (let ring = 0; ring < rings; ring++) {
    const row: Point[] = [];
    const wobble = ring === 0 ? 0.04 : 0.055 + ring * 0.012;
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const angle = angles[spoke] + randomBetween(-wobble, wobble);
      const radius = ringRadius[ring] * (ring === 0 ? randomBetween(0.94, 1.06) : randomBetween(0.85, 1.17));
      row.push({ x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius });
    }
    vertex.push(row);
  }

  // 并非所有径向裂纹都能传到最远处 —— 约四分之一会中途止裂, 于是外围出现更大的整片。
  const spokeReach = angles.map(() =>
    Math.random() > 0.26 ? rings - 1 : Math.round(randomBetween(Math.max(2, rings * 0.5), rings - 1)),
  );

  const shardIndex = (ring: number, spoke: number) => ring * SPOKES + (spoke % SPOKES);
  const { find, union } = makeUnionFind((rings - 1) * SPOKES);
  const edges: Edge[] = [];

  const pushEdge = (a: Point, b: Point, widthScale: number) => {
    const da = Math.hypot(a.x - origin.x, a.y - origin.y);
    const db = Math.hypot(b.x - origin.x, b.y - origin.y);
    const mid = (da + db) / 2;
    // 裂纹在根部最宽, 越往梢部越细 —— 这条渐细规律比线条颜色更能说明"这是裂纹不是线"。
    const width = lerp(1.75, 0.42, clamp(mid / maxRadius) ** 0.7) * widthScale;
    edges.push({ a, b, near: Math.min(da, db), far: Math.max(da, db), width });
  };

  // 径向裂纹: 逐段推入, 止裂之后的段落不画, 并把两侧碎片并成一片。
  for (let spoke = 0; spoke < SPOKES; spoke++) {
    for (let ring = 0; ring < rings - 1; ring++) {
      if (ring + 1 <= spokeReach[spoke]) {
        pushEdge(vertex[ring][spoke], vertex[ring + 1][spoke], 1);
      } else {
        union(shardIndex(ring, spoke), shardIndex(ring, spoke - 1 + SPOKES));
      }
    }
  }

  // 同心裂纹: 只在相邻两条径向裂纹之间连一小段, 且越往外越容易缺席。
  // 缺席的那段不是"没画", 而是那两块碎片本来就连着 —— 用并查集表达。
  for (let ring = 1; ring < rings - 1; ring++) {
    const keepChance = Math.max(0.32, 0.92 - ring * 0.085);
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      if (Math.random() < keepChance) {
        pushEdge(vertex[ring][spoke], vertex[ring][(spoke + 1) % SPOKES], 0.82);
      } else {
        union(shardIndex(ring - 1, spoke), shardIndex(ring, spoke));
      }
    }
  }

  // 粉碎区边界(ring 0)始终完整: 它是冲击点最硬的一圈轮廓。
  for (let spoke = 0; spoke < SPOKES; spoke++) {
    pushEdge(vertex[0][spoke], vertex[0][(spoke + 1) % SPOKES], 0.9);
  }

  // ── 碎片面 ──
  const groupTone = new Map<number, number>();
  const shards: Shard[] = [];
  for (let ring = 0; ring < rings - 1; ring++) {
    for (let spoke = 0; spoke < SPOKES; spoke++) {
      const next = (spoke + 1) % SPOKES;
      const poly = [vertex[ring][spoke], vertex[ring][next], vertex[ring + 1][next], vertex[ring + 1][spoke]];
      const root = find(shardIndex(ring, spoke));
      let tone = groupTone.get(root);
      if (tone === undefined) {
        // 每片朝向略有不同 ⇒ 反射的天光不同 ⇒ 明暗有细微差。幅度必须很小,
        // 大了就变成马赛克而不是玻璃。
        tone = randomBetween(-0.055, 0.075);
        groupTone.set(root, tone);
      }
      const glintAngle = Math.random() * Math.PI * 2;
      const span = Math.hypot(poly[2].x - poly[0].x, poly[2].y - poly[0].y) * 0.85;
      const center = {
        x: (poly[0].x + poly[1].x + poly[2].x + poly[3].x) / 4,
        y: (poly[0].y + poly[1].y + poly[2].y + poly[3].y) / 4,
      };
      shards.push({
        poly,
        outer: Math.max(...poly.map((p) => Math.hypot(p.x - origin.x, p.y - origin.y))),
        tone,
        glint: {
          x0: center.x - Math.cos(glintAngle) * span,
          y0: center.y - Math.sin(glintAngle) * span,
          x1: center.x + Math.cos(glintAngle) * span,
          y1: center.y + Math.sin(glintAngle) * span,
        },
      });
    }
  }

  // ── 冲击点: 粉碎区轮廓 + 周围溅出的细碎颗粒 ──
  const crush: Point[] = [];
  const crushPoints = 14;
  for (let index = 0; index < crushPoints; index++) {
    const angle = (Math.PI * 2 * index) / crushPoints;
    const radius = CRUSH_RADIUS * randomBetween(0.5, 0.82);
    crush.push({ x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius });
  }
  const speck = Array.from({ length: 46 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = CRUSH_RADIUS * randomBetween(0.35, 2.3);
    return {
      x: origin.x + Math.cos(angle) * radius,
      y: origin.y + Math.sin(angle) * radius,
      r: randomBetween(0.4, 1.5),
    };
  });

  return { edges, shards, speck, crush };
}

function tracePolygon(ctx: CanvasRenderingContext2D, poly: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let index = 1; index < poly.length; index++) ctx.lineTo(poly[index].x, poly[index].y);
  ctx.closePath();
}

function CrackCanvas({ phase, origin }: { phase: Props["phase"]; origin: TransitionOrigin | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
	    if (phase !== "exit") return;
	    playSfx("shatter");
	    const rippleTimer = window.setTimeout(() => playSfx("ripple"), BATTLE_RIPPLE_START_MS);
    const canvas = canvasRef.current;
    if (!canvas) return () => window.clearTimeout(rippleTimer);
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const point = origin ?? { x: width / 2, y: height / 2 };
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const fracture = buildFracture(point, width, height);
    const maxRadius = Math.max(...fracture.shards.map((shard) => shard.outer), 1);
    let animationFrame = 0;
    const startedAt = performance.now();
    // 网络铺满 + 高光吃透即定格; 之后靠 canvas 上残留的最后一帧撑过 hold 段。
    const runMs = Math.min(BATTLE_CRACK_DRAW_MS, PROPAGATE_MS + GLINT_MS + 80);

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      context.clearRect(0, 0, width, height);
      context.lineCap = "butt";
      context.lineJoin = "miter";
      context.shadowBlur = 0;

      // 断裂前沿: 先快后慢地推出去, 和真实裂纹的减速传播一致。
      const front = maxRadius * (1 - (1 - clamp(elapsed / PROPAGATE_MS)) ** 2.2);
      const glint = clamp((elapsed - PROPAGATE_MS * 0.45) / GLINT_MS);

      // ── ① 碎片面: 明暗差 + 棱面高光。这层才是"玻璃碎了"的主要信息量 ──
      for (const shard of fracture.shards) {
        const reveal = clamp((front - shard.outer) / 46);
        if (reveal <= 0) continue;
        tracePolygon(context, shard.poly);
        context.globalAlpha = reveal;
        context.fillStyle =
          shard.tone >= 0 ? `rgb(255 255 255 / ${shard.tone})` : `rgb(6 10 14 / ${-shard.tone})`;
        context.fill();

        const gradient = context.createLinearGradient(
          shard.glint.x0,
          shard.glint.y0,
          shard.glint.x1,
          shard.glint.y1,
        );
        gradient.addColorStop(0, `rgb(255 255 255 / ${0.16 * glint})`);
        gradient.addColorStop(0.62, "rgb(255 255 255 / 0)");
        gradient.addColorStop(1, `rgb(4 9 14 / ${0.07 * glint})`);
        context.fillStyle = gradient;
        context.fill();
      }

      // ── ② 裂纹线: 暗缝 → 斜下方的厚度倒角 → 发丝白芯, 三层叠出玻璃断面 ──
      const strokeEdges = (
        color: string,
        widthOf: (edge: Edge) => number,
        offsetX: number,
        offsetY: number,
        alphaScale: number,
      ) => {
        context.strokeStyle = color;
        for (const edge of fracture.edges) {
          const progress = clamp((front - edge.near) / Math.max(1, edge.far - edge.near));
          if (progress <= 0) continue;
          const end = lerpPoint(edge.a, edge.b, progress);
          context.globalAlpha = alphaScale;
          context.lineWidth = widthOf(edge);
          context.beginPath();
          context.moveTo(edge.a.x + offsetX, edge.a.y + offsetY);
          context.lineTo(end.x + offsetX, end.y + offsetY);
          context.stroke();
        }
      };

      strokeEdges("rgb(6 9 13 / 0.62)", (edge) => edge.width * 2.1 + 0.6, 0, 0, 1);
      strokeEdges("rgb(255 255 255 / 0.22)", (edge) => edge.width * 0.9, 0.9, 0.9, 0.55 + 0.45 * glint);
      strokeEdges("rgb(255 255 255 / 0.9)", (edge) => Math.max(0.35, edge.width * 0.62), 0, 0, 1);

      // ── ③ 冲击点粉碎区: 不透明白斑 + 溅散颗粒。有它才读得出"这里被砸了" ──
      const crushIn = clamp(elapsed / 70);
      if (crushIn > 0) {
        context.globalAlpha = crushIn;
        tracePolygon(context, fracture.crush);
        context.fillStyle = "rgb(246 251 255 / 0.62)";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "rgb(255 255 255 / 0.85)";
        context.stroke();

        context.fillStyle = "rgb(255 255 255 / 0.62)";
        for (const dot of fracture.speck) {
          if (Math.hypot(dot.x - point.x, dot.y - point.y) > front) continue;
          context.beginPath();
          context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          context.fill();
        }
      }

      // ── ④ 撞击白闪: 只有两三帧, 用来遮住裂纹网络"凭空出现"的那一瞬 ──
      const flash = clamp(elapsed / FLASH_MS);
      if (flash < 1) {
        const radius = 40 + flash * 180;
        const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        glow.addColorStop(0, `rgb(255 255 255 / ${0.85 * (1 - flash)})`);
        glow.addColorStop(0.45, `rgb(238 246 255 / ${0.3 * (1 - flash)})`);
        glow.addColorStop(1, "rgb(255 255 255 / 0)");
        context.globalAlpha = 1;
        context.fillStyle = glow;
        context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      }

      context.globalAlpha = 1;
      if (elapsed < runMs) animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(rippleTimer);
    };
  }, [origin, phase]);

  return <canvas ref={canvasRef} className={s["battle-transition-cracks"]} aria-hidden />;
}

export function battleTransitionVars(origin: TransitionOrigin | null): CSSProperties {
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  // 圆只比「点到最远角」所需直径略大，scale: 0 → 1 才会在整个 1.5 秒内保持可见扩张。
  // 若用数百 vmax 的超大圆，极小的 scale 已能盖满屏幕，视觉上会像一瞬间吞没。
  const coverRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const style = {
    "--fx-ox": `${x}px`,
    "--fx-oy": `${y}px`,
    "--btc-cover-size": `${Math.ceil(coverRadius * 2 + 24)}px`,
    "--btc-crack-ms": `${BATTLE_CRACK_DRAW_MS}ms`,
    "--btc-hold-ms": `${BATTLE_CRACK_HOLD_MS}ms`,
    "--btc-ripple-ms": `${BATTLE_RIPPLE_MS}ms`,
    "--btc-exit-ms": `${BATTLE_RIPPLE_EXIT_MS}ms`,
  } as CSSProperties;

  return style;
}

export function BattleTransitionCurtain({ phase, origin }: Props) {
  const style = battleTransitionVars(origin);

  return (
    <div
      className={s["battle-transition-curtain"]}
      // ⓘ 相位原先是 `is-${phase}` 类, 但本文件的 CSS 里**没有任何**规则用到它 ——
      //   Modules 之后 s["is-exit"] 会静默变成 undefined, 与其留个假类名, 不如落成
      //   data 属性: 调试时照样一眼可见, 也不会让人以为它有样式。
      data-phase={phase}
      style={style}
      aria-hidden
    >
      <CrackCanvas phase={phase} origin={origin} />
      <span className={s["battle-transition-black"]} />
      <span className={s["battle-transition-ring"]} />
      <span className={s["battle-transition-particles"]}>
        {Array.from({ length: 16 }, (_, index) => (
          <i
            key={index}
            style={{ "--particle-angle": `${(index * 360) / 16}deg` } as CSSProperties}
          />
        ))}
      </span>
    </div>
  );
}
