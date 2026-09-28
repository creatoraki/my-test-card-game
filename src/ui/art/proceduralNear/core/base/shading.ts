import { AMBIENT_SHADOW, RIM, rgba, type Ramp } from "./palette";
import { rimEdge } from "../light/rim";

// 统一光照：主光来自左上（较弱），背后城市给出冷蓝逆光。
// 圆柱左侧 1/4 处起高光、右侧背光后收一道冷色边缘；平面体块上亮下暗、左缘受光、右缘与顶缘勾边缘光。

/** 竖直圆柱的横向明暗渐变（右缘带冷色逆光）。 */
export function cylinderFill(ctx: CanvasRenderingContext2D, x: number, w: number, ramp: Ramp): CanvasGradient {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ramp.deep);
  g.addColorStop(0.12, ramp.mid);
  g.addColorStop(0.26, ramp.hi);
  g.addColorStop(0.4, ramp.light);
  g.addColorStop(0.66, ramp.dark);
  g.addColorStop(0.86, ramp.deep);
  g.addColorStop(0.95, RIM);
  g.addColorStop(1, ramp.dark);
  return g;
}

/** 水平圆柱（横放的罐 / 粗管）的纵向明暗渐变。 */
export function lyingCylinderFill(ctx: CanvasRenderingContext2D, y: number, h: number, ramp: Ramp): CanvasGradient {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, RIM);
  g.addColorStop(0.08, ramp.dark);
  g.addColorStop(0.22, ramp.hi);
  g.addColorStop(0.42, ramp.light);
  g.addColorStop(0.75, ramp.dark);
  g.addColorStop(1, ramp.deep);
  return g;
}

/** 平面体块：上亮下暗，左缘受光、右缘压暗，最后勾冷色边缘光。 */
export function shadeBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.16, ramp.mid);
  g.addColorStop(1, ramp.dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  const side = ctx.createLinearGradient(x, 0, x + w, 0);
  side.addColorStop(0, rgba("#b8c8ff", 0.06));
  side.addColorStop(0.25, rgba("#b8c8ff", 0));
  side.addColorStop(0.7, rgba(AMBIENT_SHADOW, 0));
  side.addColorStop(1, rgba(AMBIENT_SHADOW, 0.4));
  ctx.fillStyle = side;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ramp.hi;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x, y, 2, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x + w - 4, y, 2, h);
  rimEdge(ctx, x, y, w, h);
}

/** 自上而下渐暗的遮蔽，用于挑檐下、门洞内、贴地处。 */
export function shadeDown(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, alpha));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** 自上而下渐深的遮蔽（贴地压暗）。 */
export function shadeUp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, 0));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** 门洞 / 凹槽：深色内腔 + 顶部遮蔽 + 框线。 */
export function recess(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 4);
  ctx.fillStyle = ramp.dark;
  ctx.fillRect(x, y, w, h);
  shadeDown(ctx, x, y, w, Math.min(h, 40), 0.7);
  ctx.fillStyle = ramp.hi;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x - 4, y - 5, w + 8, 1);
  ctx.globalAlpha = 1;
}
