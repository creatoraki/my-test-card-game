import type { ItemRarity } from "@/items/types";

/**
 * 新增服务类物件的数值：钱币兑换、经验转换、拆解回收、游艺摊押注、传送雕像。
 * 设计说明见 docs/交互物现状说明.md。
 */

/** 钱币从低到高；游艺摊升级、兑换台合成都按这个顺序。 */
export const COIN_LADDER = ["copper-coin", "silver-coin", "gold-coin"] as const;
export type CoinId = (typeof COIN_LADDER)[number];

/** 钱币兑换台：等值上合(铜 50 / 银 200 / 金 500)，只能向上，不能拆。 */
export const COIN_EXCHANGES = {
  copperToSilver: { from: "copper-coin", give: 4, to: "silver-coin", get: 1 },
  silverToGold: { from: "silver-coin", give: 5, to: "gold-coin", get: 2 },
} as const satisfies Record<string, { from: CoinId; give: number; to: CoinId; get: number }>;
export type CoinExchangeId = keyof typeof COIN_EXCHANGES;

/** 经验转换：每件物品给全队每名存活队员的经验，按品类固定；钱币按币种分档。 */
export const EXP_CONVERT = {
  material: 3,
  consumable: 4,
  scrap: { "copper-coin": 3, "silver-coin": 8, "gold-coin": 15 } as Record<string, number>,
  /** 未登记的废料按这个值折算。 */
  scrapFallback: 3,
} as const;

/** 拆解回收：每件装备按稀有度给通用材料与水晶。 */
export const SALVAGE_EQUIPMENT: Record<ItemRarity, { materials: number; crystal?: string }> = {
  common: { materials: 1 },
  fine: { materials: 2 },
  rare: { materials: 2, crystal: "green-crystal" },
  epic: { materials: 3, crystal: "blue-crystal" },
  legendary: { materials: 3, crystal: "red-crystal" },
};

/** 完美度达到该比例(0~1)的装备额外多给材料。 */
export const SALVAGE_PERFECT_BONUS = { ratio: 0.8, materials: 1 } as const;

/** 模组按稀有度只给通用材料。 */
export const SALVAGE_MODULE: Record<ItemRarity, number> = {
  common: 1,
  fine: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** 游艺摊：单次最多押 3 枚钱币。 */
export const ARCADE_MAX_STAKES = 3;

/** 传送雕像：每图 50% 出现一对，两座尽量相隔 ≥ 4 步；传送每次 2 粒子。 */
export const WAYSTONE_RULES = {
  spawnChance: 0.5,
  minDistance: 4,
  travelEnergy: 2,
} as const;
