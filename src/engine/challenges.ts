import type { BattleState, ChallengeId, ChallengeRun, Combatant } from "./types";
import { shuffle } from "./rng";

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  icon: string;
  desc: string;
  dropBonus: number;
}

export const CHALLENGE_DEFS: Record<ChallengeId, ChallengeDef> = {
  restraint: {
    id: "restraint",
    title: "克制",
    icon: "⛓",
    desc: "每回合都保留至少 1 点法力值结束回合",
    dropBonus: 0.5,
  },
  massacre: {
    id: "massacre",
    title: "大屠杀",
    icon: "☠",
    desc: "同一回合击杀所有目标",
    dropBonus: 0.8,
  },
  mercy: {
    id: "mercy",
    title: "慈悲",
    icon: "🕊",
    desc: "单次攻击不造成 25 点以上的伤害",
    dropBonus: 0.3,
  },
};

export const CHALLENGE_POOL: ChallengeId[] = ["restraint", "massacre", "mercy"];
export const CHALLENGE_PICK = 2;
export const MERCY_MAX_DAMAGE = 25;
export const RESTRAINT_MIN_MANA = 1;

export function rollChallenges(state: BattleState): ChallengeRun[] {
  return shuffle(state, CHALLENGE_POOL)
    .slice(0, CHALLENGE_PICK)
    .map((id) => ({ id, broken: false }));
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

export function noteChallengeKill(state: BattleState, victim: Combatant): void {
  if (victim.team !== "enemy") return;
  if (state.challengeKillRound == null) {
    state.challengeKillRound = state.round;
    return;
  }
  if (state.challengeKillRound !== state.round) {
    breakChallenge(state, "massacre", "敌人跨回合存活");
  }
}

export function checkChallengesOnEndTurn(state: BattleState): void {
  if ((state.resources.mana ?? 0) < RESTRAINT_MIN_MANA) {
    breakChallenge(state, "restraint", "结束回合时法力不足 1 点");
  }
}

export function checkMassacreOnRoundSettle(state: BattleState): void {
  if (state.phase === "player" && state.challengeKillRound != null) {
    breakChallenge(state, "massacre", "敌人未在同一回合内全部倒下");
  }
}

export function noteChallengeDamage(state: BattleState, sourceId: string | undefined, hpLost: number): void {
  if (!sourceId || state.combatants[sourceId]?.team !== "player") return;
  if (hpLost > MERCY_MAX_DAMAGE) {
    breakChallenge(state, "mercy", `单次攻击造成了 ${hpLost} 点实际伤害`);
  }
}

export function earnedChallengeBonus(state: BattleState): number {
  return state.challenges.reduce(
    (total, run) => total + (run.broken ? 0 : CHALLENGE_DEFS[run.id].dropBonus),
    0,
  );
}
