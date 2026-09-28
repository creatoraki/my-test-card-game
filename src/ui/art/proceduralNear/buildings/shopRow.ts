import type { BuildingPlacement, LampSpot } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { CONCRETE, STONE, type Ramp } from "../core/base/palette";
import { wallSurface } from "../core/base/surfaces";
import { neonStrip } from "../core/light/glow";
import { SIGN_WORDS, VERTICAL_WORDS } from "../core/fixtures/signs";
import { cornerShadow, parapet, pilaster, plinth, slabBand } from "../facade/storey";
import { pickWindowStyle, residentialWindow } from "../facade/windows";
import { doorStep, glassDoor, rollerShutter, shopWindow } from "../facade/storefront";
import { metalCanopy, stripedAwning } from "../facade/awning";
import { bladeSign, graffiti, lightBox, posterWall } from "../facade/signage";
import { rooftopKit } from "../facade/rooftop";
import { acStack, downpipe, wireRun } from "../facade/wallKit";
import { BASE, bayLayout, doorSpot, floorY, neonOf, pickWall, type BuildingSpec } from "./common";

// 临街店铺排：2~3 开间，一层或一层半（带阁楼）。每间一个店面（橱窗 + 玻璃门 / 卷帘门），
// 门头上方横向灯箱，门口雨棚或金属挑棚；壁柱分隔开间，阁楼开小窗挂空调；楼角挑出竖招牌。

/** 店面开口高度 ≈ 2.55m。 */
export const SHOP_H = 330;
const PIER = 44;
const DOOR_W = 150;

/** 一个店面开间：店面（卷帘 / 橱窗 + 玻璃门）、雨棚或挑棚、门头灯箱。公寓底商共用。 */
export function drawShopBay(ctx: CanvasRenderingContext2D, r: Random, x0: number, x1: number, lamp: LampSpot, p: BuildingPlacement): void {
  const ox = x0 + PIER / 2 + 16;
  const ow = x1 - x0 - PIER - 32;
  const tone = lamp.tone;
  const roll = r.next();
  if (roll < 0.35) {
    rollerShutter(ctx, r, ox, ow, SHOP_H, tone, r.chance(0.45) ? r.range(0.18, 0.4) : 0);
    if (r.chance(0.4)) graffiti(ctx, r, ox + 20, BASE - SHOP_H + 80, ow - 40, SHOP_H - 140);
  } else {
    const dx = lamp.x - DOOR_W / 2;
    if (dx - ox > 60) shopWindow(ctx, r, ox, BASE - SHOP_H, dx - ox - 14, SHOP_H, tone);
    if (ox + ow - (dx + DOOR_W) > 60) shopWindow(ctx, r, dx + DOOR_W + 14, BASE - SHOP_H, ox + ow - dx - DOOR_W - 14, SHOP_H, tone);
    glassDoor(ctx, r, lamp.x, DOOR_W, SHOP_H - 20, tone);
    doorStep(ctx, lamp.x, DOOR_W, CONCRETE);
  }
  const signY = floorY(1) + 24;
  const signH = BASE - SHOP_H - 26 - signY;
  const awning = r.next();
  if (awning < 0.5) stripedAwning(ctx, r, ox - 8, ow + 16, BASE - SHOP_H - 12, 80);
  else if (awning < 0.75) metalCanopy(ctx, ox - 10, ow + 20, BASE - SHOP_H - 20, CONCRETE, tone);
  lightBox(ctx, x0 + PIER / 2 + 20, signY, x1 - x0 - PIER - 40, signH, r.pick(SIGN_WORDS), r.chance(0.5) ? p.neon : neonOf(tone), r.chance(0.5), r.seed());
  if (awning >= 0.75) neonStrip(ctx, lamp.x, lamp.y, Math.min(ow * 0.6, 200), neonOf(tone));
}

/** 阁楼（半层）：矮窗 + 空调外机 + 明线。 */
function drawAttic(ctx: CanvasRenderingContext2D, r: Random, p: BuildingPlacement, bays: { x0: number; x1: number }[], ramp: Ramp): void {
  const top = floorY(1.5);
  const bottom = floorY(1);
  for (const bay of bays) {
    const count = bay.x1 - bay.x0 > 460 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const cx = bay.x0 + ((bay.x1 - bay.x0) * (i + 0.5)) / count;
      const w = 140;
      const h = 120;
      residentialWindow(ctx, r, cx - w / 2, bottom - 40 - h, w, h, pickWindowStyle(r, 0.35, 0.3), ramp, r.seed());
      if (r.chance(0.45)) acStack(ctx, r, cx + w / 2 + 26, bottom - 150, 1, true);
    }
  }
  if (r.chance(0.6)) wireRun(ctx, r, p.x, p.x + p.width, top + 40);
}

function drawShopRow(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const { ramp, kind } = pickWall(r);
  const roofY = floorY(p.storeys);
  const bays = bayLayout(p.x, p.width);
  const doors = p.lamps.filter((lamp) => lamp.door);

  wallSurface(ctx, kind, p.x, roofY, p.width, BASE - roofY, ramp, p.seed);
  if (p.storeys > 1) {
    drawAttic(ctx, r, p, bays, ramp);
    slabBand(ctx, p.x, p.width, floorY(1), CONCRETE);
  }
  bays.forEach((bay, i) => drawShopBay(ctx, r, bay.x0, bay.x1, doors[i] ?? doors[0], p));
  const pierRamp = r.chance(0.5) ? STONE : ramp;
  for (let i = 0; i <= bays.length; i++) {
    const px = i === 0 ? p.x : i === bays.length ? p.x + p.width - PIER : bays[i].x0 - PIER / 2;
    pilaster(ctx, px, floorY(1) + 12, BASE, PIER, pierRamp);
    if (i > 0 && i < bays.length && r.chance(0.35)) posterWall(ctx, r, px + 4, BASE - 300, PIER - 8, 200);
  }
  plinth(ctx, p.x, p.width, STONE);
  downpipe(ctx, r.chance(0.5) ? p.x + 14 : p.x + p.width - 14, roofY + 10);
  if (r.chance(0.5)) {
    const right = r.chance(0.5);
    bladeSign(ctx, right ? p.x + p.width + 16 : p.x - 16 - 78, floorY(1) - (p.storeys > 1 ? 170 : 60), 78, 300, r.pick(VERTICAL_WORDS), p.neon);
  }
  cornerShadow(ctx, p.x, roofY, BASE, "left", 30);
  cornerShadow(ctx, p.x + p.width, roofY, BASE, "right", 30);
  parapet(ctx, p.x, p.width, roofY, 56, ramp, p.seed);
  rooftopKit(ctx, r, p.x + 10, p.x + p.width - 10, roofY - 56, p.neon);
}

export const shopRowSpec: BuildingSpec = {
  kind: "shopRow",
  label: "临街店铺",
  width: [900, 1500],
  storeys: [1, 1, 1.5],
  crown: 60,
  weight: 1.5,
  lamps: (x, w, _storeys, rnd, neon) =>
    bayLayout(x, w).map((bay) => {
      const center = (bay.x0 + bay.x1) / 2 + (bay.x1 - bay.x0) * rnd.range(-0.18, 0.18);
      return doorSpot(center, BASE - SHOP_H - 6, rnd.chance(0.35) ? "white" : neon, "strip");
    }),
  draw: drawShopRow,
};
