import type { ItemRarity } from "@/items/types";

export interface MapClearRewardDef {
  /** 随机一种通用材料的数量；0 = 不给材料。 */
  materialCount: number;
  equipRarity: ItemRarity;
  scrapId: string;
  scrapCount: number;
  /** 额外奖励一件该稀有度的祝福遗物；缺省 = 不给遗物。 */
  relicRarity?: ItemRarity;
}

/** 没有难度档的地图的固定通关奖励（教学关：1 银币 + 1 件随机 common 装备）。 */
export const FIXED_CLEAR_REWARDS: Partial<Record<string, MapClearRewardDef>> = {
  tutorial: {
    materialCount: 0,
    equipRarity: "common",
    scrapId: "silver-coin",
    scrapCount: 1,
  },
};

export function fixedClearRewardOf(mapId: string): MapClearRewardDef | null {
  return FIXED_CLEAR_REWARDS[mapId] ?? null;
}
