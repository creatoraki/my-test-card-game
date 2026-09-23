import { rngInt, rngPick } from "@/engine/core/rng";
import { bumpPerfectness } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import { GENERAL_MATERIAL_DEFS } from "../items/catalog/materials";
import { BLESSING_RELIC_DEFS } from "../items/relics";
import {
  equipmentDefsBySlot,
  getItemDef,
  getItemFamily,
  makeItemStack,
  makeRolledItemStack,
} from "../registry";
import {
  difficultyKey,
  getMapDifficulty,
  MAP_DIFFICULTY_IDS,
  mapHasDifficulty,
  type MapDifficulty,
} from "./mapDifficulty";
import { fixedClearRewardOf, type MapClearRewardDef } from "./mapClearReward";
import { MAPS } from "./index";

// 奖励顺序即展示顺序：换金物 → 材料（单一种类） → 装备 → 遗物。
function rollClearReward(
  rng: { rngState: number },
  reward: MapClearRewardDef,
): ItemStack[] {
  const stacks: ItemStack[] = [];

  const scrap = getItemDef(reward.scrapId);
  for (let count = 0; count < reward.scrapCount; count += 1) {
    stacks.push(makeItemStack(scrap.id));
  }

  if (reward.materialCount > 0) {
    const material = rngPick(rng, [...GENERAL_MATERIAL_DEFS]);
    for (let count = 0; count < reward.materialCount; count += 1) {
      stacks.push(makeItemStack(material.id));
    }
  }

  const familyIds = [...new Set(
    equipmentDefsBySlot()
      .map((def) => def.familyId)
      .filter((familyId): familyId is string => Boolean(familyId)),
  )];
  const equipmentCandidates = familyIds.flatMap((familyId) =>
    getItemFamily(familyId).filter((def) => def.rarity === reward.equipRarity),
  );
  if (!equipmentCandidates.length) {
    throw new Error(`没有稀有度为 ${reward.equipRarity} 的通关奖励装备`);
  }
  const equipment = equipmentCandidates[rngInt(rng, equipmentCandidates.length)];
  const stack = makeRolledItemStack(rng, equipment.id);
  if (stack.roll) {
    stack.roll = bumpPerfectness(equipment, stack.roll, (n) => rngInt(rng, n));
  }
  stacks.push(stack);

  if (reward.relicRarity) {
    const relicCandidates = BLESSING_RELIC_DEFS.filter((def) => def.rarity === reward.relicRarity);
    if (!relicCandidates.length) {
      throw new Error(`没有稀有度为 ${reward.relicRarity} 的通关奖励遗物`);
    }
    stacks.push(makeItemStack(rngPick(rng, relicCandidates).id));
  }
  return stacks;
}

export function rollDailyClearReward(
  rng: { rngState: number },
  mapId: string,
  difficulty: MapDifficulty,
): ItemStack[] {
  if (!mapHasDifficulty(mapId)) return [];
  return rollClearReward(rng, getMapDifficulty(difficulty).reward);
}

export function rollAllDailyClearRewards(day: number): Record<string, ItemStack[]> {
  const rng = { rngState: (Math.imul(day | 0, 0x9e3779b1) ^ 0x5f3759df) | 0 };
  const rewards: Record<string, ItemStack[]> = {};
  for (const map of MAPS) {
    if (mapHasDifficulty(map.id)) {
      for (const difficulty of MAP_DIFFICULTY_IDS) {
        rewards[difficultyKey(map.id, difficulty)] = rollDailyClearReward(rng, map.id, difficulty);
      }
      continue;
    }

    const fixedReward = fixedClearRewardOf(map.id);
    if (fixedReward) {
      rewards[difficultyKey(map.id, "normal")] = rollClearReward(rng, fixedReward);
    }
  }
  return rewards;
}
