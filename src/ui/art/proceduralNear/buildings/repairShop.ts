import type { BuildingPlacement } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { AMBIENT_SHADOW, BRICK, CONCRETE, OXIDE, STEEL, lightCore, lightGlow, rgba } from "../core/base/palette";
import { wallSurface } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";
import { neonSign } from "../core/fixtures/signs";
import { steelDoor } from "../core/fixtures/rivets";
import { cornerShadow, parapet, plinth, slabBand } from "../facade/storey";
import { rollerShutter } from "../facade/storefront";
import { graffiti, posterWall } from "../facade/signage";
import { rooftopKit } from "../facade/rooftop";
import { doorLamp, downpipe, meterBox, wireRun } from "../facade/wallKit";
import { BASE, doorSpot, floorY, lampTone, neonOf, type BuildingSpec } from "./common";

// 维修车铺：一层高挑。4m 宽的大卷帘半开，露出工位（工具板、轮胎、吊灯、摩托剪影）；
// 上半截瓦楞铁皮，霓虹大字招牌；侧面一扇小铁门挂壁灯，门外堆轮胎。

const SHUTTER_W = 520;
const SHUTTER_H = 430;
const WORDS = ["汽车维修", "摩托维修", "老王车行", "轮胎快修", "改装车间"] as const;

/** 工位：卷帘下方露出的一截车间。 */
function workshop(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: "white" | "warm"): void {
  const core = lightCore(tone);
  const glow = lightGlow(tone);
  ctx.fillStyle = "#0b0a12";
  ctx.fillRect(x, y, w, h);
  const g = ctx.createRadialGradient(x + w * 0.5, y, 10, x + w * 0.5, y, w * 0.7);
  g.addColorStop(0, rgba(core, 0.7));
  g.addColorStop(0.4, rgba(glow, 0.35));
  g.addColorStop(1, rgba(glow, 0.05));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 工具板：一排挂着的扳手 / 钳子剪影。
  ctx.fillStyle = rgba("#05050a", 0.7);
  for (let tx = x + 30; tx < x + w * 0.45; tx += r.range(18, 30)) ctx.fillRect(tx, y + 8, r.range(4, 8), r.range(26, 50));
  // 轮胎叠。
  const tx = x + w * r.range(0.6, 0.8);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#07070c";
    ctx.beginPath();
    ctx.ellipse(tx, y + h - 14 - i * 24, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 摩托剪影：两个轮子 + 车身。
  if (r.chance(0.6)) {
    const mx = x + w * r.range(0.2, 0.4);
    ctx.fillStyle = "#06060b";
    ctx.beginPath();
    ctx.arc(mx, y + h - 30, 30, 0, Math.PI * 2);
    ctx.arc(mx + 150, y + h - 30, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(mx + 10, y + h - 90, 130, 44);
  }
}

/** 门外轮胎堆：横放叠起的轮胎，带胎纹与高光。 */
function tireStack(ctx: CanvasRenderingContext2D, r: Random, x: number): void {
  const n = r.int(2, 4);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.beginPath();
  ctx.ellipse(x + 60, BASE, 80, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < n; i++) {
    const y = BASE - (i + 1) * 30;
    const g = ctx.createLinearGradient(0, y, 0, y + 30);
    g.addColorStop(0, "#2a2d3c");
    g.addColorStop(0.3, "#141620");
    g.addColorStop(1, "#06070b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x + r.range(-4, 4), y, 120, 30, 12);
    ctx.fill();
    ctx.fillStyle = rgba("#000000", 0.5);
    for (let k = x + 10; k < x + 112; k += 10) ctx.fillRect(k, y + 6, 3, 18);
  }
}

function drawRepairShop(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const roofY = floorY(p.storeys);
  const door = p.lamps.find((lamp) => lamp.door) ?? p.lamps[0];
  const splitY = BASE - SHUTTER_H - 60;
  const upperRamp = r.chance(0.5) ? OXIDE : STEEL;

  wallSurface(ctx, "corrugated", p.x, roofY, p.width, splitY - roofY, upperRamp, p.seed);
  wallSurface(ctx, r.chance(0.5) ? "brick" : "panel", p.x, splitY, p.width, BASE - splitY, r.chance(0.5) ? BRICK : CONCRETE, p.seed + 7);
  slabBand(ctx, p.x, p.width, splitY, CONCRETE, 18, 6);

  const sx = Math.round(door.x - SHUTTER_W / 2);
  const open = r.range(0.32, 0.52);
  const workTone = r.chance(0.25) ? "warm" : "white";
  rollerShutter(ctx, r, sx, SHUTTER_W, SHUTTER_H, workTone, open, STEEL);
  const gap = Math.round(SHUTTER_H * open);
  workshop(ctx, r, sx, BASE - gap, SHUTTER_W, gap, workTone);
  if (r.chance(0.5)) graffiti(ctx, r, sx + 40, BASE - SHUTTER_H + 60, SHUTTER_W - 80, SHUTTER_H - gap - 110);

  // 侧门 + 壁灯；另一侧贴海报、放电表箱。
  const sideRoom = door.x < p.x + p.width / 2 ? { x0: sx + SHUTTER_W, x1: p.x + p.width } : { x0: p.x, x1: sx };
  const sideLamp = p.lamps.find((lamp) => !lamp.door);
  if (sideRoom.x1 - sideRoom.x0 > 170) {
    const cx = (sideRoom.x0 + sideRoom.x1) / 2;
    steelDoor(ctx, cx, BASE, 120, 280, STEEL);
    if (sideLamp) doorLamp(ctx, sideLamp.x, sideLamp.y, sideLamp.tone);
  }
  const other = door.x < p.x + p.width / 2 ? { x0: p.x, x1: sx } : { x0: sx + SHUTTER_W, x1: p.x + p.width };
  if (other.x1 - other.x0 > 110) {
    posterWall(ctx, r, other.x0 + 20, BASE - 330, other.x1 - other.x0 - 40, 200);
    if (r.chance(0.5)) meterBox(ctx, r, other.x0 + 24, BASE - 470);
  }
  neonSign(ctx, r.pick(WORDS), door.x, (roofY + splitY) / 2 + 10, 52, neonOf(door.tone));
  if (r.chance(0.7)) tireStack(ctx, r, sx + (r.chance(0.5) ? 16 : SHUTTER_W - 136));
  radialGlow(ctx, door.x, BASE - 20, SHUTTER_W * 0.5, lightGlow(workTone), 0.12);

  plinth(ctx, p.x, p.width, CONCRETE, 22);
  downpipe(ctx, p.x + (door.x < p.x + p.width / 2 ? p.width - 14 : 14), roofY + 10);
  if (r.chance(0.6)) wireRun(ctx, r, p.x, p.x + p.width, splitY - 40);
  cornerShadow(ctx, p.x, roofY, BASE, "left", 30);
  cornerShadow(ctx, p.x + p.width, roofY, BASE, "right", 30);
  parapet(ctx, p.x, p.width, roofY, 40, upperRamp, p.seed);
  rooftopKit(ctx, r, p.x + 10, p.x + p.width - 10, roofY - 40, p.neon);
}

export const repairShopSpec: BuildingSpec = {
  kind: "repairShop",
  label: "维修车铺",
  width: [740, 900],
  storeys: [1.25],
  crown: 50,
  weight: 0.8,
  lamps: (x, w, _storeys, rnd, neon) => {
    const left = rnd.chance(0.5);
    const door = left ? x + SHUTTER_W / 2 + 40 : x + w - SHUTTER_W / 2 - 40;
    const side = left ? (door + SHUTTER_W / 2 + x + w) / 2 : (x + door - SHUTTER_W / 2) / 2;
    return [
      doorSpot(door, BASE - SHUTTER_H - 10, neon, "strip"),
      { x: Math.round(side), y: BASE - 330, tone: lampTone(rnd, 0.35), kind: "lamp", door: false },
    ];
  },
  draw: drawRepairShop,
};
