import type { NeonTone } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, NEON_COLORS, RIM_HOT, STEEL, rgba } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { radialGlow, neonLine } from "../core/light/glow";
import { FONT } from "../core/fixtures/signs";
import { rivetLine } from "../core/fixtures/rivets";

// 招牌：横向灯箱（亮面深字 / 暗面霓虹字）、竖向挑出招牌、海报墙、涂鸦。所有文字为中文。

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxH: number): number {
  let size = maxH;
  ctx.font = `900 ${size}px ${FONT}`;
  const width = ctx.measureText(text).width;
  if (width > maxW) size = Math.floor(size * (maxW / width));
  return size;
}

/** 霓虹字：外发光两遍 + 近白字芯。 */
function neonText(ctx: CanvasRenderingContext2D, draw: () => void, tone: NeonTone, size: number): void {
  const { core, glow } = NEON_COLORS[tone];
  ctx.save();
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.6;
  draw();
  ctx.shadowBlur = size * 0.2;
  draw();
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.globalAlpha = 0.9;
  draw();
  ctx.restore();
}

/** 横向灯箱招牌。lit = 亮面灯箱（发光底 + 深色字），否则为暗底霓虹字。 */
export function lightBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, tone: NeonTone, lit: boolean, seed: number): void {
  const { core, glow } = NEON_COLORS[tone];
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + 8, y + 10, w, h);
  radialGlow(ctx, x + w / 2, y + h / 2, w * 0.62, glow, lit ? 0.3 : 0.22);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  if (lit) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, core);
    g.addColorStop(0.55, rgba(glow, 0.9));
    g.addColorStop(1, rgba(glow, 0.7));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = "#0a0b14";
  }
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  fillTexture(ctx, "grime", x, y, w, h, lit ? 0.55 : 0.3, seed % 211, 1.6);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = fitFont(ctx, text, w * 0.86, h * 0.66);
  ctx.font = `900 ${size}px ${FONT}`;
  if (lit) {
    ctx.fillStyle = rgba("#000000", 0.25);
    ctx.fillText(text, x + w / 2 + 3, y + h / 2 + 4);
    ctx.fillStyle = "#12102a";
    ctx.fillText(text, x + w / 2, y + h / 2 + 2);
  } else {
    neonText(ctx, () => ctx.fillText(text, x + w / 2, y + h / 2 + 2), tone, size);
  }
  ctx.restore();
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = rgba(RIM_HOT, 0.45);
  ctx.fillRect(x - 6, y - 6, w + 12, 1.5);
  rivetLine(ctx, x + 4, y - 3, x + w - 4, y - 3, 60, STEEL);
}

/** 竖向挑出招牌：墙上两根支架挑出，暗底竖排霓虹字，外圈一道霓虹边。 */
export function bladeSign(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, tone: NeonTone): void {
  const { glow } = NEON_COLORS[tone];
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 24, y + 20, 30, 8);
  ctx.fillRect(x - 24, y + h - 30, 30, 8);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + 10, y + 12, w, h);
  radialGlow(ctx, x + w / 2, y + h / 2, h * 0.55, glow, 0.25);
  ctx.fillStyle = "#08080f";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  const inset = 10;
  neonLine(ctx, x + inset, y + inset, x + w - inset, y + inset, tone, 3);
  neonLine(ctx, x + w - inset, y + inset, x + w - inset, y + h - inset, tone, 3);
  neonLine(ctx, x + w - inset, y + h - inset, x + inset, y + h - inset, tone, 3);
  neonLine(ctx, x + inset, y + h - inset, x + inset, y + inset, tone, 3);
  const chars = [...text];
  const size = Math.min(w * 0.6, (h - inset * 4) / chars.length / 1.1);
  ctx.save();
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const start = y + (h - chars.length * size * 1.1) / 2 + size * 0.55;
  neonText(ctx, () => chars.forEach((ch, i) => ctx.fillText(ch, x + w / 2, start + i * size * 1.1)), tone, size);
  ctx.restore();
  ctx.fillStyle = rgba(RIM_HOT, 0.45);
  ctx.fillRect(x + w - 1.5, y, 1.5, h);
}

const POSTER_COLORS = ["#c9ccdf", "#8d7fb8", "#4d6fb0", "#b35a8c", "#3a8f95", "#d0b070", "#7a8096"];
const POSTER_WORDS = ["寻人", "出租", "招工", "演唱会", "搬家", "开锁", "回收", "失物"];

/** 海报墙：层叠的旧海报，边角撕裂，大字标题 + 细线正文，再压一层脏污。 */
export function posterWall(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  const count = Math.max(2, Math.round((w * h) / 9000));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < count; i++) {
    const pw = r.range(60, 110);
    const ph = pw * r.range(1.2, 1.5);
    const px = x + r.range(-10, w - pw + 10);
    const py = y + r.range(-10, h - ph + 10);
    const tilt = r.range(-0.05, 0.05);
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate(tilt);
    const c = r.pick(POSTER_COLORS);
    ctx.fillStyle = rgba(c, 0.55);
    ctx.beginPath();
    ctx.moveTo(-pw / 2, -ph / 2);
    ctx.lineTo(pw / 2, -ph / 2);
    ctx.lineTo(pw / 2, ph / 2 - r.range(0, 20));
    ctx.lineTo(pw / 2 - r.range(10, 30), ph / 2);
    ctx.lineTo(-pw / 2, ph / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba("#101020", 0.75);
    const size = pw * 0.28;
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(r.pick(POSTER_WORDS), 0, -ph / 2 + 8);
    for (let ly = -ph / 2 + size + 18; ly < ph / 2 - 10; ly += 9) ctx.fillRect(-pw / 2 + 8, ly, pw * r.range(0.5, 0.8), 3);
    ctx.restore();
  }
  fillTexture(ctx, "grime", x, y, w, h, 0.9, Math.round(x) % 97, 1.5);
  fillTexture(ctx, "grain", x, y, w, h, 0.8, Math.round(y) % 53, 1);
  ctx.restore();
}

const TAG_COLORS = ["#b04fd0", "#3fa8c8", "#c8487a", "#7c86d8", "#d0d4e8"];

/** 涂鸦：几道粗细变化的喷漆笔画，带下流的漆滴。 */
export function graffiti(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  const color = r.pick(TAG_COLORS);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(color, 0.55);
  const strokes = r.int(2, 4);
  for (let i = 0; i < strokes; i++) {
    ctx.lineWidth = r.range(5, 10);
    ctx.beginPath();
    let px = x + r.range(0, w * 0.3);
    let py = y + r.range(h * 0.2, h * 0.8);
    ctx.moveTo(px, py);
    const segs = r.int(3, 5);
    for (let k = 0; k < segs; k++) {
      const nx = px + r.range(20, w / segs + 20);
      const ny = y + r.range(0, h);
      ctx.bezierCurveTo(px + r.range(-20, 40), py - r.range(10, 50), nx - r.range(0, 30), ny + r.range(10, 50), nx, ny);
      px = nx;
      py = ny;
    }
    ctx.stroke();
  }
  ctx.fillStyle = rgba(color, 0.4);
  for (let i = 0; i < 5; i++) ctx.fillRect(x + r.range(0, w), y + r.range(h * 0.4, h), 2.5, r.range(10, 40));
  ctx.restore();
}
