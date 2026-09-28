import type { BuildingPlacement, NeonTone } from "../types";
import { createRandom } from "../core/base/random";
import { AMBIENT_SHADOW, NEON_COLORS, RIM, RIM_HOT, STEEL, STONE, TILE, lightCore, lightGlow, rgba } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { wallSurface } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";
import { FONT } from "../core/fixtures/signs";
import { lightBox } from "../facade/signage";
import { BASE, doorSpot, floorY, type BuildingSpec } from "./common";

// 地铁出入口：两道 1.1m 高的石材矮墙夹着向下的楼梯口；上方是钢架玻璃雨棚，
// 棚前挂站名灯箱，一侧立"地铁"标志柱。楼梯口里能看到向下延伸的瓷砖墙与一格格往下走的顶灯。

const WALL_W = 70;
const LINE_NAMES = ["三号线 · 旧港站", "一号线 · 霓虹街站", "五号线 · 北塔站", "二号线 · 夜市口站"] as const;

/** 楼梯口：瓷砖后墙被顶灯照亮、越往下越暗；顶灯沿斜线逐格下沉，扶手斜向没入黑暗。 */
function stairwell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void {
  wallSurface(ctx, "tile", x, y, w, h, TILE, seed, 0);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(lightGlow("white"), 0.25));
  g.addColorStop(0.45, rgba(AMBIENT_SHADOW, 0.35));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0.92));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 逐格下沉的顶灯。
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const lx = x + w * (0.12 + t * 0.72);
    const ly = y + 30 + t * h * 0.62;
    const lw = 70 * (1 - t * 0.6);
    const a = 1 - t * 0.85;
    ctx.fillStyle = rgba(lightCore("white"), 0.9 * a);
    ctx.fillRect(lx - lw / 2, ly, lw, 5 * (1 - t * 0.5));
    radialGlow(ctx, lx, ly + 3, 60 * (1 - t * 0.5), lightGlow("white"), 0.3 * a);
  }
  // 斜向扶手。
  ctx.strokeStyle = rgba(RIM_HOT, 0.45);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + h * 0.42);
  ctx.lineTo(x + w - 20, y + h * 0.98);
  ctx.stroke();
  ctx.fillStyle = rgba(lightCore("white"), 0.6);
  ctx.font = `900 30px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("出口 →", x + 24, y + 54);
  shadeDown(ctx, x, y, w, 40, 0.6);
}

/** 石材矮墙：顶面压顶石 + 不锈钢扶手。 */
function lowWall(ctx: CanvasRenderingContext2D, x: number, w: number, seed: number): void {
  const h = 143;
  wallSurface(ctx, "stone", x, BASE - h, w, h, STONE, seed);
  ctx.fillStyle = STONE.hi;
  ctx.fillRect(x - 6, BASE - h - 10, w + 12, 12);
  ctx.fillStyle = STONE.deep;
  ctx.fillRect(x - 6, BASE - h, w + 12, 3);
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(x + w / 2 - 3, BASE - h - 60, 6, 50);
  ctx.fillStyle = rgba(RIM_HOT, 0.6);
  ctx.fillRect(x - 10, BASE - h - 64, w + 20, 5);
}

/** 钢架玻璃雨棚：拱形顶梁 + 玻璃板 + 底面灯带。 */
function canopy(ctx: CanvasRenderingContext2D, x: number, w: number, y: number, tone: NeonTone): void {
  const glow = NEON_COLORS[tone].glow;
  const rise = 40;
  const path = new Path2D();
  path.moveTo(x - 30, y);
  path.quadraticCurveTo(x + w / 2, y - rise * 2, x + w + 30, y);
  path.lineTo(x + w + 30, y + 26);
  path.quadraticCurveTo(x + w / 2, y + 26 - rise * 2, x - 30, y + 26);
  path.closePath();
  ctx.fillStyle = rgba("#9fb6ff", 0.16);
  ctx.fill(path);
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 5;
  ctx.stroke(path);
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = STEEL.dark;
  for (let bx = x - 30; bx < x + w + 30; bx += 80) ctx.fillRect(bx, y - rise * 2, 5, rise * 2 + 30);
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(x, y - rise, x + w, y + 26);
  sheen.addColorStop(0, rgba(RIM, 0.3));
  sheen.addColorStop(0.5, rgba(RIM, 0.05));
  sheen.addColorStop(1, rgba(RIM, 0.2));
  ctx.fillStyle = sheen;
  ctx.fillRect(x - 30, y - rise * 2, w + 60, rise * 2 + 30);
  ctx.restore();
  ctx.fillStyle = rgba(NEON_COLORS[tone].core, 0.9);
  ctx.fillRect(x - 20, y + 24, w + 40, 3);
  radialGlow(ctx, x + w / 2, y + 30, w * 0.7, glow, 0.25);
}

/** 标志柱：竖向灯箱，顶部圆形站徽写"铁"，下面竖排"地铁"。 */
function pylon(ctx: CanvasRenderingContext2D, x: number, tone: NeonTone): void {
  const w = 76;
  const h = 360;
  const y = BASE - h;
  const { core, glow } = NEON_COLORS[tone];
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + 8, y + 10, w, h);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x, y, w, 2);
  radialGlow(ctx, x + w / 2, y + 60, 110, glow, 0.35);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 50, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.font = `900 34px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("铁", x + w / 2, y + 52);
  ctx.fillStyle = rgba(core, 0.9);
  ctx.font = `900 40px ${FONT}`;
  ctx.fillText("地", x + w / 2, y + 130);
  ctx.fillText("铁", x + w / 2, y + 178);
  ctx.fillStyle = rgba(glow, 0.9);
  ctx.fillRect(x + 10, y + 214, w - 20, 6);
  ctx.fillStyle = rgba(RIM_HOT, 0.4);
  ctx.fillRect(x + w - 1.5, y, 1.5, h);
}

function drawMetro(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const canopyY = floorY(p.storeys);
  const door = p.lamps.find((lamp) => lamp.door) ?? p.lamps[0];
  const tone: NeonTone = door.tone === "white" || door.tone === "warm" ? "cyan" : door.tone;
  const pylonLeft = r.chance(0.5);
  const x0 = p.x + (pylonLeft ? 110 : 0);
  const x1 = p.x + p.width - (pylonLeft ? 0 : 110);
  const inner = x1 - x0 - WALL_W * 2;

  // 雨棚立柱。
  for (const px of [x0 + WALL_W / 2 - 6, x1 - WALL_W / 2 - 6]) {
    ctx.fillStyle = STEEL.mid;
    ctx.fillRect(px, canopyY + 20, 12, BASE - canopyY - 20);
    ctx.fillStyle = STEEL.hi;
    ctx.fillRect(px, canopyY + 20, 2, BASE - canopyY - 20);
  }
  stairwell(ctx, x0 + WALL_W, canopyY + 30, inner, BASE - canopyY - 30, p.seed);
  lowWall(ctx, x0, WALL_W, p.seed + 1);
  lowWall(ctx, x1 - WALL_W, WALL_W, p.seed + 2);
  canopy(ctx, x0, x1 - x0, canopyY, tone);
  // 站名灯箱立在雨棚拱顶上，两根短撑杆。
  ctx.fillStyle = STEEL.dark;
  for (const t of [0.3, 0.7]) ctx.fillRect(x0 + (x1 - x0) * t - 4, canopyY - 60, 8, 40);
  lightBox(ctx, x0 + 30, canopyY - 118, x1 - x0 - 60, 64, `地铁 ${r.pick(LINE_NAMES)}`, tone, true, r.seed());
  pylon(ctx, pylonLeft ? p.x + 10 : p.x + p.width - 86, tone);
}

export const metroEntranceSpec: BuildingSpec = {
  kind: "metroEntrance",
  label: "地铁出入口",
  width: [620, 760],
  storeys: [0.72],
  crown: 150,
  weight: 0.5,
  lamps: (x, w, storeys, rnd) => [
    doorSpot(x + w / 2, floorY(storeys) + 28, rnd.chance(0.5) ? "cyan" : "white", "strip"),
  ],
  draw: drawMetro,
};
