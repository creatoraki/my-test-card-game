import { NEAR_EXPIRY_FOOD_IDS } from "@/data/items/consumables";
import { consumeItems, countByItemId } from "@/items/inventory";
import type { ExploreState } from "../types";

export function serviceFoodCount(s: Pick<ExploreState, "backpack">): number {
  return NEAR_EXPIRY_FOOD_IDS.reduce((sum, id) => sum + countByItemId(s.backpack, id), 0);
}

/** 先校验总数再扣款，允许六种食品跨堆混付，固定顺序消耗，失败不改背包。 */
export function payServiceFood(s: Pick<ExploreState, "backpack">, count: number): boolean {
  if (!Number.isInteger(count) || count < 0 || serviceFoodCount(s) < count) return false;
  let left = count;
  for (const id of NEAR_EXPIRY_FOOD_IDS) {
    const take = Math.min(left, countByItemId(s.backpack, id));
    if (take) s.backpack = consumeItems(s.backpack, id, take);
    left -= take;
    if (!left) break;
  }
  return true;
}
