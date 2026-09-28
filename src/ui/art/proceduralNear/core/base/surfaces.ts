import { hash01 } from "./random";
import { AMBIENT_SHADOW, rgba, type Ramp } from "./palette";
import { fillTexture } from "./grain";
import { rimEdge } from "../light/rim";

// 城市墙面材质：涂料 / 小瓷砖 / 红砖 / 金属挂板 / 石材 / 瓦楞板。
// 按格子用无状态哈希做明暗抖动（同一栋楼跨块绘制完全一致），再叠颗粒、流痕与贴地压暗。
// 格子尺寸都按真实比例（1m ≈ 130px）：瓷砖 0.2×0.1m、红砖 0.23×0.075m、挂板 1.2×0.6m、石材 0.9×0.6m。

export type WallKind = "paint" | "tile" | "brick" | "panel" | "stone" | "corrugated";

const cellTint = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, strength: number) => {
  const d = v - 0.5;
  ctx.fillStyle = d > 0 ? rgba("#c4d0ff", d * strength * 0.5) : rgba("#000000", -d * strength);
  ctx.fillRect(x, y, w, h);
};

function tiles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp, seed: number): void {
  const cw = 26;
  const ch = 13;
  for (let row = 0, ty = y; ty < y + h; row++, ty += ch) {
    for (let col = 0, tx = x; tx < x + w; col++, tx += cw) {
      const v = hash01(col * 7919 + row, seed);
      if (v > 0.985) {
        // 掉落的瓷砖：露出水泥底。
        ctx.fillStyle = ramp.deep;
        ctx.fillRect(tx, ty, cw, ch);
        continue;
      }
      cellTint(ctx, tx + 1, ty + 1, cw - 2, ch - 2, v, 0.22);
    }
    ctx.fillStyle = rgba(ramp.deep, 0.7);
    ctx.fillRect(x, ty + ch - 1, w, 1.2);
  }
  ctx.fillStyle = rgba(ramp.deep, 0.55);
  for (let tx = x + cw; tx < x + w; tx += cw) ctx.fillRect(tx - 0.6, y, 1.2, h);
  ctx.fillStyle = rgba(ramp.hi, 0.1);
  for (let ty = y + ch; ty < y + h; ty += ch) ctx.fillRect(x, ty, w, 1);
}

function bricks(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp, seed: number): void {
  const bw = 30;
  const bh = 10;
  ctx.fillStyle = rgba(ramp.deep, 0.75);
  for (let ty = y + bh; ty < y + h; ty += bh) ctx.fillRect(x, ty - 1, w, 2);
  for (let row = 0, ty = y; ty < y + h; row++, ty += bh) {
    const offset = row % 2 ? bw / 2 : 0;
    for (let col = -1, tx = x - offset; tx < x + w; col++, tx += bw) {
      const v = hash01(col * 6151 + row * 13, seed);
      cellTint(ctx, tx + 1, ty + 1, bw - 2, bh - 2, v, 0.3);
      ctx.fillStyle = rgba(ramp.deep, 0.75);
      ctx.fillRect(tx - 1, ty, 2, bh);
      if (v > 0.93) {
        ctx.fillStyle = rgba(ramp.hi, 0.18);
        ctx.fillRect(tx + 2, ty + 1, bw - 5, 1);
      }
    }
  }
}

function panels(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp, seed: number): void {
  const pw = 156;
  const ph = 78;
  for (let row = 0, ty = y; ty < y + h; row++, ty += ph) {
    for (let col = 0, tx = x; tx < x + w; col++, tx += pw) {
      const v = hash01(col * 4099 + row, seed);
      const g = ctx.createLinearGradient(0, ty, 0, ty + ph);
      g.addColorStop(0, rgba(ramp.hi, 0.12 + v * 0.08));
      g.addColorStop(0.2, rgba(ramp.hi, 0));
      g.addColorStop(1, rgba("#000000", 0.12 + (1 - v) * 0.12));
      ctx.fillStyle = g;
      ctx.fillRect(tx, ty, pw, ph);
      ctx.fillStyle = ramp.deep;
      ctx.fillRect(tx, ty + ph - 3, pw, 3);
      ctx.fillRect(tx + pw - 3, ty, 3, ph);
      ctx.fillStyle = rgba(ramp.hi, 0.4);
      for (const [sx, sy] of [[tx + 8, ty + 8], [tx + pw - 12, ty + 8], [tx + 8, ty + ph - 12], [tx + pw - 12, ty + ph - 12]]) ctx.fillRect(sx, sy, 3, 3);
    }
  }
}

function stones(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp, seed: number): void {
  const sw = 117;
  const sh = 78;
  for (let row = 0, ty = y; ty < y + h; row++, ty += sh) {
    const offset = row % 2 ? sw * 0.4 : 0;
    for (let col = -1, tx = x - offset; tx < x + w; col++, tx += sw) {
      const v = hash01(col * 3571 + row * 7, seed);
      cellTint(ctx, tx + 1, ty + 1, sw - 2, sh - 2, v, 0.28);
      if (v > 0.7) {
        // 石材天然纹路：一两道斜向细纹。
        ctx.strokeStyle = rgba(ramp.hi, 0.14);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx + sw * 0.1, ty + sh * (0.2 + v * 0.3));
        ctx.quadraticCurveTo(tx + sw * 0.5, ty + sh * v, tx + sw * 0.9, ty + sh * 0.8);
        ctx.stroke();
      }
      ctx.fillStyle = ramp.deep;
      ctx.fillRect(tx - 1, ty, 2, sh);
    }
    ctx.fillStyle = ramp.deep;
    ctx.fillRect(x, ty + sh - 1, w, 2);
    ctx.fillStyle = rgba(ramp.hi, 0.18);
    ctx.fillRect(x, ty + sh + 1, w, 1);
  }
}

function paint(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp, seed: number): void {
  // 补过的涂料：几块色差明显的大矩形 + 剥落处露出的底层 + 细裂缝。
  const count = Math.max(2, Math.round((w * h) / 90000));
  for (let i = 0; i < count; i++) {
    const px = x + hash01(i * 31, seed) * w * 0.85;
    const py = y + hash01(i * 31 + 1, seed) * h * 0.85;
    const pw = 60 + hash01(i * 31 + 2, seed) * 220;
    const ph = 40 + hash01(i * 31 + 3, seed) * 160;
    cellTint(ctx, px, py, pw, ph, hash01(i * 31 + 4, seed), 0.24);
  }
  for (let i = 0; i < count; i++) {
    const v = hash01(i * 17 + 400, seed);
    if (v < 0.4) continue;
    const px = x + hash01(i * 17 + 401, seed) * w;
    const py = y + hash01(i * 17 + 402, seed) * h;
    ctx.fillStyle = rgba(ramp.deep, 0.7);
    ctx.beginPath();
    ctx.ellipse(px, py, 10 + v * 26, 6 + v * 14, v * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(ramp.hi, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = rgba(ramp.deep, 0.8);
    ctx.beginPath();
    ctx.moveTo(px, py);
    let cx = px;
    let cy = py;
    for (let k = 0; k < 5; k++) {
      cx += (hash01(i * 17 + k * 3 + 500, seed) - 0.5) * 30;
      cy += 10 + hash01(i * 17 + k * 3 + 501, seed) * 18;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
}

function corrugated(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
  for (let rx = x; rx < x + w; rx += 14) {
    const g = ctx.createLinearGradient(rx, 0, rx + 14, 0);
    g.addColorStop(0, rgba("#000000", 0.28));
    g.addColorStop(0.35, rgba(ramp.hi, 0.12));
    g.addColorStop(0.55, rgba(ramp.hi, 0.02));
    g.addColorStop(1, rgba("#000000", 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(rx, y, 14, h);
  }
}

/**
 * 画一整面墙：底色 → 材质格 → 颗粒与流痕 → 左亮右暗 → 贴地压暗 → 边缘光。
 * 调用方负责之后再叠门窗等开口。
 */
export function wallSurface(
  ctx: CanvasRenderingContext2D,
  kind: WallKind,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  seed: number,
  rim = 1,
): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, ramp.light);
  g.addColorStop(Math.min(0.3, 60 / Math.max(1, h)), ramp.mid);
  g.addColorStop(1, ramp.dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (kind === "tile") tiles(ctx, x, y, w, h, ramp, seed);
  else if (kind === "brick") bricks(ctx, x, y, w, h, ramp, seed);
  else if (kind === "panel") panels(ctx, x, y, w, h, ramp, seed);
  else if (kind === "stone") stones(ctx, x, y, w, h, ramp, seed);
  else if (kind === "corrugated") corrugated(ctx, x, y, w, h, ramp);
  else paint(ctx, x, y, w, h, ramp, seed);
  fillTexture(ctx, "grain", x, y, w, h, 0.55, seed % 509, 1.6);
  fillTexture(ctx, "grime", x, y, w, h, 0.45, seed % 317, 2.2);
  const side = ctx.createLinearGradient(x, 0, x + w, 0);
  side.addColorStop(0, rgba("#b8c8ff", 0.06));
  side.addColorStop(0.2, rgba("#b8c8ff", 0));
  side.addColorStop(0.75, rgba(AMBIENT_SHADOW, 0));
  side.addColorStop(1, rgba(AMBIENT_SHADOW, 0.38));
  ctx.fillStyle = side;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  if (rim > 0) rimEdge(ctx, x, y, w, h, rim);
}

/** 窗台 / 挑檐下方的雨水流痕：几道向下淡出的暗色细带。 */
export function dripStains(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, len: number, seed: number, alpha = 0.35): void {
  const count = Math.max(2, Math.round(w / 22));
  for (let i = 0; i < count; i++) {
    const v = hash01(i * 97, seed);
    if (v < 0.3) continue;
    const sx = x + hash01(i * 97 + 1, seed) * w;
    const sw = 3 + v * 9;
    const sl = len * (0.35 + hash01(i * 97 + 2, seed) * 0.65);
    const g = ctx.createLinearGradient(0, y, 0, y + sl);
    g.addColorStop(0, rgba(AMBIENT_SHADOW, alpha * v));
    g.addColorStop(1, rgba(AMBIENT_SHADOW, 0));
    ctx.fillStyle = g;
    ctx.fillRect(sx, y, sw, sl);
  }
}
