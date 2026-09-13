import type { ItemRarity } from "../items/types";

export interface MapClearRewardDef {
  materialKinds: number;
  materialEach: number;
  equipRarity: ItemRarity;
  scrapId: string;
  scrapCount: number;
}

/** 没有难度档的地图的固定通关奖励（教学关：1 银币 + 1 件随机 common 装备）。 */
export const FIXED_CLEAR_REWARDS: Partial<Record<string, MapClearRewardDef>> = {
  tutorial: {
    materialKinds: 0,
    materialEach: 0,
    equipRarity: "common",
    scrapId: "silver-coin",
    scrapCount: 1,
  },
};

export function fixedClearRewardOf(mapId: string): MapClearRewardDef | null {
  return FIXED_CLEAR_REWARDS[mapId] ?? null;
}
