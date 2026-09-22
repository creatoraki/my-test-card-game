import { corridorWandererEvent } from "../../data/curios";
import { rngFloat, rngInt } from "../../engine/rng";
import { EXPLORE_RULES } from "../rules";
import type { BattleTier, ExploreState, NodeEvent } from "../types";
import { beginCorridorEncounter, canWalkCorridor } from "./session";
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

export function encounterSpot(corridor: { width: number }, x: number, facing: -1 | 1): number {
  const spot = x + facing * CORRIDOR.encounterOffset;
  return Math.max(CORRIDOR.walkMin, Math.min(corridorWalkMax(corridor.width), spot));
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

export function rollCorridorAmbush(
  s: ExploreState,
  x: number,
  facing: -1 | 1,
): CorridorAmbushResult {
  if (!canWalkCorridor(s) || !s.corridor || !s.board) return "skip";
  const chance = ambushChance(energySinceBattle(s));
  if (rngFloat(s) >= chance) return "miss";
  spawnCorridorEncounter(s, corridorWandererEvent(pickAmbushTier(s)), x, facing);
  return "hit";
}

/** 在玩家面前生成一场临时遭遇战(暗雷、警报守卫共用), 并立即进入遭遇演出。 */
export function spawnCorridorEncounter(s: ExploreState, event: NodeEvent, x: number, facing: -1 | 1): boolean {
  if (!s.corridor || !s.board) return false;
  const playerX = encounterSpot(s.corridor, x, facing);
  const nodeIndex = s.board.nodes.length;
  const id = `ambush-${s.corridor.threats.filter((threat) => threat.kind === "ambush").length}`;
  s.corridor.playerX = playerX;
  s.corridor.facing = facing;
  s.board.nodes.push([event]);
  s.board.segments.push({ index: s.board.segments.length, bridges: [] });
  s.corridor.threats.push({ id, kind: "ambush", x: playerX, defeated: false, nodeIndex });
  return beginCorridorEncounter(s, id);
}
