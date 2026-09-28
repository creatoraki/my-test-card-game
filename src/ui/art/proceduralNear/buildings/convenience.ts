import type { BuildingPlacement } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { ALLOY, CONCRETE, LED, NEON_COLORS, STONE, rgba } from "../core/base/palette";
import { wallSurface } from "../core/base/surfaces";
import { cylinderFill } from "../core/base/shading";
import { radialGlow } from "../core/light/glow";
import { cornerShadow, parapet, pilaster, plinth } from "../facade/storey";
import { doorStep, glassDoor, shopWindow } from "../facade/storefront";
import { lightBox, posterWall } from "../facade/signage";
import { rooftopKit } from "../facade/rooftop";
import { downpipe, wireRun } from "../facade/wallKit";
import { BASE, doorSpot, floorY, type BuildingSpec } from "./common";

// 便利店：一层，通长的品牌灯箱 + 整面玻璃（冷白室内光、货架、冷柜），自动门居中偏一侧，门口放冰柜。

const GLASS_H = 320;
const DOOR_W = 190;
const NAMES = ["星夜便利店", "零点便利", "晚风便利店", "二十四小时便利"] as const;

/** 冷柜：玻璃门后一排排发青光的饮料。 */
function fridges(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  const cols = Math.max(1, Math.floor(w / 70));
  const cw = w / cols;
  for (let c = 0; c < cols; c++) {
    const cx = x + c * cw;
    ctx.fillStyle = rgba(NEON_COLORS.cyan.glow, 0.28);
    ctx.fillRect(cx + 3, y, cw - 6, h);
    for (let sy = y + 20; sy < y + h - 10; sy += 34) {
      for (let bx = cx + 8; bx < cx + cw - 10; bx += 10) {
        ctx.fillStyle = rgba(r.pick(["#9fe8ff", "#ff9ad8", "#c9ccff", "#7df0c0"]), 0.7);
        ctx.fillRect(bx, sy, 6, 24);
      }
      ctx.fillStyle = rgba("#dff8ff", 0.5);
      ctx.fillRect(cx + 3, sy + 25, cw - 6, 2);
    }
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(cx, y, 3, h);
  }
}

/** 门口冰柜：白色箱体 + 发光玻璃盖。 */
function iceChest(ctx: CanvasRenderingContext2D, x: number): void {
  const w = 130;
  const h = 110;
  const y = BASE - h;
  ctx.fillStyle = rgba("#000000", 0.45);
  ctx.fillRect(x + 8, y + 8, w, h);
  ctx.fillStyle = cylinderFill(ctx, x, w, ALLOY);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba(NEON_COLORS.cyan.core, 0.75);
  ctx.fillRect(x + 6, y + 4, w - 12, 14);
  radialGlow(ctx, x + w / 2, y + 10, 80, NEON_COLORS.cyan.glow, 0.3);
  ctx.fillStyle = "#12305a";
  ctx.fillRect(x + 12, y + 40, w - 24, 34);
  ctx.fillStyle = "#c9d2e6";
  ctx.font = `900 22px "Microsoft YaHei", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("冷饮", x + w / 2, y + 58);
  ctx.fillStyle = LED.green;
  ctx.fillRect(x + w - 20, y + 86, 6, 4);
}

function drawConvenience(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const roofY = floorY(p.storeys);
  const door = p.lamps.find((lamp) => lamp.door) ?? p.lamps[0];
  const gx = p.x + 40;
  const gw = p.width - 80;
  const gy = BASE - GLASS_H;

  wallSurface(ctx, "panel", p.x, roofY, p.width, BASE - roofY, CONCRETE, p.seed);
  // 玻璃立面：门两侧各一段橱窗，冷柜靠一端。
  const dx0 = door.x - DOOR_W / 2;
  const dx1 = door.x + DOOR_W / 2;
  if (dx0 - gx > 50) shopWindow(ctx, r, gx, gy, dx0 - gx - 12, GLASS_H, "white", ALLOY);
  if (gx + gw - dx1 > 50) shopWindow(ctx, r, dx1 + 12, gy, gx + gw - dx1 - 12, GLASS_H, "white", ALLOY);
  const fridgeRight = door.x < p.x + p.width / 2;
  const fw = Math.min(260, (fridgeRight ? gx + gw - dx1 : dx0 - gx) - 40);
  if (fw > 120) fridges(ctx, r, fridgeRight ? gx + gw - fw - 10 : gx + 10, gy + 20, fw, GLASS_H - 90);
  glassDoor(ctx, r, door.x, DOOR_W, GLASS_H - 16, "white");
  doorStep(ctx, door.x, DOOR_W, CONCRETE);
  pilaster(ctx, p.x, roofY + 20, BASE, 40, STONE);
  pilaster(ctx, p.x + p.width - 40, roofY + 20, BASE, 40, STONE);

  // 通长品牌灯箱 + 底部三色条。
  const by = roofY + 30;
  const bh = gy - by - 26;
  lightBox(ctx, p.x + 20, by, p.width - 40, bh, r.pick(NAMES), r.chance(0.5) ? "cyan" : "violet", true, r.seed());
  const stripes = [NEON_COLORS.cyan.glow, NEON_COLORS.violet.glow, NEON_COLORS.pink.glow];
  stripes.forEach((c, i) => {
    ctx.fillStyle = rgba(c, 0.9);
    ctx.fillRect(p.x + 20, by + bh - 18 + i * 6, p.width - 40, 4);
  });
  radialGlow(ctx, p.x + p.width / 2, gy - 10, p.width * 0.45, NEON_COLORS.cyan.glow, 0.12);

  const chestX = fridgeRight ? dx0 - 170 : dx1 + 40;
  if (r.chance(0.65) && chestX > p.x + 40 && chestX < p.x + p.width - 170) iceChest(ctx, chestX);
  if (r.chance(0.4)) posterWall(ctx, r, p.x + 44, gy + 40, 60, 160);
  plinth(ctx, p.x, p.width, STONE, 24);
  downpipe(ctx, p.x + p.width - 16, roofY + 10);
  if (r.chance(0.5)) wireRun(ctx, r, p.x, p.x + p.width, roofY + 14);
  cornerShadow(ctx, p.x, roofY, BASE, "left", 26);
  cornerShadow(ctx, p.x + p.width, roofY, BASE, "right", 26);
  parapet(ctx, p.x, p.width, roofY, 44, CONCRETE, p.seed);
  rooftopKit(ctx, r, p.x + 10, p.x + p.width - 10, roofY - 44, p.neon);
}

export const convenienceSpec: BuildingSpec = {
  kind: "convenience",
  label: "便利店",
  width: [720, 920],
  storeys: [1],
  crown: 50,
  weight: 1,
  lamps: (x, w, _storeys, rnd) => {
    const door = x + w * (rnd.chance(0.5) ? rnd.range(0.28, 0.4) : rnd.range(0.6, 0.72));
    return [
      doorSpot(door, BASE - GLASS_H - 4, "white", "strip"),
      { x: Math.round(x + w * (door < x + w / 2 ? 0.75 : 0.25)), y: BASE - 200, tone: "white", kind: "lamp", door: false },
    ];
  },
  draw: drawConvenience,
};
