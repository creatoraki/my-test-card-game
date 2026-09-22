import type { RewardPoolEntry, RewardPoolId } from "./types";

// grade = 品质档；物件等级越高，高档条目的权重被 levelRules.gradeBoost 放得越大。
export const REWARD_POOLS: Record<RewardPoolId, readonly RewardPoolEntry[]> = {
  generalMaterial: [
    { itemId: "logic-cube", weight: 1, grade: 0 },
    { itemId: "standard-gear", weight: 1, grade: 0 },
    { itemId: "standard-battery", weight: 1, grade: 0 },
    { itemId: "coil-spring", weight: 1, grade: 1 },
    { itemId: "magnet", weight: 1, grade: 1 },
  ],
  generalMaterialOrScrap: [
    { itemId: "logic-cube", weight: 4, grade: 0 },
    { itemId: "standard-gear", weight: 4, grade: 0 },
    { itemId: "standard-battery", weight: 3, grade: 0 },
    { itemId: "coil-spring", weight: 2, grade: 1 },
    { itemId: "magnet", weight: 2, grade: 1 },
    { itemId: "copper-coin", weight: 5, grade: 0 },
    { itemId: "silver-coin", weight: 2, grade: 1 },
    { itemId: "gold-coin", weight: 1, grade: 2 },
  ],
  scrap: [
    { itemId: "copper-coin", weight: 6, grade: 0 },
    { itemId: "silver-coin", weight: 3, grade: 1 },
    { itemId: "gold-coin", weight: 1, grade: 2 },
  ],
  premiumScrap: [
    { itemId: "copper-coin", weight: 2, grade: 0 },
    { itemId: "silver-coin", weight: 4, grade: 1 },
    { itemId: "gold-coin", weight: 3, grade: 2 },
  ],
  crystal: [
    { itemId: "green-crystal", weight: 7, grade: 0 },
    { itemId: "blue-crystal", weight: 2, grade: 1 },
    { itemId: "red-crystal", weight: 1, grade: 2 },
  ],
  basicFood: [
    { itemId: "milk", weight: 1, grade: 0 },
    { itemId: "bread", weight: 1, grade: 0 },
    { itemId: "cola", weight: 1, grade: 0 },
  ],
  food: [
    { itemId: "milk", weight: 2, grade: 0 },
    { itemId: "bread", weight: 2, grade: 0 },
    { itemId: "cola", weight: 2, grade: 0 },
    { itemId: "hamburger", weight: 1, grade: 1 },
    { itemId: "fried-chicken", weight: 1, grade: 1 },
    { itemId: "pizza", weight: 1, grade: 1 },
  ],
  highFood: [
    { itemId: "hamburger", weight: 1, grade: 0 },
    { itemId: "fried-chicken", weight: 1, grade: 0 },
    { itemId: "pizza", weight: 1, grade: 0 },
  ],
  consumable: [
    { itemId: "sugar-cube-c", weight: 4, grade: 0 },
    { itemId: "medical-kit-c", weight: 3, grade: 1 },
    { itemId: "holy-water-c", weight: 3, grade: 1 },
  ],
  module: [
    { itemId: "attack-module-t1", weight: 2, grade: 0 },
    { itemId: "healpower-module-t1", weight: 2, grade: 0 },
    { itemId: "armorpen-module-t1", weight: 1, grade: 1 },
    { itemId: "crit-module-t1", weight: 1, grade: 1 },
    { itemId: "precision-module-t1", weight: 1, grade: 1 },
    { itemId: "poison-module-t1", weight: 1, grade: 1 },
    { itemId: "burn-module-t1", weight: 1, grade: 1 },
  ],
};

export function rewardPool(pool: RewardPoolId): readonly RewardPoolEntry[] {
  return REWARD_POOLS[pool];
}
