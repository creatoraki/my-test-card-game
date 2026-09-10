import type { ItemRarity } from "../items/types";

export const SANCTUARY_RULES = {
  capacity: 3,
  days: 2,
  lootByRarity: { common: 80, fine: 140, rare: 220, epic: 360, legendary: 600 } as Record<ItemRarity, number>,
  crystalCostByRarity: {
    common: { "green-crystal": 1 },
    fine: { "green-crystal": 2, "blue-crystal": 1 },
    rare: { "blue-crystal": 2, "red-crystal": 1 },
    epic: { "blue-crystal": 3, "red-crystal": 2 },
    legendary: { "red-crystal": 4 },
  } as Record<ItemRarity, Record<string, number>>,
} as const;
