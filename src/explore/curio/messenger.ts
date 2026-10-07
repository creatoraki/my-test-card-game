import { rngFloat, rngPick } from "@/engine/core/rng";
import { NEAR_EXPIRY_FOOD_IDS } from "@/data/items/catalog/consumables";
import { getItemDef } from "@/data";
import { canShipHome } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { EXPLORE_RULES } from "../core/exploreRules";
import type { ExploreState } from "../types";
import type { CurioKind } from "../corridor/types";

export interface MessengerFoodPick { uid: string; count: number }

export function isMessengerFood(stack: ItemStack): boolean {
  return NEAR_EXPIRY_FOOD_IDS.some(id => id === stack.itemId) && !getItemDef(stack.itemId).undroppable;
}

/** 每房独立投放；已存在则跳过，整图没有时补一位。 */
export function seedMessengers(s: ExploreState, plan: Record<string, CurioKind[]>): void {
  const ids = Object.keys(plan);
  for (const id of ids) {
    if (!plan[id].includes("dispatch") && rngFloat(s) < EXPLORE_RULES.chute.roomChance) plan[id].push("dispatch");
  }
  if (ids.length && !ids.some(id => plan[id].includes("dispatch"))) plan[rngPick(s, ids)].push("dispatch");
}

/** 校验与扣费、装袋一起完成，失败不改变任何状态。 */
export function prepareMessengerParcel(backpack: ItemStack[], uids: string[], food: MessengerFoodPick[]) {
  if (!uids.length || new Set(uids).size !== uids.length || new Set(food.map(p => p.uid)).size !== food.length) return null;
  const picked = uids.map(uid => backpack.find(stack => stack.uid === uid));
  if (picked.some(stack => !stack || !canShipHome(stack, getItemDef(stack.itemId)))) return null;
  const shipped = picked as ItemStack[];
  if (shipped.reduce((sum, stack) => sum + stack.count, 0) > EXPLORE_RULES.chute.maxItems) return null;
  if (food.reduce((sum, pick) => sum + pick.count, 0) !== EXPLORE_RULES.chute.foodCost) return null;
  for (const pick of food) {
    const stack = backpack.find(item => item.uid === pick.uid);
    if (!stack || !isMessengerFood(stack) || uids.includes(pick.uid)
      || !Number.isInteger(pick.count) || pick.count <= 0 || pick.count > stack.count) return null;
  }
  const next = backpack.filter(stack => !uids.includes(stack.uid)).flatMap(stack => {
    const count = stack.count - (food.find(pick => pick.uid === stack.uid)?.count ?? 0);
    return count > 0 ? [{ ...stack, count }] : [];
  });
  return { backpack: next, shipped: shipped.map(stack => ({ ...stack })) };
}
