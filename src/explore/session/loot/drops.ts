// 掉落系数与掉落上下文 —— 战斗掉落、物件奖励与开箱共用。

import {
  ROLLABLE_BOND_IDS,
  equipmentDefsBySlot,
  getItemDef,
  getItemFamily,
  difficultyEquipRarities,
  makeItemStack,
} from "@/data";
import type { DropContext } from "@/items/drops";
import type { ItemRarity } from "@/items/types";
import { EXPLORE_RULES } from "../../core/exploreRules";
import type { ExploreState } from "../../types";
import { rewardMultiplier } from "../core/energy";

// 统一掉落系数 K =(K_energy + Σ挑战加成 + 额外掉率加成)× K_global —— **全加法合成**(设计文档 §5.1)。
// 挑战加成由战斗引擎在 finishBattle 时写入 pendingChallengeBonus, 掉落结算随后立即消费。
export function dropCoefficient(
  s: ExploreState,
  challengeBonus = s.pendingChallengeBonus,
  extraDropBonus = 0,
): number {
  return (rewardMultiplier(s.energy) + challengeBonus + extraDropBonus) * EXPLORE_RULES.drop.kGlobal;
}

// K → 品质权重(qualityBias 的右移结果)。表在 EXPLORE_RULES.drop.qualityTable。
export function qualityWeights(k: number): Record<ItemRarity, number> {
  for (const row of EXPLORE_RULES.drop.qualityTable) if (k <= row.maxK) return { ...row.w };
  const last = EXPLORE_RULES.drop.qualityTable[EXPLORE_RULES.drop.qualityTable.length - 1];
  return { ...last.w };
}

const EQUIPMENT_FAMILY_IDS = [...new Set(
  equipmentDefsBySlot()
    .map((def) => def.familyId)
    .filter((familyId): familyId is string => Boolean(familyId)),
)];

// 掉落所需的上下文。★ 唯一一处把 data 层的注册表接进物品层的地方。
export function dropContext(s: ExploreState, k = dropCoefficient(s)): DropContext {
  return {
    weights: qualityWeights(k),
    getDef: getItemDef,
    getFamily: getItemFamily,
    makeStack: (itemId, count, extra) => makeItemStack(itemId, count, extra),
    // ★ 随机羁绊词条的抽取池 —— 只含**已实装**的羁绊, 见 data/roster/bonds.ts 的说明。
    affinityPool: ROLLABLE_BOND_IDS,
    equipmentFamilyIds: EQUIPMENT_FAMILY_IDS,
    equipRarities: difficultyEquipRarities(s.mapId, s.difficulty),
    excludeItemIds: [
      ...s.ownedRelicIds,
      ...s.pendingPickup
        .filter((stack) => getItemDef(stack.itemId).category === "relic")
        .map((stack) => stack.itemId),
      ...s.pendingLoot
        .filter((stack) => getItemDef(stack.itemId).category === "relic")
        .map((stack) => stack.itemId),
    ],
    relicFallbackItemId: "logic-cube",
  };
}
