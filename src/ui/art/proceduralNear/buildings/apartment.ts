import type { BuildingPlacement } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { CONCRETE, STONE, lightGlow, type Ramp } from "../core/base/palette";
import { wallSurface } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";
import { VERTICAL_WORDS } from "../core/fixtures/signs";
import { cornerShadow, parapet, pilaster, plinth, slabBand, STOREY } from "../facade/storey";
import { balcony, pickWindowStyle, residentialWindow } from "../facade/windows";
import { doorStep, glassDoor } from "../facade/storefront";
import { metalCanopy } from "../facade/awning";
import { bladeSign } from "../facade/signage";
import { rooftopKit } from "../facade/rooftop";
import { acStack, downpipe, housePlate, wireRun } from "../facade/wallKit";
import { BASE, bayLayout, doorSpot, floorY, lampTone, pickWall, skyY, type BuildingSpec } from "./common";
import { drawShopBay, SHOP_H } from "./shopRow";

// 公寓底商：两到四层，上部出画。底层一端是单元门（挑棚、门牌、电表箱），其余为底商店面；
// 楼上按竖列排住宅窗或阳台（防盗网、晾衣、空调外机），每层一道腰线，楼侧挑出竖招牌。

const ENTRY_W = 300;
const COL_W = 300;

interface Layout {
  entranceLeft: boolean;
  shops: { x0: number; x1: number }[];
}

function layout(x: number, w: number, entranceLeft: boolean): Layout {
  const x0 = entranceLeft ? x + ENTRY_W : x;
  const x1 = entranceLeft ? x + w : x + w - ENTRY_W;
  return { entranceLeft, shops: bayLayout(x0, x1 - x0, 480) };
}

/** 单元门：石材门套里一樘玻璃门，上方挑棚，挑棚上挂门牌。 */
function entrance(ctx: CanvasRenderingContext2D, r: Random, cx: number, seed: number): void {
  const w = 220;
  const h = 330;
  wallSurface(ctx, "stone", cx - w / 2 - 20, BASE - h - 20, w + 40, h + 20, STONE, seed, 0.6);
  glassDoor(ctx, r, cx, 150, 290, "white");
  doorStep(ctx, cx, 150, STONE);
  metalCanopy(ctx, cx - w / 2 - 10, w + 20, BASE - h - 36, CONCRETE, "white", 26);
  housePlate(ctx, cx - 28, BASE - 420, 10 + Math.floor(r.next() * 180));
}

function upperFloors(ctx: CanvasRenderingContext2D, r: Random, p: BuildingPlacement, ramp: Ramp): void {
  const cols = Math.max(2, Math.floor((p.width - 80) / COL_W));
  const colW = (p.width - 80) / cols;
  const types = Array.from({ length: cols }, () => (r.chance(0.3) ? "balcony" : "window"));
  const storeys = Math.ceil(p.storeys);
  const sky = skyY(p) + STOREY * 0.5;
  for (let n = 1; n < storeys; n++) {
    const floor = floorY(n);
    if (floor < sky) break;
    for (let c = 0; c < cols; c++) {
      const cx = p.x + 40 + colW * (c + 0.5);
      const style = pickWindowStyle(r, 0.3, 0.35);
      if (types[c] === "balcony") {
        balcony(ctx, r, cx, floor, Math.min(colW - 40, 250), style, ramp, r.seed());
        continue;
      }
      residentialWindow(ctx, r, cx - 97, floor - 117 - 180, 195, 180, style, ramp, r.seed());
      if (r.chance(0.4)) acStack(ctx, r, cx - 52, floor - 96, 1, true);
      else if (colW > 330 && r.chance(0.4)) acStack(ctx, r, cx + 112, floor - 250, 1, true);
    }
    if (n + 1 < p.storeys) slabBand(ctx, p.x, p.width, floorY(n + 1), CONCRETE);
  }
}

function drawApartment(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const { ramp, kind } = pickWall(r);
  const roofY = floorY(p.storeys);
  const wallTop = Math.max(roofY, skyY(p));
  const entry = p.lamps.find((lamp) => lamp.kind === "lamp") ?? p.lamps[0];
  const { entranceLeft, shops } = layout(p.x, p.width, entry.x < p.x + p.width / 2);
  const shopLamps = p.lamps.filter((lamp) => lamp !== entry);

  wallSurface(ctx, kind, p.x, wallTop, p.width, BASE - wallTop, ramp, p.seed);
  upperFloors(ctx, r, p, ramp);
  slabBand(ctx, p.x, p.width, floorY(1), CONCRETE, 26, 14);

  shops.forEach((bay, i) => drawShopBay(ctx, r, bay.x0, bay.x1, shopLamps[i] ?? shopLamps[0] ?? entry, p));
  entrance(ctx, r, entry.x, p.seed + 3);
  radialGlow(ctx, entry.x, BASE - 200, 180, lightGlow(entry.tone), 0.1);
  const piers = [p.x, p.x + p.width - 44, ...shops.slice(1).map((bay) => bay.x0 - 22)];
  piers.push(entranceLeft ? p.x + ENTRY_W - 22 : p.x + p.width - ENTRY_W - 22);
  for (const px of piers) pilaster(ctx, px, floorY(1) + 14, BASE, 44, STONE);
  plinth(ctx, p.x, p.width, STONE);

  downpipe(ctx, p.x + 14, wallTop);
  downpipe(ctx, p.x + p.width - 14, wallTop);
  if (r.chance(0.6)) wireRun(ctx, r, p.x, p.x + p.width, floorY(1) + 40);
  if (r.chance(0.45)) {
    const right = r.chance(0.5);
    bladeSign(ctx, right ? p.x + p.width + 16 : p.x - 16 - 86, floorY(2) + 40, 86, 380, r.pick(VERTICAL_WORDS), p.neon);
  }
  cornerShadow(ctx, p.x, wallTop, BASE, "left", 34);
  cornerShadow(ctx, p.x + p.width, wallTop, BASE, "right", 34);
  if (roofY > 40) {
    parapet(ctx, p.x, p.width, roofY, 50, ramp, p.seed);
    rooftopKit(ctx, r, p.x + 10, p.x + p.width - 10, roofY - 50, p.neon);
  }
}

export const apartmentSpec: BuildingSpec = {
  kind: "apartment",
  label: "公寓底商",
  width: [800, 1150],
  storeys: [2, 2, 3, 4],
  crown: 50,
  weight: 1.2,
  lamps: (x, w, _storeys, rnd, neon) => {
    const entranceLeft = rnd.chance(0.5);
    const cx = entranceLeft ? x + ENTRY_W / 2 : x + w - ENTRY_W / 2;
    const lamps = [doorSpot(cx, BASE - 346, lampTone(rnd, 0.35), "lamp")];
    for (const bay of layout(x, w, entranceLeft).shops) {
      const center = (bay.x0 + bay.x1) / 2 + (bay.x1 - bay.x0) * rnd.range(-0.15, 0.15);
      lamps.push(doorSpot(center, BASE - SHOP_H - 6, rnd.chance(0.35) ? "white" : neon, "strip"));
    }
    return lamps;
  },
  draw: drawApartment,
};
