// ============================================================================
// 候选效果抽取 —— 「4 选 2」这类 ROLL_EFFECTS 在交互时才掷, 抽中的候选不重复。
// 结算前先整体展开成普通效果, 让单人奖励、备注都按每条效果正常结算。
// ============================================================================

import type { CurioEffect } from "@/data/curios/types";
import { rngInt } from "@/engine/core/rng";
import type { ExploreState } from "../types";

type RollEffect = Extract<CurioEffect, { type: "ROLL_EFFECTS" }>;

/** 从候选里不重复地抽 pick 条, 保持候选原有顺序。 */
export function rollEffects(s: ExploreState, effect: RollEffect): CurioEffect[] {
  const pool = effect.options.map((_, index) => index);
  const picked: number[] = [];
  for (let i = 0; i < Math.min(effect.pick, effect.options.length); i += 1) {
    picked.push(pool.splice(rngInt(s, pool.length), 1)[0]);
  }
  return picked.sort((a, b) => a - b).map((index) => effect.options[index]);
}

/** 把效果列表里的抽取全部掷完, 返回只含普通效果的列表。 */
export function expandRolls(s: ExploreState, effects: readonly CurioEffect[]): CurioEffect[] {
  return effects.flatMap((effect) => (
    effect.type === "ROLL_EFFECTS" ? expandRolls(s, rollEffects(s, effect)) : [effect]
  ));
}
