import { NEAR_EXPIRY_FOOD_IDS } from "@/data/items/catalog/consumables";
import { consumeItems, countByItemId } from "@/items/inventory";
import type { CurioDecision } from "@/data/curios/types";
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

/**
 * 选项所需的临期食品: 选项自身的明码价, 以及「确认后才扣款」的服务效果(装备调校)的价格, 取较大者。
 * 仅用于入口门槛与展示 —— 服务效果的食品在确认目标时才扣, 这里不重复收费。
 */
export function decisionFoodNeed(decision: Pick<CurioDecision, "foodCost" | "effects">): number {
  return decision.effects.reduce((need, effect) => effect.type === "TUNE_EQUIPMENT"
    ? Math.max(need, effect.foodCost)
    : need, decision.foodCost ?? 0);
}
