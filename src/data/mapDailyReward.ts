import { rngInt, shuffle } from "../engine/rng";
import type { ItemStack } from "../items/types";
import { GENERAL_MATERIAL_DEFS } from "./items/materials";
import {
  equipmentDefsBySlot,
  getItemDef,
  getItemFamily,
  makeItemStack,
  makeRolledItemStack,
} from "./index";
import {
  difficultyKey,
  getMapDifficulty,
  MAP_DIFFICULTY_IDS,
  mapHasDifficulty,
  type MapDifficulty,
} from "./mapDifficulty";
import { MAPS } from "./maps";

export function rollDailyClearReward(
  rng: { rngState: number },
  mapId: string,
  difficulty: MapDifficulty,
): ItemStack[] {
  if (!mapHasDifficulty(mapId)) return [];
  const reward = getMapDifficulty(difficulty).reward;
  const materials = shuffle(rng, [...GENERAL_MATERIAL_DEFS]).slice(0, reward.materialKinds);
  const stacks: ItemStack[] = [];

  for (const material of materials) {
    for (let count = 0; count < reward.materialEach; count += 1) {
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
    throw new Error(`没有可用于${getMapDifficulty(difficulty).name}难度奖励的装备`);
  }
  const equipment = equipmentCandidates[rngInt(rng, equipmentCandidates.length)];
  stacks.push(makeRolledItemStack(rng, equipment.id));

  const scrap = getItemDef(reward.scrapId);
  for (let count = 0; count < reward.scrapCount; count += 1) {
    stacks.push(makeItemStack(scrap.id));
  }
  return stacks;
}

export function rollAllDailyClearRewards(day: number): Record<string, ItemStack[]> {
  const rng = { rngState: (Math.imul(day | 0, 0x9e3779b1) ^ 0x5f3759df) | 0 };
  const rewards: Record<string, ItemStack[]> = {};
  for (const map of MAPS) {
    if (!mapHasDifficulty(map.id)) continue;
    for (const difficulty of MAP_DIFFICULTY_IDS) {
      rewards[difficultyKey(map.id, difficulty)] = rollDailyClearReward(rng, map.id, difficulty);
    }
  }
  return rewards;
}
