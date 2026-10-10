// 地图难度规则唯一真相点。
// 各地图保留自己的遭遇战与交互池，普通难度统一九间房，教学关沿用固定蓝图。

import { MAPS, mapEquipRarities, type MapDef } from "./index";
import type { ItemRarity } from "@/items/types";
import type { MapClearRewardDef } from "./mapClearReward";

export type MapDifficulty = "normal" | "hard" | "abyss";

export const MAP_DIFFICULTY_IDS: readonly MapDifficulty[] = ["normal", "hard", "abyss"];
const TUTORIAL_DIFFICULTY_IDS: readonly MapDifficulty[] = ["normal"];
const NORMAL_ROOM_COUNT = 9;

export interface MapDifficultyDef {
  id: MapDifficulty;
  name: string;
  reward: MapClearRewardDef;
  /** 交互物奖励池在该难度下剔除的物品；普通难度(含新手关)金币只由首领与宝箱怪投放。 */
  curioPoolExcludes: readonly string[];
}

export const MAP_DIFFICULTIES: Record<MapDifficulty, MapDifficultyDef> = {
  normal: {
    id: "normal",
    name: "普通",
    curioPoolExcludes: ["gold-coin"],
    reward: {
      materialCount: 3,
      equipRarity: "common",
      scrapId: "silver-coin",
      scrapCount: 1,
    },
  },
  hard: {
    id: "hard",
    name: "困难",
    curioPoolExcludes: [],
    reward: {
      materialCount: 5,
      equipRarity: "fine",
      scrapId: "silver-coin",
      scrapCount: 2,
      relicRarity: "common",
    },
  },
  abyss: {
    id: "abyss",
    name: "深渊",
    curioPoolExcludes: [],
    reward: {
      materialCount: 5,
      equipRarity: "rare",
      scrapId: "gold-coin",
      scrapCount: 1,
      relicRarity: "common",
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

/** 地图选择页实际展示的难度选项；新手关卡保留普通难度入口。 */
export function mapDifficultyIds(mapId: string): readonly MapDifficulty[] {
  const map = requireMap(mapId);
  if (map.id === "tutorial" && !map.locked) return TUTORIAL_DIFFICULTY_IDS;
  return !map.locked && !map.hideAfterClear ? MAP_DIFFICULTY_IDS : [];
}

function withNormalOverride(map: MapDef): MapDef {
  const override = map.normalOverride;
  return {
    ...map,
    roomCount: NORMAL_ROOM_COUNT,
    battleEncounters: { ...map.battleEncounters, ...override?.battleEncounters },
  };
}

export function difficultyMapConfig(mapId: string, difficulty: MapDifficulty): MapDef {
  const map = requireMap(mapId);
  const definition = getMapDifficulty(difficulty);
  if (map.id === "tutorial") return map;
  if (difficulty === "normal") return withNormalOverride(map);
  if (!mapHasDifficulty(mapId)) return map;

  return {
    ...map,
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
