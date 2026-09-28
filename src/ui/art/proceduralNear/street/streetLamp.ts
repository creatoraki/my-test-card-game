import type { LightTone, NeonTone, StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { NEON_COLORS, RIM_HOT, STEEL, lightCore, lightGlow, rgba } from "../core/base/palette";
import { lightCone, radialGlow } from "../core/light/glow";
import { FONT } from "../core/fixtures/signs";
import { contactShadow, label, lightSpot, tube, type StreetSpec } from "./common";

// 路灯：约 4.5m 高。石墩底座 + 渐细灯杆 + 弯臂 + 长条灯头，向下打一道长光锥；
// 灯杆上偶尔挂两面竖旗或一块"禁止停车"小牌，杆身贴着小广告。

const POLE_H = 585;
const ARM = 130;

function lampTone(seed: number): LightTone {
  return seed % 5 === 0 ? "cyan" : "white";
}

/** 灯头朝向：种子决定弯臂向左还是向右，灯位与绘制同源。 */
function headX(x: number, width: number, seed: number): number {
  return seed % 2 ? x + width - 30 - ARM : x + 30 + ARM;
}

function poleX(x: number, width: number, seed: number): number {
  return seed % 2 ? x + width - 30 : x + 30;
}

function banner(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, tone: NeonTone, text: string): void {
  const w = 54;
  const h = 170;
  const bx = dir > 0 ? x + 8 : x - 8 - w;
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(Math.min(x, bx), y - 4, Math.abs(bx - x) + w, 4);
  ctx.fillRect(Math.min(x, bx), y + h, Math.abs(bx - x) + w, 4);
  const { core, glow } = NEON_COLORS[tone];
  const g = ctx.createLinearGradient(bx, 0, bx + w, 0);
  g.addColorStop(0, rgba(glow, 0.75));
  g.addColorStop(1, rgba(glow, 0.45));
  ctx.fillStyle = "#0b0a16";
  ctx.fillRect(bx, y, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(bx, y, w, h);
  ctx.save();
  ctx.font = `900 30px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = core;
  [...text].forEach((ch, i) => ctx.fillText(ch, bx + w / 2, y + 30 + i * 36));
  ctx.restore();
}

function drawStreetLamp(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const px = poleX(p.x, p.width, p.seed);
  const hx = headX(p.x, p.width, p.seed);
  const dir = hx > px ? 1 : -1;
  const tone = lampTone(p.seed);
  const top = g - POLE_H;
  contactShadow(ctx, px, g, 110);
  // 灯头光锥先画，杆身压在上面。
  lightCone(ctx, hx, top + 20, 160, POLE_H - 40, tone, 0.13);
  // 底座石墩。
  const baseW = 40;
  const bg = ctx.createLinearGradient(px - baseW / 2, 0, px + baseW / 2, 0);
  bg.addColorStop(0, STEEL.light);
  bg.addColorStop(0.4, STEEL.mid);
  bg.addColorStop(1, STEEL.deep);
  ctx.fillStyle = bg;
  ctx.fillRect(px - baseW / 2, g - 70, baseW, 70);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(px - baseW / 2 - 4, g - 74, baseW + 8, 6);
  // 渐细灯杆（两段）。
  tube(ctx, px - 8, g - 300, g - 70, 16, STEEL);
  tube(ctx, px - 6, top + 10, g - 300, 12, STEEL);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(px - 10, g - 304, 20, 8);
  // 弯臂。
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, top + 40);
  ctx.quadraticCurveTo(px, top, px + dir * 50, top + 4);
  ctx.lineTo(hx, top + 8);
  ctx.stroke();
  ctx.strokeStyle = rgba(RIM_HOT, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 灯头。
  const core = lightCore(tone);
  ctx.fillStyle = STEEL.deep;
  ctx.beginPath();
  ctx.moveTo(hx - 44, top + 20);
  ctx.lineTo(hx - 36, top + 4);
  ctx.lineTo(hx + 36, top + 4);
  ctx.lineTo(hx + 44, top + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = core;
  ctx.fillRect(hx - 38, top + 19, 76, 4);
  radialGlow(ctx, hx, top + 22, 140, lightGlow(tone), 0.4);
  radialGlow(ctx, hx, top + 22, 36, core, 0.6);
  // 杆上挂件。
  const roll = r.next();
  if (roll < 0.4) banner(ctx, px, g - 470, -dir, r.chance(0.5) ? "pink" : "violet", r.pick(["夜市", "旧城", "欢迎"]));
  else if (roll < 0.6) label(ctx, "禁止停车", px, g - 360, "#f0d8e0", "#5a1426");
  for (let i = 0; i < 3; i++) {
    if (!r.chance(0.5)) continue;
    ctx.fillStyle = rgba(r.pick(["#c9ccdf", "#b35a8c", "#d0b070"]), 0.55);
    ctx.fillRect(px - 7, g - 120 - i * 50 - r.range(0, 20), 14, r.range(18, 30));
  }
}

export const streetLampSpec: StreetSpec = {
  kind: "streetLamp",
  label: "路灯",
  width: [190, 190],
  lamps: (p) => [lightSpot(headX(p.x, p.width, p.seed), p.ground - POLE_H + 22, lampTone(p.seed))],
  draw: drawStreetLamp,
};
