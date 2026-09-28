import type { LightTone } from "../../types";
import { lightGlow, RIM, RIM_HOT, rgba } from "../base/palette";

// 逆光：远景城市在建筑背后发亮，所有体块的右缘与顶缘都勾一道冷蓝边缘光，向内快速衰减。

/** 矩形体块的边缘光：右缘 + 顶缘亮线，外加向内渐隐的一层叠加光。 */
export function rimEdge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strength = 1): void {
  const depth = Math.min(18, w * 0.25);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const side = ctx.createLinearGradient(x + w - depth, 0, x + w, 0);
  side.addColorStop(0, rgba(RIM, 0));
  side.addColorStop(1, rgba(RIM, 0.2 * strength));
  ctx.fillStyle = side;
  ctx.fillRect(x + w - depth, y, depth, h);
  const topDepth = Math.min(10, h * 0.2);
  const top = ctx.createLinearGradient(0, y, 0, y + topDepth);
  top.addColorStop(0, rgba(RIM, 0.16 * strength));
  top.addColorStop(1, rgba(RIM, 0));
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, topDepth);
  ctx.restore();
  ctx.fillStyle = rgba(RIM_HOT, 0.55 * strength);
  ctx.fillRect(x + w - 1.5, y, 1.5, h);
  ctx.fillStyle = rgba(RIM_HOT, 0.4 * strength);
  ctx.fillRect(x, y, w, 1.2);
}

/** 圆柱体的边缘光：只勾右缘一道细亮线（渐变本身已带冷色收边）。 */
export function rimCylinder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strength = 1): void {
  ctx.fillStyle = rgba(RIM_HOT, 0.45 * strength);
  ctx.fillRect(x + w - 2, y, 1.2, h);
}

/** 霓虹灯在墙面上洗出的一片彩色泛光；只作用在 clip 区域内。 */
export function neonWash(
  ctx: CanvasRenderingContext2D,
  clip: { x: number; y: number; w: number; h: number },
  cx: number,
  cy: number,
  radius: number,
  tone: LightTone,
  alpha: number,
): void {
  const color = lightGlow(tone);
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}
