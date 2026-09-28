import { HAZARD, LED, STEEL, rgba, type Ramp } from "../base/palette";
import { radialGlow } from "../light/glow";
import { fillTexture } from "../base/grain";
import { recess } from "../base/shading";

// 金属细节：钢板拼缝、铆钉、警示条纹、铁门。所有体块共用，保证同一种「手工感」。

/** 竖向钢板拼缝：深色缝 + 右侧 1px 受光边。 */
export function seamsV(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, ramp: Ramp): void {
  for (let sx = x + step; sx < x + w - 4; sx += step) {
    const px = Math.round(sx);
    ctx.fillStyle = ramp.deep;
    ctx.fillRect(px, y, 2, h);
    ctx.fillStyle = rgba(ramp.hi, 0.35);
    ctx.fillRect(px + 2, y, 1, h);
  }
}

/** 横向钢板拼缝：深色缝 + 下方 1px 受光边。 */
export function seamsH(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, ramp: Ramp): void {
  for (let sy = y + step; sy < y + h - 4; sy += step) {
    const py = Math.round(sy);
    ctx.fillStyle = ramp.deep;
    ctx.fillRect(x, py, w, 2);
    ctx.fillStyle = rgba(ramp.hi, 0.3);
    ctx.fillRect(x, py + 2, w, 1);
  }
}

/** 一排铆钉：暗点 + 左上高光。 */
export function rivetLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, step: number, ramp: Ramp): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.floor(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    ctx.fillStyle = ramp.deep;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(ramp.hi, 0.8);
    ctx.fillRect(x - 1.2, y - 1.2, 1.2, 1.2);
  }
}

/** 黑黄斜纹警示带，带磨损。 */
export function hazardBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stripe = 16): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = HAZARD.black;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = HAZARD.yellow;
  const start = Math.floor(x / (stripe * 2)) * stripe * 2 - h;
  for (let sx = start; sx < x + w + h; sx += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + stripe, y + h);
    ctx.lineTo(sx + stripe + h, y);
    ctx.lineTo(sx + h, y);
    ctx.closePath();
    ctx.fill();
  }
  fillTexture(ctx, "grain", x, y, w, h, 1, 91);
  fillTexture(ctx, "grime", x, y, w, h, 0.8, 37);
  ctx.fillStyle = rgba("#000000", 0.25);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.restore();
}

/** 嵌在墙里的铁门：门洞 + 两扇带加强筋的门板。 */
export function steelDoor(ctx: CanvasRenderingContext2D, cx: number, bottom: number, w: number, h: number, ramp: Ramp): void {
  const x = Math.round(cx - w / 2);
  const y = bottom - h;
  recess(ctx, x, y, w, h, ramp);
  const leaf = (w - 6) / 2;
  for (let i = 0; i < 2; i++) {
    const lx = x + 2 + i * (leaf + 2);
    const g = ctx.createLinearGradient(lx, 0, lx + leaf, 0);
    g.addColorStop(0, ramp.light);
    g.addColorStop(1, ramp.dark);
    ctx.fillStyle = g;
    ctx.fillRect(lx, y + 6, leaf, h - 6);
    ctx.fillStyle = ramp.deep;
    ctx.fillRect(lx + 4, y + h * 0.35, leaf - 8, 2);
    ctx.fillRect(lx + 4, y + h * 0.68, leaf - 8, 2);
    rivetLine(ctx, lx + 5, y + 12, lx + leaf - 5, y + 12, 12, ramp);
  }
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x + w / 2 - 1, y + 6, 2, h - 6);
  doorShade(ctx, x, y, w, h);
  // 门框顶部的冷色灯线与右侧门禁面板。
  ctx.fillStyle = rgba(LED.cyan, 0.7);
  ctx.fillRect(x + 4, y + 2, w - 8, 1.5);
  radialGlow(ctx, x + w / 2, y + 3, w * 0.45, LED.cyan, 0.16);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + w + 6, y + h * 0.42, 9, 14);
  ctx.fillStyle = LED.green;
  ctx.fillRect(x + w + 9, y + h * 0.42 + 3, 3, 3);
  radialGlow(ctx, x + w + 10.5, y + h * 0.42 + 4.5, 8, LED.green, 0.5);
}

function doorShade(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "rgba(5,6,10,0.55)");
  g.addColorStop(0.3, "rgba(5,6,10,0)");
  g.addColorStop(1, "rgba(5,6,10,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}
