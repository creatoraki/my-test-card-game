import type { LightTone } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, AWNING_PAIRS, RIM_HOT, STEEL, lightCore, lightGlow, rgba, type Ramp } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { fillTexture } from "../core/base/grain";
import { lightCone, radialGlow } from "../core/light/glow";

// 雨棚：条纹布雨棚（斜面 + 波浪垂边 + 侧支撑臂）与金属挑棚（底面 LED 灯带 + 筒灯 + 斜拉杆）。

/** 条纹布雨棚：y 为棚顶挂线，drop 为正视下斜面的可见高度。 */
export function stripedAwning(ctx: CanvasRenderingContext2D, r: Random, x: number, w: number, y: number, drop = 84): void {
  const [a, b] = r.pick(AWNING_PAIRS);
  const valance = 22;
  const out = 14;
  shadeDown(ctx, x, y + drop + valance, w, 90, 0.6);
  const path = new Path2D();
  path.moveTo(x, y);
  path.lineTo(x + w, y);
  path.lineTo(x + w + out, y + drop);
  path.lineTo(x - out, y + drop);
  path.closePath();
  ctx.save();
  ctx.clip(path);
  const stripe = 39;
  for (let i = 0, sx = x - out; sx < x + w + out; i++, sx += stripe) {
    ctx.fillStyle = i % 2 ? b : a;
    ctx.fillRect(sx, y, stripe, drop);
  }
  const g = ctx.createLinearGradient(0, y, 0, y + drop);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, 0.6));
  g.addColorStop(0.5, rgba(AMBIENT_SHADOW, 0.25));
  g.addColorStop(1, rgba("#b8c8ff", 0.08));
  ctx.fillStyle = g;
  ctx.fillRect(x - out, y, w + out * 2, drop);
  fillTexture(ctx, "grime", x - out, y, w + out * 2, drop, 0.7, Math.round(x) % 131, 1.6);
  fillTexture(ctx, "grain", x - out, y, w + out * 2, drop, 0.6, Math.round(x) % 71, 1.2);
  ctx.restore();
  // 波浪垂边。
  const vy = y + drop;
  const scallop = 26;
  for (let i = 0, sx = x - out; sx < x + w + out; i++, sx += scallop) {
    ctx.fillStyle = Math.floor((sx - x + out) / stripe) % 2 ? b : a;
    ctx.beginPath();
    ctx.moveTo(sx, vy);
    ctx.lineTo(sx + scallop, vy);
    ctx.lineTo(sx + scallop, vy + valance * 0.55);
    ctx.quadraticCurveTo(sx + scallop / 2, vy + valance * 1.2, sx, vy + valance * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.45);
  ctx.fillRect(x - out, vy, w + out * 2, 5);
  ctx.fillStyle = rgba(RIM_HOT, 0.35);
  ctx.fillRect(x, y, w, 1.5);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 4, y - 6, w + 8, 8);
  // 两端支撑臂。
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 3;
  for (const ex of [x - out + 4, x + w + out - 4]) {
    ctx.beginPath();
    ctx.moveTo(ex, vy);
    ctx.lineTo(ex + (ex < x + w / 2 ? 10 : -10), y + drop + 70);
    ctx.stroke();
  }
}

/** 金属挑棚：y 为棚板上沿；底面一条灯带 + 筒灯，向下打出光锥。 */
export function metalCanopy(ctx: CanvasRenderingContext2D, x: number, w: number, y: number, ramp: Ramp, tone: LightTone, thick = 30): void {
  const glow = lightGlow(tone);
  const core = lightCore(tone);
  // 斜拉杆。
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 3;
  for (const t of [0.15, 0.85]) {
    ctx.beginPath();
    ctx.moveTo(x + w * t, y - 110);
    ctx.lineTo(x + w * t + (t < 0.5 ? 60 : -60), y);
    ctx.stroke();
  }
  for (let lx = x + 50; lx < x + w - 30; lx += 110) lightCone(ctx, lx, y + thick, 60, 260, tone, 0.12);
  const g = ctx.createLinearGradient(0, y, 0, y + thick);
  g.addColorStop(0, ramp.hi);
  g.addColorStop(0.2, ramp.mid);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x - 10, y, w + 20, thick);
  ctx.fillStyle = rgba(RIM_HOT, 0.4);
  ctx.fillRect(x - 10, y, w + 20, 1.5);
  ctx.fillStyle = rgba(core, 0.95);
  ctx.fillRect(x - 6, y + thick - 4, w + 12, 3);
  radialGlow(ctx, x + w / 2, y + thick, w * 0.6, glow, 0.2);
  for (let lx = x + 50; lx < x + w - 30; lx += 110) {
    ctx.fillStyle = core;
    ctx.fillRect(lx - 8, y + thick - 2, 16, 3);
    radialGlow(ctx, lx, y + thick + 2, 26, glow, 0.5);
  }
}
