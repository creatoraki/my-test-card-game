// 地图难度规则唯一真相点。
// 各地图保留自己的遭遇战与交互池，难度只覆盖装备上限、物件等级和战斗倍率。

import { MAPS, mapEquipRarities, type MapDef } from "./index";
import type { ItemRarity } from "@/items/types";
import type { MapClearRewardDef } from "./mapClearReward";
import type { CurioLevel } from "../curios/types";

export type MapDifficulty = "normal" | "hard" | "abyss";

export const MAP_DIFFICULTY_IDS: readonly MapDifficulty[] = ["normal", "hard", "abyss"];
const TUTORIAL_DIFFICULTY_IDS: readonly MapDifficulty[] = ["normal"];

export interface MapDifficultyDef {
  id: MapDifficulty;
  name: string;
  reward: MapClearRewardDef;
  /** 该难度下随机房间图的物件等级区间。 */
  curioLevelRange: readonly [CurioLevel, CurioLevel];
}

export const MAP_DIFFICULTIES: Record<MapDifficulty, MapDifficultyDef> = {
  normal: {
    id: "normal",
    name: "普通",
    curioLevelRange: [1, 3],
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
    curioLevelRange: [2, 4],
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
    curioLevelRange: [3, 5],
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

export function difficultyMapConfig(mapId: string, difficulty: MapDifficulty): MapDef {
  const map = requireMap(mapId);
  const definition = getMapDifficulty(difficulty);
  if (!mapHasDifficulty(mapId) || difficulty === "normal") return map;

  return {
    ...map,
    maxEquipRarity: definition.reward.equipRarity,
    curioLevelRange: definition.curioLevelRange,
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
