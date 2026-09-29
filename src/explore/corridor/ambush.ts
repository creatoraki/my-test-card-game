import { corridorWandererEvent } from "@/data/curios";
import { rngFloat, rngInt } from "@/engine/core/rng";
import { EXPLORE_RULES } from "../core/exploreRules";
import type { BattleTier, ExploreState, NodeEvent } from "../types";
import { beginCorridorEncounter, canWalkCorridor } from "./corridorSession";
import { corridorWalkMax, CORRIDOR } from "./types";

export type CorridorAmbushResult = "skip" | "miss" | "hit";

export function energySinceBattle(s: ExploreState): number {
  return s.stats.energySpent - s.battleEnergyMark;
}

export function ambushChance(spent: number): number {
  const { minEnergy, guaranteedEnergy, chanceMin, chanceMax } = EXPLORE_RULES.ambush;
  if (spent < minEnergy) return 0;
  if (spent >= guaranteedEnergy) return 1;
  const span = Math.max(1, guaranteedEnergy - minEnergy - 1);
  const progress = Math.max(0, Math.min(1, (spent - minEnergy) / span));
  return chanceMin + (chanceMax - chanceMin) * progress;
}

export interface EncounterSpot {
  /** 黑影的落点。 */
  x: number;
  /** 玩家应面对的方向(始终朝向黑影)。 */
  facing: -1 | 1;
}

/**
 * 黑影在玩家面前 encounterOffset 处现身；面前放不下(贴墙)就改在身后, 玩家转身面对它。
 * 玩家自身位置不变, 镜头因此不动。两侧都放不下时退回夹紧后的前方位置。
 */
export function encounterSpot(corridor: { width: number }, x: number, facing: -1 | 1): EncounterSpot {
  const min = CORRIDOR.walkMin;
  const max = corridorWalkMax(corridor.width);
  const inside = (spot: number) => spot >= min && spot <= max;
  const ahead = x + facing * CORRIDOR.encounterOffset;
  if (inside(ahead)) return { x: ahead, facing };
  const behind = x - facing * CORRIDOR.encounterOffset;
  if (inside(behind)) return { x: behind, facing: facing < 0 ? 1 : -1 };
  return { x: Math.max(min, Math.min(max, ahead)), facing };
}

function pickAmbushTier(s: ExploreState): BattleTier {
  const options = EXPLORE_RULES.ambush.tierWeights;
  const total = options.reduce((sum, option) => sum + Math.max(0, option.weight), 0);
  if (total <= 0) return options[0].tier;
  let roll = rngInt(s, Math.ceil(total * 1000)) / 1000;
  for (const option of options) {
    roll -= Math.max(0, option.weight);
    if (roll < 0) return option.tier;
  }
  return options[options.length - 1].tier;
}

/**
 * 暗雷检定只掷骰，不生成遭遇：除 rngState 外不改会话任何字段，
 * 行走中每段都要调用，store 可以只浅拷贝顶层提交。命中后再调用 spawnCorridorAmbush。
 */
export function rollCorridorAmbush(s: ExploreState): CorridorAmbushResult {
  if (!canWalkCorridor(s) || !s.corridor) return "skip";
  const chance = ambushChance(energySinceBattle(s));
  return rngFloat(s) >= chance ? "miss" : "hit";
}

/** 暗雷命中：抽档位并在玩家面前生成遭遇。会改 corridor / sceneEvents，调用方须传入深拷贝。 */
export function spawnCorridorAmbush(s: ExploreState, x: number, facing: -1 | 1): boolean {
  return spawnCorridorEncounter(s, corridorWandererEvent(pickAmbushTier(s)), x, facing);
}

/** 在玩家面前生成一场临时遭遇战(暗雷、警报守卫共用), 并立即进入遭遇演出。 */
export function spawnCorridorEncounter(s: ExploreState, event: NodeEvent, x: number, facing: -1 | 1): boolean {
  if (!s.corridor) return false;
  const spot = encounterSpot(s.corridor, x, facing);
  const nodeIndex = s.sceneEvents.length;
  const id = `ambush-${s.corridor.threats.filter((threat) => threat.kind === "ambush").length}`;
  // 玩家原地定格, 只转身面向黑影。
  s.corridor.playerX = x;
  s.corridor.facing = spot.facing;
  s.sceneEvents.push(event);
  s.corridor.threats.push({ id, kind: "ambush", x: spot.x, defeated: false, nodeIndex });
  return beginCorridorEncounter(s, id);
}
