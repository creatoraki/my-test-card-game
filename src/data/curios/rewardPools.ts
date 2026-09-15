import type { RewardPoolEntry, RewardPoolId } from "./types";

export const REWARD_POOLS: Record<RewardPoolId, readonly RewardPoolEntry[]> = {
  generalMaterial: [
    { itemId: "logic-cube", weight: 1 },
    { itemId: "standard-gear", weight: 1 },
    { itemId: "standard-battery", weight: 1 },
    { itemId: "coil-spring", weight: 1 },
    { itemId: "magnet", weight: 1 },
  ],
  generalMaterialOrScrap: [
    { itemId: "logic-cube", weight: 4 },
    { itemId: "standard-gear", weight: 4 },
    { itemId: "standard-battery", weight: 3 },
    { itemId: "coil-spring", weight: 2 },
    { itemId: "magnet", weight: 2 },
    { itemId: "copper-coin", weight: 5 },
    { itemId: "silver-coin", weight: 2 },
    { itemId: "gold-coin", weight: 1 },
  ],
  scrap: [
    { itemId: "copper-coin", weight: 6 },
    { itemId: "silver-coin", weight: 3 },
    { itemId: "gold-coin", weight: 1 },
  ],
  premiumScrap: [
    { itemId: "copper-coin", weight: 2 },
    { itemId: "silver-coin", weight: 4 },
    { itemId: "gold-coin", weight: 3 },
  ],
  crystal: [
    { itemId: "green-crystal", weight: 7 },
    { itemId: "blue-crystal", weight: 2 },
    { itemId: "red-crystal", weight: 1 },
  ],
  basicFood: [
    { itemId: "milk", weight: 1 },
    { itemId: "bread", weight: 1 },
    { itemId: "cola", weight: 1 },
  ],
  food: [
    { itemId: "milk", weight: 2 },
    { itemId: "bread", weight: 2 },
    { itemId: "cola", weight: 2 },
    { itemId: "hamburger", weight: 1 },
    { itemId: "fried-chicken", weight: 1 },
    { itemId: "pizza", weight: 1 },
  ],
  highFood: [
    { itemId: "hamburger", weight: 1 },
    { itemId: "fried-chicken", weight: 1 },
    { itemId: "pizza", weight: 1 },
  ],
  consumable: [
    { itemId: "sugar-cube-c", weight: 4 },
    { itemId: "medical-kit-c", weight: 3 },
    { itemId: "holy-water-c", weight: 3 },
  ],
  module: [
    { itemId: "attack-module-t1", weight: 2 },
    { itemId: "healpower-module-t1", weight: 2 },
    { itemId: "armorpen-module-t1", weight: 1 },
    { itemId: "crit-module-t1", weight: 1 },
    { itemId: "precision-module-t1", weight: 1 },
    { itemId: "poison-module-t1", weight: 1 },
    { itemId: "burn-module-t1", weight: 1 },
  ],
};

export function rewardPool(pool: RewardPoolId): readonly RewardPoolEntry[] {
  return REWARD_POOLS[pool];
}
