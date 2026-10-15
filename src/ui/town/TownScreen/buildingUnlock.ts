// 据点建筑的解锁规则 —— 「哪栋楼要通关什么才开放」全在这一张表里。
//
// ★ 开放与否直接读 townStore 的通关记录(clearedMaps / clearedDifficulties), 不另存解锁状态:
//   通关一次即永久开放, 重置档案后自然回到初始状态。
// ★ 表里没登记的建筑 = 一开始就开放(目前只有队员宿舍)。
// ★ 改解锁条件只动 BUILDING_UNLOCKS, 组件一行都不用动。
// ★ 条件刚满足的楼先保持上锁, 等据点全景播完一次解锁演出(buildingReveal.ts)才真正开放;
//   「已播过」记在存档 revealedBuildings 里, 每栋楼只播一次。

import { useMemo } from "react";
import { MAP_DIFFICULTIES, MAPS, difficultyKey, type MapDifficulty } from "@/data";
import { useTestMode } from "@/store/dev/devTestStore";
import { useTownStore } from "@/store/town/townStore";
import type { BuildingId } from "./stationBuildings";

/** 解锁条件: 通关某张地图(任意难度), 或通关某张地图的指定难度。 */
type UnlockRequirement =
  | { kind: "map"; mapId: string }
  | { kind: "difficulty"; mapId: string; difficulty: MapDifficulty };

const AFTER_TUTORIAL: UnlockRequirement = { kind: "map", mapId: "tutorial" };
const AFTER_NEON_NORMAL: UnlockRequirement = { kind: "difficulty", mapId: "neon-city", difficulty: "normal" };

// ★ 初始只开放队员宿舍; 通关新手关卡开放商店与医疗室; 通关普通难度的霓虹街区开放全部。
const BUILDING_UNLOCKS: Partial<Record<BuildingId, UnlockRequirement>> = {
  supplies: AFTER_TUTORIAL,
  workshop: AFTER_TUTORIAL,
  airlock: AFTER_NEON_NORMAL,
  "power-station": AFTER_NEON_NORMAL,
  laboratory: AFTER_NEON_NORMAL,
};

interface ClearProgress {
  clearedMaps: readonly string[];
  clearedDifficulties: readonly string[];
}

function isMet(requirement: UnlockRequirement, progress: ClearProgress): boolean {
  if (requirement.kind === "map") return progress.clearedMaps.includes(requirement.mapId);
  return progress.clearedDifficulties.includes(difficultyKey(requirement.mapId, requirement.difficulty));
}

function requirementText(requirement: UnlockRequirement): string {
  const mapName = MAPS.find((map) => map.id === requirement.mapId)?.name ?? "指定地图";
  if (requirement.kind === "map") return `通关${mapName}后开放`;
  return `通关${MAP_DIFFICULTIES[requirement.difficulty].name}难度${mapName}后开放`;
}

/** 建筑 id → 未开放原因; 不在表里的建筑已开放。 */
export type BuildingLocks = Partial<Record<BuildingId, string>>;

export function buildingLocks(progress: ClearProgress): BuildingLocks {
  const locks: BuildingLocks = {};
  for (const [id, requirement] of Object.entries(BUILDING_UNLOCKS) as [BuildingId, UnlockRequirement][]) {
    if (!isMet(requirement, progress)) locks[id] = requirementText(requirement);
  }
  return locks;
}

export interface BuildingLockState {
  /** 全景上要挂锁的建筑(含条件已满足、还在等解锁演出的)。点了进不去。 */
  locks: BuildingLocks;
  /** 条件已满足、但解锁演出还没播过的建筑, 按表顺序。 */
  pendingReveal: BuildingId[];
}

const OPEN_ALL: BuildingLockState = { locks: {}, pendingReveal: [] };

/**
 * 当前存档下各建筑的锁定状态, 通关记录一变就重算。
 * ★ 测试模式全部开放、不播演出也不记「已播」—— 关掉测试模式后, 真实进度达成的楼照样补播一次。
 */
export function useBuildingLocks(): BuildingLockState {
  const testMode = useTestMode();
  const clearedMaps = useTownStore((state) => state.clearedMaps);
  const clearedDifficulties = useTownStore((state) => state.clearedDifficulties);
  const revealed = useTownStore((state) => state.revealedBuildings);
  return useMemo(() => {
    if (testMode) return OPEN_ALL;
    const locks = buildingLocks({ clearedMaps, clearedDifficulties });
    const pendingReveal: BuildingId[] = [];
    for (const [id, requirement] of Object.entries(BUILDING_UNLOCKS) as [BuildingId, UnlockRequirement][]) {
      if (locks[id] || revealed.includes(id)) continue;
      pendingReveal.push(id);
      locks[id] = requirementText(requirement);
    }
    return { locks, pendingReveal };
  }, [testMode, clearedMaps, clearedDifficulties, revealed]);
}
