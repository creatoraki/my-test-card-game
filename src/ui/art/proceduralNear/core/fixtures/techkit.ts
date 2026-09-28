import type { LightTone, NeonTone } from "../../types";
import type { Random } from "../base/random";
import { LED_COLORS, NEON_COLORS, RIM, RIM_HOT, STEEL, lightGlow, rgba, type Ramp } from "../base/palette";
import { radialGlow } from "../light/glow";

// 科技材质：分块金属蒙皮、玻璃幕墙、状态灯、液位管、发光环、垂坠线缆。
// 随机只来自调用方传入的 Random（由建筑种子派生），保证跨块绘制一致。

/** 一排状态指示灯：小方点 + 光晕。 */
export function ledDots(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, count: number, step: number, colors = LED_COLORS): void {
  for (let i = 0; i < count; i++) {
    const color = r.pick(colors);
    const lx = x + i * step;
    if (r.chance(0.25)) {
      ctx.fillStyle = rgba(color, 0.25);
      ctx.fillRect(lx - 1.5, y - 1.5, 3, 3);
      continue;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(lx - 1, y - 1, 2, 2);
    ctx.fillStyle = rgba(color, 0.9);
    ctx.fillRect(lx - 1.5, y - 1.5, 3, 3);
    radialGlow(ctx, lx, y, 7, color, 0.5);
  }
}

/**
 * 分块金属蒙皮：按列 / 行切成面板，面板间暗缝，个别缝线发光；再点缀状态灯组与百叶细缝。
 * 先由 shadeBox 画好体块明暗，再叠这一层。
 */
export function techPanels(
  ctx: CanvasRenderingContext2D,
  r: Random,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  tone: NeonTone,
): void {
  const cols = Math.max(1, Math.round(w / r.range(46, 70)));
  const colW = w / cols;
  const glow = NEON_COLORS[tone].glow;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let c = 0; c < cols; c++) {
    const px = x + c * colW;
    let py = y;
    while (py < y + h) {
      const ph = Math.min(y + h - py, r.range(48, 96));
      const tint = r.next() - 0.5;
      ctx.fillStyle = tint > 0 ? rgba("#b8c8ff", tint * 0.08) : rgba("#000000", -tint * 0.22);
      ctx.fillRect(px + 2, py + 2, colW - 3, ph - 3);
      ctx.fillStyle = ramp.deep;
      ctx.fillRect(px, py + ph - 2, colW, 2);
      ctx.fillStyle = rgba(ramp.hi, 0.3);
      ctx.fillRect(px, py + ph, colW, 1);
      if (r.chance(0.1)) {
        ctx.fillStyle = rgba(NEON_COLORS[tone].core, 0.8);
        ctx.fillRect(px + 4, py + ph - 1.5, colW - 8, 1);
        radialGlow(ctx, px + colW / 2, py + ph - 1, colW * 0.7, glow, 0.2);
      }
      py += ph;
    }
    ctx.fillStyle = ramp.deep;
    ctx.fillRect(px + colW - 1, y, 2, h);
    ctx.fillStyle = rgba(ramp.hi, 0.22);
    ctx.fillRect(px + colW + 1, y, 1, h);
  }
  const clusters = Math.min(3, Math.floor((w * h) / 22000));
  for (let i = 0; i < clusters; i++) {
    const n = r.int(3, 5);
    const lx = x + r.range(8, Math.max(9, w - n * 7 - 8));
    const ly = y + r.range(12, Math.max(13, h - 12));
    ctx.fillStyle = rgba("#000000", 0.5);
    ctx.fillRect(lx - 5, ly - 5, n * 7 + 3, 10);
    ledDots(ctx, r, lx, ly, n, 7);
  }
  if (r.chance(0.6) && h > 60 && w > 60) {
    const vx = x + r.range(8, w - 50);
    const vy = y + r.range(10, h - 40);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = rgba("#000000", 0.55);
      ctx.fillRect(vx, vy + i * 5, 40, 2);
      ctx.fillStyle = rgba(ramp.hi, 0.25);
      ctx.fillRect(vx, vy + i * 5 + 2, 40, 1);
    }
  }
  ctx.restore();
}

/** 暗玻璃幕墙：斜向天光反射 + 竖挺横档 + 零星亮格。 */
export function glassCurtain(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: LightTone): void {
  const base = ctx.createLinearGradient(0, y, 0, y + h);
  base.addColorStop(0, "#1d2754");
  base.addColorStop(0.5, "#0b1026");
  base.addColorStop(1, "#070a18");
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(x, y, x + w * 0.9, y + h);
  sheen.addColorStop(0, rgba(RIM, 0));
  sheen.addColorStop(0.38, rgba(RIM, 0));
  sheen.addColorStop(0.46, rgba(RIM, 0.2));
  sheen.addColorStop(0.52, rgba(RIM, 0.05));
  sheen.addColorStop(0.6, rgba(RIM, 0.12));
  sheen.addColorStop(0.68, rgba(RIM, 0));
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "source-over";
  const cellW = 26;
  const cellH = 34;
  const glow = lightGlow(tone);
  for (let cy = y; cy < y + h; cy += cellH) {
    for (let cx = x; cx < x + w; cx += cellW) {
      if (!r.chance(0.07)) continue;
      ctx.fillStyle = rgba(glow, r.range(0.25, 0.55));
      ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
    }
  }
  ctx.fillStyle = STEEL.deep;
  for (let cx = x + cellW; cx < x + w; cx += cellW) ctx.fillRect(cx - 1, y, 2, h);
  for (let cy = y + cellH; cy < y + h; cy += cellH) ctx.fillRect(x, cy - 1, w, 2);
  ctx.fillStyle = rgba(RIM_HOT, 0.14);
  for (let cx = x + cellW; cx < x + w; cx += cellW) ctx.fillRect(cx + 1, y, 1, h);
  ctx.restore();
}

/** 竖向液位管：暗玻璃管 + 发光液柱 + 刻度。 */
export function gauge(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, tone: NeonTone, level: number): void {
  const { core, glow } = NEON_COLORS[tone];
  const w = 10;
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - w / 2 - 3, y - 4, w + 6, h + 8);
  ctx.fillStyle = "#050814";
  ctx.fillRect(x - w / 2, y, w, h);
  const fill = h * level;
  const g = ctx.createLinearGradient(0, y + h - fill, 0, y + h);
  g.addColorStop(0, core);
  g.addColorStop(0.15, glow);
  g.addColorStop(1, rgba(glow, 0.6));
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2 + 2, y + h - fill, w - 4, fill);
  radialGlow(ctx, x, y + h - fill / 2, Math.max(24, fill * 0.6), glow, 0.25);
  ctx.fillStyle = rgba("#ffffff", 0.25);
  ctx.fillRect(x - w / 2 + 1, y, 1, h);
  ctx.fillStyle = STEEL.light;
  for (let ty = y + 8; ty < y + h; ty += 12) ctx.fillRect(x + w / 2 + 1, ty, 4, 1);
}

/** 圆柱体上的一圈发光环。 */
export function glowRing(ctx: CanvasRenderingContext2D, x: number, w: number, y: number, tone: NeonTone): void {
  const { core, glow } = NEON_COLORS[tone];
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 2, y - 3, w + 4, 6);
  ctx.save();
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fillRect(x + w * 0.08, y - 1, w * 0.84, 2);
  ctx.restore();
  ctx.fillStyle = rgba(core, 0.85);
  ctx.fillRect(x + w * 0.15, y - 0.5, w * 0.5, 1);
}

/** 垂坠线缆：二次曲线，暗色主体 + 顶面一道冷色微光。 */
export function cable(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, sag: number, width: number): void {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + sag * 2;
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.strokeStyle = "#04050a";
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.translate(0, -width * 0.35);
  ctx.strokeStyle = rgba(RIM, 0.35);
  ctx.lineWidth = Math.max(0.8, width * 0.3);
  ctx.stroke();
  ctx.restore();
}
