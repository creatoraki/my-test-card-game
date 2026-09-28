import type { BuildingKind, BuildingPlacement } from "../types";
import { BASE, type BuildingSpec } from "./common";
import { shopRowSpec } from "./shopRow";
import { convenienceSpec } from "./convenience";
import { repairShopSpec } from "./repairShop";
import { nightStallSpec } from "./nightStall";
import { metroEntranceSpec } from "./metroEntrance";
import { apartmentSpec } from "./apartment";
import { officeSpec } from "./office";

/** 建筑种类登记表：新增建筑只需实现一个 BuildingSpec 并登记到这里。 */
export const BUILDING_SPECS: Record<BuildingKind, BuildingSpec> = {
  shopRow: shopRowSpec,
  convenience: convenienceSpec,
  repairShop: repairShopSpec,
  nightStall: nightStallSpec,
  metroEntrance: metroEntranceSpec,
  apartment: apartmentSpec,
  office: officeSpec,
};

export const FRONT_KINDS: readonly BuildingKind[] = ["shopRow", "convenience", "repairShop", "nightStall", "metroEntrance", "apartment", "office"];
/** 后排只用高楼，缩小雾化后形成中景天际线。 */
export const BACK_KINDS: readonly BuildingKind[] = ["apartment", "office"];

export function buildingLabel(kind: BuildingKind): string {
  return BUILDING_SPECS[kind].label;
}

/** 后排建筑按 scale 以楼脚为基点缩小绘制；绘制仍在世界坐标下进行，跨块一致。 */
export function drawBuilding(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  if (p.scale === 1) {
    BUILDING_SPECS[p.kind].draw(ctx, p);
    return;
  }
  const base = BUILDING_SPECS[p.kind];
  ctx.save();
  ctx.translate(p.x, BASE);
  ctx.scale(p.scale, p.scale);
  ctx.translate(-p.x, -BASE);
  base.draw(ctx, p);
  ctx.restore();
}
