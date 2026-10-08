// ============================================================================
// 挑战词条运行态 —— 开局抽取、打破、掉落加成汇总。各时机的判定钩子见 ./checks.ts。
// ============================================================================

import type { BattleState, ChallengeId, ChallengeRun } from "../types";
import { shuffle } from "../core/rng";
import { CHALLENGE_DEFS, CHALLENGE_PICK, CHALLENGE_POOL } from "./defs";

export function rollChallenges(state: BattleState): ChallengeRun[] {
  return shuffle(state, CHALLENGE_POOL)
    .slice(0, CHALLENGE_PICK)
    .map((id) => ({ id, broken: false }));
}

// 擒贼擒王: 开场在场敌人里生命上限并列最高的那几位 —— 中途召唤 / 增援不进比较范围。
export function regicideTargetIds(state: BattleState): string[] {
  const enemies = state.enemyIds.map((id) => state.combatants[id]).filter((enemy) => enemy?.alive);
  const top = Math.max(0, ...enemies.map((enemy) => enemy.maxHp));
  return enemies.filter((enemy) => enemy.maxHp === top).map((enemy) => enemy.id);
}

export function breakChallenge(state: BattleState, id: ChallengeId, reason: string): void {
  const challenge = state.challenges.find((run) => run.id === id);
  if (!challenge || challenge.broken) return;
  challenge.broken = true;
  state.log.push({
    round: state.round,
    tick: state.tick,
    text: `⛓️ 挑战「${CHALLENGE_DEFS[id].title}」已打破: ${reason}`,
  });
}

// 本场是否抽到了该词条且尚未打破 —— 用于跳过不必要的统计开销。
export function isLive(state: BattleState, id: ChallengeId): boolean {
  return state.challenges.some((run) => run.id === id && !run.broken);
}

export function earnedChallengeBonus(state: BattleState): number {
  return state.challenges.reduce(
    (total, run) => total + (run.broken ? 0 : CHALLENGE_DEFS[run.id].dropBonus),
    0,
  );
}
