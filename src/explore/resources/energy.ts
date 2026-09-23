// 净化粒子的唯一改写口 —— 探索会话与地牢模块共用, 避免两边各写一份 clamp 与统计。
import { EXPLORE_RULES } from "../core/exploreRules";
import type { ExploreState } from "../types";

/** 增减净化粒子并累计消耗统计; 上下限由 EXPLORE_RULES 兜底。 */
export function changeEnergy(s: ExploreState, delta: number): void {
  const before = s.energy;
  s.energy = Math.max(0, Math.min(EXPLORE_RULES.energyMax, before + delta));
  s.stats.energySpent += Math.max(0, before - s.energy);
}
