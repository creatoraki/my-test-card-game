// ============================================================================
// 自由投入 —— 经验转换、拆解、押注这类「符合条件的物品任选，放多少算多少」的服务。
// 与 offering.ts 的配方匹配(熔合必须正好三件装备)分开：这里只校验每件都合格、件数在范围内。
// 远征途中不可移除的物品(undroppable)一律不收。
// ============================================================================

import { getItemDef } from "@/data";
import type { FreeOffer } from "@/data/curios/types";
import type { ItemStack } from "@/items/types";
import type { ExploreState } from "../types";
import { canStakeCoin } from "./coins";
import { partCanMatch, validOfferingPicks, type OfferingPick } from "./offering";

export function offerAccepts(s: Pick<ExploreState, "difficulty">, offer: FreeOffer, stack: ItemStack): boolean {
  if (getItemDef(stack.itemId).undroppable) return false;
  if (!partCanMatch({ match: offer.match, count: 1 }, stack)) return false;
  return !offer.coinStake || canStakeCoin(s, stack.itemId);
}

/** 选物面板里列出的物品。 */
export function offerStacks(s: Pick<ExploreState, "backpack" | "difficulty">, offer: FreeOffer): ItemStack[] {
  return s.backpack.filter((stack) => offerAccepts(s, offer, stack));
}

/** 背包里合格物品够不够最低件数(入口按钮用)。 */
export function canOffer(s: Pick<ExploreState, "backpack" | "difficulty">, offer: FreeOffer): boolean {
  return offerStacks(s, offer).reduce((sum, stack) => sum + stack.count, 0) >= offer.min;
}

/** 校验所选物品：每件都合格、总件数在 [min, max] 内。合格时返回所选物品快照。 */
export function validFreeOffer(s: ExploreState, offer: FreeOffer, picks: OfferingPick[]): ItemStack[] | null {
  const offered = validOfferingPicks(s, picks);
  if (!offered || !offered.every((stack) => offerAccepts(s, offer, stack))) return null;
  const total = offered.reduce((sum, stack) => sum + stack.count, 0);
  if (total < offer.min || (offer.max !== undefined && total > offer.max)) return null;
  return offered;
}
