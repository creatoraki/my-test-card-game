import type { NeonTone } from "../../types";
import { createRandom } from "../base/random";
import { NEON_COLORS, rgba, STEEL } from "../base/palette";
import { FONT } from "../fixtures/signs";
import { radialGlow } from "./glow";

// 全息屏：仿远景中央那两块青紫屏幕——渐变底光 + 斜向几何纹 + 扫描线 + 发光边框，并向墙面溢光。

function scanlines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = rgba("#000000", 0.28);
  for (let sy = y + 1; sy < y + h; sy += 3) ctx.fillRect(x, sy, w, 1);
}

function glowText(ctx: CanvasRenderingContext2D, draw: () => void, core: string, glow: string, size: number): void {
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.6;
  draw();
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.globalAlpha = 0.9;
  draw();
  ctx.globalAlpha = 1;
}

/** 墙挂全息屏；lines 为可选的中文字行。 */
export function holoScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tone: NeonTone,
  seed: number,
  lines?: readonly string[],
): void {
  const r = createRandom(seed);
  const { core, glow } = NEON_COLORS[tone];
  radialGlow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 0.95, glow, 0.28);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = "#060a1c";
  ctx.fillRect(x, y, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const base = ctx.createLinearGradient(0, y, 0, y + h);
  base.addColorStop(0, rgba(glow, 0.5));
  base.addColorStop(0.55, rgba(glow, 0.18));
  base.addColorStop(1, rgba(glow, 0.32));
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  // 斜向晶格与三角形，仿远景屏幕上的几何纹。
  ctx.strokeStyle = rgba(core, 0.3);
  ctx.lineWidth = 1;
  const diagonals = r.int(3, 5);
  for (let i = 0; i < diagonals; i++) {
    ctx.beginPath();
    ctx.moveTo(x + r.next() * w, y);
    ctx.lineTo(x + r.next() * w, y + h);
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(core, 0.6);
  ctx.lineWidth = 1.5;
  const triangles = r.int(2, 4);
  for (let i = 0; i < triangles; i++) {
    const cx = x + r.range(0.15, 0.85) * w;
    const cy = y + r.range(0.2, 0.8) * h;
    const s = r.range(0.12, 0.28) * Math.min(w, h);
    const flip = r.chance(0.5) ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s * 0.6 * flip);
    ctx.lineTo(cx + s, cy - s * 0.6 * flip);
    ctx.lineTo(cx, cy + s * 0.8 * flip);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = rgba(core, 0.75);
  const dx = x + r.range(0.2, 0.8) * w;
  const dy = y + r.range(0.25, 0.75) * h;
  const ds = Math.min(w, h) * 0.06;
  ctx.beginPath();
  ctx.moveTo(dx, dy - ds);
  ctx.lineTo(dx + ds, dy);
  ctx.lineTo(dx, dy + ds);
  ctx.lineTo(dx - ds, dy);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  if (lines?.length) {
    const longest = Math.max(...lines.map((line) => [...line].length));
    const size = Math.min((h * 0.72) / lines.length, (w * 0.86) / longest);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lineH = size * 1.08;
    const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;
    glowText(ctx, () => lines.forEach((line, i) => ctx.fillText(line, x + w / 2, startY + i * lineH)), core, glow, size);
  }
  scanlines(ctx, x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  ctx.restore();
  ctx.fillStyle = rgba(core, 0.85);
  ctx.fillRect(x, y, w, 1.5);
  const c = Math.min(10, w * 0.15);
  for (const [bx, by, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.fillRect(bx - (sx < 0 ? 2 : 0), by - (sy < 0 ? c : 0), 2, c);
    ctx.fillRect(bx - (sx < 0 ? c : 0), by - (sy < 0 ? 2 : 0), c, 2);
  }
}

/** 竖向全息条幅：半透明光带 + 竖排发光字，顶端挂杆。 */
export function holoBanner(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number, tone: NeonTone, text: string): void {
  const { core, glow } = NEON_COLORS[tone];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const band = ctx.createLinearGradient(x, 0, x + w, 0);
  band.addColorStop(0, rgba(glow, 0.32));
  band.addColorStop(0.2, rgba(glow, 0.1));
  band.addColorStop(0.8, rgba(glow, 0.1));
  band.addColorStop(1, rgba(glow, 0.32));
  ctx.fillStyle = band;
  ctx.fillRect(x, top, w, h);
  const fade = ctx.createLinearGradient(0, top, 0, top + h);
  fade.addColorStop(0, rgba(glow, 0.18));
  fade.addColorStop(1, rgba(glow, 0));
  ctx.fillStyle = fade;
  ctx.fillRect(x, top, w, h);
  ctx.restore();

  ctx.fillStyle = rgba(core, 0.7);
  ctx.fillRect(x, top, 1.5, h);
  ctx.fillRect(x + w - 1.5, top, 1.5, h);
  const chars = [...text];
  const size = Math.min(w * 0.62, (h * 0.9) / chars.length / 1.1);
  ctx.save();
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const startY = top + (h - chars.length * size * 1.1) / 2 + size * 0.55;
  glowText(ctx, () => chars.forEach((ch, i) => ctx.fillText(ch, x + w / 2, startY + i * size * 1.1)), core, glow, size);
  scanlines(ctx, x, top, w, h);
  ctx.restore();
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 5, top - 5, w + 10, 6);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x - 5, top - 5, w + 10, 1.5);
}
