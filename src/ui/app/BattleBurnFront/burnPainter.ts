// 烧穿段的逐层绘制。约定: 调用方已把画布变换设为 CSS 像素; 每个函数自行 save/restore,
// 不向外泄漏 globalCompositeOperation / clip 等状态。
//
// 叠放顺序(由 BattleBurnFront 编排):
//   深焦纸面(仅降级模式) → 焦痕带(孔外) → 孔洞内侧阴影(孔内) → 余烬火线 → 烫红焦斑
//
// 焦痕与辉光一律用叠层描边而非 shadowBlur / filter: 全屏画布上每帧做模糊太贵,
// 而多层等距描边的阶梯在这个尺度下读不出来。

import { BURN_VERTICES, HEAT_MS, emberGlow, type BurnFront, type Point } from "./burnGeometry";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function addPolygon(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
  ctx.closePath();
}

function traceFront(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  addPolygon(ctx, points);
}

/** 孔洞之外的区域: 全屏矩形减去火线多边形(evenodd)。 */
function traceOutside(ctx: CanvasRenderingContext2D, points: Point[], width: number, height: number): void {
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  addPolygon(ctx, points);
}

/** 降级模式(无 View Transition, 旧场景已卸载)的纸面: 孔外填成深焦色, 读作「黑纸被烧穿」。 */
export function paintOpaquePaper(ctx: CanvasRenderingContext2D, front: BurnFront, burning: boolean): void {
  ctx.save();
  ctx.fillStyle = "#170c08";
  if (burning) {
    traceOutside(ctx, front.points, front.width, front.height);
    ctx.fill("evenodd");
  } else {
    ctx.fillRect(0, 0, front.width, front.height);
  }
  ctx.restore();
}

// 由外到内: 受热泛黄 → 焦褐 → 碳化黑边。描边宽度是「双侧」宽度, 只有孔外那一半会被看见。
const SCORCH_BANDS = [
  { width: 140, color: "rgb(110 62 22 / 0.13)" },
  { width: 100, color: "rgb(86 42 14 / 0.17)" },
  { width: 68, color: "rgb(58 26 8 / 0.26)" },
  { width: 44, color: "rgb(32 13 4 / 0.42)" },
  { width: 24, color: "rgb(14 6 2 / 0.72)" },
  { width: 11, color: "rgb(5 2 1 / 0.94)" },
] as const;

export function paintScorch(ctx: CanvasRenderingContext2D, front: BurnFront): void {
  ctx.save();
  traceOutside(ctx, front.points, front.width, front.height);
  ctx.clip("evenodd");
  traceFront(ctx, front.points);
  // 圆角接头: 火舌尖是锐角顶点, miter 会在那里刺出一根长针。
  ctx.lineJoin = "round";
  for (const band of SCORCH_BANDS) {
    ctx.lineWidth = band.width;
    ctx.strokeStyle = band.color;
    ctx.stroke();
  }
  ctx.restore();
}

/** 孔洞内侧的一圈暗影: 纸有厚度, 也把刚露出的战场边缘压暗, 孔洞才有「洞」的纵深。 */
export function paintInnerShade(ctx: CanvasRenderingContext2D, front: BurnFront): void {
  ctx.save();
  traceFront(ctx, front.points);
  ctx.clip();
  ctx.lineJoin = "round";
  ctx.lineWidth = 30;
  ctx.strokeStyle = "rgb(0 0 0 / 0.3)";
  ctx.stroke();
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgb(0 0 0 / 0.38)";
  ctx.stroke();
  ctx.restore();
}

// 热芯按亮度分档: 同一档的线段并成一条路径一次 stroke。原先逐段 stroke(一帧最多 144 次,
// 每次还要现拼一个颜色字符串), 是烧穿段每帧最密集的一组调用。12 档的亮度步进约 7%,
// 两三像素宽的热芯上读不出台阶。
const EMBER_MIN_GLOW = 0.12;
const EMBER_LEVELS = 12;
const EMBER_STYLES = Array.from({ length: EMBER_LEVELS }, (_, level) => {
  const glow = EMBER_MIN_GLOW + ((level + 0.5) / EMBER_LEVELS) * (1 - EMBER_MIN_GLOW);
  return {
    width: 1.1 + glow * 1.8,
    color: `rgb(255 ${Math.round(150 + glow * 90)} ${Math.round(60 + glow * 110)} / ${0.3 + glow * 0.65})`,
  };
});
/** 每帧原地复用: 第 index 段热芯落在哪一档, -1 = 太暗不画。 */
const emberLevel = new Int8Array(BURN_VERTICES);

/** 余烬火线: 两道宽而淡的红橙辉光 + 逐段明暗不一的黄白热芯。 */
export function paintEmberRim(ctx: CanvasRenderingContext2D, front: BurnFront, t: number): void {
  const points = front.points;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  traceFront(ctx, points);
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgb(255 58 8 / 0.14)";
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgb(255 86 18 / 0.4)";
  ctx.stroke();

  ctx.lineCap = "round";
  for (let index = 0; index < BURN_VERTICES; index++) {
    const glow = emberGlow(front, index, t);
    emberLevel[index] =
      glow < EMBER_MIN_GLOW
        ? -1
        : Math.min(EMBER_LEVELS - 1, Math.floor(((glow - EMBER_MIN_GLOW) / (1 - EMBER_MIN_GLOW)) * EMBER_LEVELS));
  }
  for (let level = 0; level < EMBER_LEVELS; level++) {
    ctx.beginPath();
    let any = false;
    for (let index = 0; index < BURN_VERTICES; index++) {
      if (emberLevel[index] !== level) continue;
      const a = points[index];
      const b = points[(index + 1) % BURN_VERTICES];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      any = true;
    }
    if (!any) continue;
    ctx.lineWidth = EMBER_STYLES[level].width;
    ctx.strokeStyle = EMBER_STYLES[level].color;
    ctx.stroke();
  }
  ctx.restore();
}

const PIERCE_FLASH_MS = 140;
const HOTSPOT_FADE_MS = 260;

/**
 * 烫红焦斑: 烫的阶段焦圈与炽热斑一起长大; 烧穿后焦斑随孔洞扩大淡去,
 * 烧穿那一刻补一记很小的亮闪, 遮住「孔凭空出现」的一帧。
 */
export function paintHotSpot(ctx: CanvasRenderingContext2D, origin: Point, t: number): void {
  const heat = clamp01(t / HEAT_MS);
  const fade = 1 - clamp01((t - HEAT_MS) / HOTSPOT_FADE_MS);
  if (fade <= 0) return;
  const grow = 1 - (1 - heat) ** 2;
  const { x, y } = origin;

  ctx.save();
  // 焦圈: 纸面先被烫出一圈褐色, 中心最深。
  const scorchR = 18 + grow * 62;
  const scorch = ctx.createRadialGradient(x, y, 0, x, y, scorchR);
  scorch.addColorStop(0, `rgb(18 7 2 / ${0.92 * fade})`);
  scorch.addColorStop(0.42, `rgb(62 27 8 / ${0.6 * fade})`);
  scorch.addColorStop(0.75, `rgb(104 58 20 / ${0.22 * fade})`);
  scorch.addColorStop(1, "rgb(104 58 20 / 0)");
  ctx.globalAlpha = grow;
  ctx.fillStyle = scorch;
  ctx.fillRect(x - scorchR, y - scorchR, scorchR * 2, scorchR * 2);

  // 炽热斑: 叠加混合, 从暗红烧到橙红, 中心一点黄白。
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1;
  const hotR = 6 + grow * 30;
  const hot = ctx.createRadialGradient(x, y, 0, x, y, hotR);
  hot.addColorStop(0, `rgb(255 232 170 / ${heat * heat * fade})`);
  hot.addColorStop(0.28, `rgb(255 110 34 / ${0.9 * heat * fade})`);
  hot.addColorStop(0.65, `rgb(190 26 6 / ${0.55 * heat * fade})`);
  hot.addColorStop(1, "rgb(160 10 0 / 0)");
  ctx.fillStyle = hot;
  ctx.fillRect(x - hotR, y - hotR, hotR * 2, hotR * 2);

  const flash = (t - HEAT_MS) / PIERCE_FLASH_MS;
  if (flash >= 0 && flash < 1) {
    const flashR = 30 + flash * 70;
    const burst = ctx.createRadialGradient(x, y, 0, x, y, flashR);
    burst.addColorStop(0, `rgb(255 240 200 / ${0.75 * (1 - flash)})`);
    burst.addColorStop(0.5, `rgb(255 120 40 / ${0.35 * (1 - flash)})`);
    burst.addColorStop(1, "rgb(255 80 20 / 0)");
    ctx.fillStyle = burst;
    ctx.fillRect(x - flashR, y - flashR, flashR * 2, flashR * 2);
  }
  ctx.restore();
}

/** 孔洞多边形 → CSS clip-path, 坐标即视口像素(与 ::view-transition-new(root) 同一坐标系)。 */
export function toClipPath(points: Point[]): string {
  return `polygon(${points.map((point) => `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`).join(",")})`;
}

export function closedClipPath(origin: Point): string {
  return `circle(0px at ${origin.x}px ${origin.y}px)`;
}
