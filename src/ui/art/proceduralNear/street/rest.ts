import type { NeonTone, StreetPlacement } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { ALLOY, AMBIENT_SHADOW, AWNING_PAIRS, NAVY, NEON_COLORS, RIM, RIM_HOT, STEEL, TEAL, rgba } from "../core/base/palette";
import { lightCone, radialGlow } from "../core/light/glow";
import { holoScreen } from "../core/light/holo";
import { box, contactShadow, label, lightSpot, tube, type StreetSpec } from "./common";

// 候车休憩：公交站亭（顶棚 + 玻璃背板 + 广告灯箱 + 站牌 + 长凳）、休息长椅、带遮阳帆的座椅。

const SLAT = ["#2a2433", "#342c3e", "#241f2c"];
const ROUTES = ["12路", "夜3路", "27路", "环线", "105路", "夜8路"];

/** 长椅：两端铸铁腿 + 座面前沿 + 三道靠背板，seat 为座面高度。 */
function drawBench(ctx: CanvasRenderingContext2D, r: Random, x: number, w: number, ground: number): void {
  const seat = 58;
  const back = 112;
  contactShadow(ctx, x + w / 2, ground, w * 1.1, 0.5);
  // 靠背：三道板。
  for (let i = 0; i < 3; i++) {
    const y = ground - back + i * 16;
    ctx.fillStyle = r.pick(SLAT);
    ctx.fillRect(x + 8, y, w - 16, 12);
    ctx.fillStyle = rgba("#9fb0e8", 0.18);
    ctx.fillRect(x + 8, y, w - 16, 1.5);
  }
  // 座面：前沿板 + 板面反光。
  ctx.fillStyle = "#1c1824";
  ctx.fillRect(x + 4, ground - seat - 10, w - 8, 10);
  ctx.fillStyle = "#3a3346";
  ctx.fillRect(x + 4, ground - seat - 14, w - 8, 5);
  ctx.fillStyle = rgba(RIM_HOT, 0.35);
  ctx.fillRect(x + 4, ground - seat - 14, w - 8, 1.2);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + 8, ground - seat, w - 16, 8);
  // 两端铸铁腿（带扶手）。
  for (const lx of [x, x + w - 16]) {
    ctx.fillStyle = STEEL.dark;
    ctx.fillRect(lx, ground - back, 16, back);
    ctx.fillStyle = STEEL.hi;
    ctx.fillRect(lx, ground - back, 3, back);
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(lx - 6, ground - seat - 30, 28, 8);
    ctx.fillRect(lx - 4, ground - 6, 24, 6);
  }
  if (r.chance(0.35)) {
    // 座面上遗落的纸杯或报纸。
    ctx.fillStyle = "#c9ccdf";
    ctx.fillRect(x + w * r.range(0.3, 0.6), ground - seat - 36, 18, 22);
  }
}

function drawBusStop(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const h = 340;
  const tone: NeonTone = r.chance(0.5) ? "cyan" : "pink";
  const adLeft = r.chance(0.5);
  const adW = 150;
  const shelterW = p.width - 110;
  const sx = adLeft ? p.x + 110 : p.x;
  contactShadow(ctx, sx + shelterW / 2, g, shelterW * 1.1, 0.5);
  // 玻璃背板。
  ctx.fillStyle = rgba("#9fb6ff", 0.1);
  ctx.fillRect(sx + 10, g - h + 36, shelterW - 20, h - 60);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(sx, g - h, sx + shelterW, g);
  sheen.addColorStop(0.3, rgba(RIM, 0));
  sheen.addColorStop(0.4, rgba(RIM, 0.14));
  sheen.addColorStop(0.46, rgba(RIM, 0));
  ctx.fillStyle = sheen;
  ctx.fillRect(sx + 10, g - h + 36, shelterW - 20, h - 60);
  ctx.restore();
  ctx.fillStyle = STEEL.mid;
  ctx.fillRect(sx + 10, g - h * 0.45, shelterW - 20, 5);
  // 广告灯箱（站亭一端）。
  const adX = adLeft ? sx + 12 : sx + shelterW - adW - 12;
  holoScreen(ctx, adX, g - h + 60, adW, 220, tone, r.seed(), r.pick([["夏夜", "冰饮"], ["新城", "地产"], ["深夜", "电台"], ["限时", "特惠"]]));
  // 长凳。
  const benchX = adLeft ? adX + adW + 20 : sx + 24;
  drawBench(ctx, r, benchX, Math.min(260, shelterW - adW - 60), g);
  // 立柱。
  for (const px of [sx, sx + shelterW - 12]) tube(ctx, px, g - h + 20, g, 12, STEEL);
  // 顶棚：略向前倾的薄板 + 底面灯带。
  lightCone(ctx, sx + shelterW / 2, g - h + 30, shelterW * 0.45, h - 30, "white", 0.1);
  box(ctx, sx - 20, g - h, shelterW + 40, 30, ALLOY);
  ctx.fillStyle = rgba(NEON_COLORS.cyan.core, 0.9);
  ctx.fillRect(sx - 10, g - h + 28, shelterW + 20, 3);
  radialGlow(ctx, sx + shelterW / 2, g - h + 30, shelterW * 0.5, NEON_COLORS.cyan.glow, 0.18);
  // 站牌：立杆 + 顶部站名牌 + 线路列表。
  const poleX = adLeft ? p.x + 40 : p.x + p.width - 50;
  tube(ctx, poleX, g - h - 20, g, 10, STEEL);
  box(ctx, poleX - 50, g - h - 20, 110, 160, NAVY);
  ctx.fillStyle = rgba(NEON_COLORS.cyan.glow, 0.25);
  ctx.fillRect(poleX - 44, g - h - 12, 98, 36);
  label(ctx, "公交站", poleX + 5, g - h + 6, "#e6f6ff", "#123a6a");
  const routes = r.int(2, 3);
  for (let i = 0; i < routes; i++) label(ctx, ROUTES[(p.seed + i * 3) % ROUTES.length], poleX + 5, g - h + 46 + i * 32);
}

function drawBenchItem(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  drawBench(ctx, createRandom(p.seed), p.x, p.width, p.ground);
}

/** 带遮阳帆的座椅：两根立柱撑一面三角帆布，下面一条长椅，旁边一只方形花箱。 */
function drawShelterSeat(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const [a, b] = r.pick(AWNING_PAIRS);
  const planterW = 90;
  const seatX = p.x + planterW + 20;
  const seatW = p.width - planterW - 20;
  tube(ctx, seatX + 6, g - 320, g, 10, STEEL);
  tube(ctx, seatX + seatW - 16, g - 300, g, 10, STEEL);
  const sail = new Path2D();
  sail.moveTo(seatX - 10, g - 330);
  sail.quadraticCurveTo(seatX + seatW / 2, g - 280, seatX + seatW + 10, g - 310);
  sail.lineTo(seatX + seatW * 0.55, g - 250);
  sail.closePath();
  const grad = ctx.createLinearGradient(seatX, g - 330, seatX + seatW, g - 250);
  grad.addColorStop(0, b);
  grad.addColorStop(1, a);
  ctx.fillStyle = grad;
  ctx.fill(sail);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.35);
  ctx.fill(sail);
  ctx.strokeStyle = rgba(RIM_HOT, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke(sail);
  drawBench(ctx, r, seatX + 20, seatW - 40, g);
  // 花箱 + 灌木。
  contactShadow(ctx, p.x + planterW / 2, g, planterW * 1.2);
  box(ctx, p.x, g - 80, planterW, 80, r.chance(0.5) ? TEAL : NAVY);
  ctx.fillStyle = "#0b1a1c";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(p.x + 12 + i * 17, g - 96 - r.range(0, 20), 22, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = rgba("#6fe0c8", 0.14);
  ctx.fillRect(p.x + 4, g - 124, planterW - 8, 3);
}

export const busStopSpec: StreetSpec = {
  kind: "busStop",
  label: "公交站",
  width: [560, 640],
  lamps: (p) => [lightSpot(p.x + p.width / 2, p.ground - 310, "cyan", "strip")],
  draw: drawBusStop,
};

export const benchSpec: StreetSpec = {
  kind: "bench",
  label: "休息长椅",
  width: [220, 260],
  lamps: () => [],
  draw: drawBenchItem,
};

export const shelterSeatSpec: StreetSpec = {
  kind: "shelterSeat",
  label: "遮阳座椅",
  width: [380, 440],
  lamps: () => [],
  draw: drawShelterSeat,
};
