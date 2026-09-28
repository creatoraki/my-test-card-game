import type { LightTone, NeonTone } from "../../types";
import { LAMP, lightCore, lightGlow, NEON_COLORS, rgba, STEEL, ALLOY } from "../base/palette";

// 发光：壁灯 / 泛光灯、霓虹灯管、亮窗、航标灯。shadowBlur 与叠加混合只在烘焙时付出成本。

/** 叠加混合的径向光晕。 */
export function radialGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.35, rgba(color, alpha * 0.4));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/** 自灯位向下扩散的光锥，照亮墙面与门洞。 */
export function lightCone(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number, length: number, tone: LightTone, alpha: number): void {
  const color = lightGlow(tone);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, y, 0, y + length);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.55, rgba(color, alpha * 0.3));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x + spread, y + length);
  ctx.lineTo(x - spread, y + length);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** 壁灯：warm 为暖色灯罩壁灯；其余为细长 LED 泛光灯条。都带光晕与下方光锥（灯体按真实比例约 0.4~0.5m）。 */
export function wallLamp(ctx: CanvasRenderingContext2D, x: number, y: number, reach = 320, tone: LightTone = "warm"): void {
  const core = lightCore(tone);
  const glow = lightGlow(tone);
  lightCone(ctx, x, y + 10, reach * 0.5, reach, tone, tone === "warm" ? 0.2 : 0.16);
  if (tone === "warm") {
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(x - 3, y - 26, 6, 16);
    ctx.fillStyle = LAMP.housing;
    ctx.beginPath();
    ctx.moveTo(x - 26, y + 2);
    ctx.lineTo(x - 14, y - 12);
    ctx.lineTo(x + 14, y - 12);
    ctx.lineTo(x + 26, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = STEEL.light;
    ctx.fillRect(x - 14, y - 12, 28, 2);
    ctx.fillStyle = core;
    ctx.fillRect(x - 20, y + 2, 40, 4);
  } else {
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(x - 4, y - 18, 8, 12);
    ctx.fillRect(x - 36, y - 8, 72, 13);
    ctx.fillStyle = ALLOY.hi;
    ctx.fillRect(x - 36, y - 8, 72, 1.5);
    ctx.fillStyle = core;
    ctx.fillRect(x - 32, y + 2, 64, 3.5);
  }
  radialGlow(ctx, x, y + 6, 90, glow, 0.45);
  radialGlow(ctx, x, y + 5, 22, core, 0.5);
}

/** 一段霓虹灯管：外发光两遍 + 近白灯芯。 */
export function neonLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, tone: NeonTone, width = 5): void {
  const { core, glow } = NEON_COLORS[tone];
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = glow;
  ctx.shadowColor = glow;
  ctx.lineWidth = width;
  ctx.shadowBlur = width * 5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.shadowBlur = width * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = core;
  ctx.lineWidth = Math.max(1.5, width * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** 门楣上的霓虹灯条：灯管 + 下方光锥。 */
export function neonStrip(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, tone: NeonTone): void {
  lightCone(ctx, cx, y + 4, w * 0.7, 300, tone, 0.18);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(cx - w / 2 - 4, y - 7, w + 8, 14);
  neonLine(ctx, cx - w / 2, y, cx + w / 2, y, tone, 7);
  radialGlow(ctx, cx, y, w * 0.9, NEON_COLORS[tone].glow, 0.28);
}

/** 竖向霓虹灯管：沿楼角立起，带固定卡子，并在墙面洗出一条彩色光带（呼应远景的品红竖管）。 */
export function neonTube(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, tone: NeonTone, width = 6): void {
  const { glow } = NEON_COLORS[tone];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const wash = ctx.createLinearGradient(x - 44, 0, x + 44, 0);
  wash.addColorStop(0, rgba(glow, 0));
  wash.addColorStop(0.5, rgba(glow, 0.2));
  wash.addColorStop(1, rgba(glow, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(x - 44, y0, 88, y1 - y0);
  ctx.restore();
  neonLine(ctx, x, y0, x, y1, tone, width);
  ctx.fillStyle = STEEL.deep;
  for (let y = y0 + 20; y < y1 - 8; y += 70) ctx.fillRect(x - width - 3, y, width * 2 + 6, 5);
}

/** 窗：dark = 反射天光的暗玻璃，其余为灯光色的亮窗。 */
export function windowPane(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone: LightTone | "dark"): void {
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  if (tone === "dark") {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#26315a");
    g.addColorStop(0.45, "#0b0f22");
    g.addColorStop(1, "#141a33");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = rgba("#9fb6ff", 0.2);
    ctx.fillRect(x + 2, y + 2, w * 0.3, 1.5);
    return;
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(lightCore(tone), 0.95));
  g.addColorStop(1, rgba(lightGlow(tone), 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba("#000000", 0.35);
  ctx.fillRect(x + w / 2 - 1, y, 2, h);
  radialGlow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.4, lightGlow(tone), 0.22);
}

/** 顶端红色航标灯。 */
export function beacon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#ffd0c0";
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  radialGlow(ctx, x, y, 18, "#ff3b2f", 0.7);
}
