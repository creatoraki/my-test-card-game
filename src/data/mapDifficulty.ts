// 地图难度规则唯一真相点。
// 临时行为：普通、困难、深渊目前共用废弃楼层的遭遇战与事件配置。
// 后续每档有独立战斗/事件/装备上限时，只需替换 difficultyMapConfig 的配置选择。

import { MAPS, mapEquipRarities, type MapDef } from "./maps";
import type { ItemRarity } from "../items/types";

export type MapDifficulty = "normal" | "hard" | "abyss";

export const MAP_DIFFICULTY_IDS: readonly MapDifficulty[] = ["normal", "hard", "abyss"];
export const DIFFICULTY_BASE_MAP_ID = "neon-city";

export interface MapDifficultyDef {
  id: MapDifficulty;
  name: string;
  reward: {
    materialKinds: number;
    materialEach: number;
    equipRarity: ItemRarity;
    scrapId: string;
    scrapCount: number;
  };
}

export const MAP_DIFFICULTIES: Record<MapDifficulty, MapDifficultyDef> = {
  normal: {
    id: "normal",
    name: "普通",
    reward: {
      materialKinds: 2,
      materialEach: 3,
      equipRarity: "common",
      scrapId: "silver-coin",
      scrapCount: 1,
    },
  },
  hard: {
    id: "hard",
    name: "困难",
    reward: {
      materialKinds: 2,
      materialEach: 5,
      equipRarity: "fine",
      scrapId: "silver-coin",
      scrapCount: 2,
    },
  },
  abyss: {
    id: "abyss",
    name: "深渊",
    reward: {
      materialKinds: 2,
      materialEach: 5,
      equipRarity: "rare",
      scrapId: "gold-coin",
      scrapCount: 1,
    },
  },
};

function requireMap(mapId: string): MapDef {
  const map = MAPS.find((candidate) => candidate.id === mapId);
  if (!map) throw new Error(`未知地图: ${mapId}`);
  return map;
}

export function getMapDifficulty(id: string): MapDifficultyDef {
  const difficulty = MAP_DIFFICULTIES[id as MapDifficulty];
  if (!difficulty) throw new Error(`未知地图难度: ${id}`);
  return difficulty;
}

export function mapHasDifficulty(mapId: string): boolean {
  const map = requireMap(mapId);
  return !map.locked && !map.hideAfterClear;
}

export function difficultyMapConfig(mapId: string, difficulty: MapDifficulty): MapDef {
  const map = requireMap(mapId);
  const definition = getMapDifficulty(difficulty);
  if (!mapHasDifficulty(mapId) || difficulty === "normal") return map;

  const base = requireMap(DIFFICULTY_BASE_MAP_ID);
  return {
    ...base,
    id: map.id,
    name: map.name,
    desc: map.desc,
    emoji: map.emoji,
    maxEquipRarity: definition.reward.equipRarity,
  };
}

export function difficultyEquipRarities(
  mapId: string,
  difficulty: MapDifficulty,
): ItemRarity[] {
  return mapEquipRarities(difficultyMapConfig(mapId, difficulty));
}

export function difficultyKey(mapId: string, difficulty: MapDifficulty): string {
  return `${mapId}:${difficulty}`;
}

export function isDifficultyUnlocked(
  mapId: string,
  difficulty: MapDifficulty,
  clearedKeys: readonly string[],
): boolean {
  requireMap(mapId);
  if (difficulty === "normal") return true;
  if (!mapHasDifficulty(mapId)) return false;
  const previous: MapDifficulty = difficulty === "hard" ? "normal" : "hard";
  return clearedKeys.includes(difficultyKey(mapId, previous));
}

export function difficultyLockReason(
  mapId: string,
  difficulty: MapDifficulty,
  clearedKeys: readonly string[],
): string | null {
  if (isDifficultyUnlocked(mapId, difficulty, clearedKeys)) return null;
  if (difficulty === "normal") return null;
  if (!mapHasDifficulty(mapId)) return "暂未开放";
  return difficulty === "hard"
    ? "通关本层普通难度后开放"
    : "通关本层困难难度后开放";
}
