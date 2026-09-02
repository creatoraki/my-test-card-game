// ============================================================================
// 挑战词条运行时判定 —— 每个词条一个钩子, 由引擎各处在对应时机调用。
// ★ 依赖方向单向: 本模块只 import types / rng / rules, 由 ops / battle / scheduler 调用。
// ★ 口径: 只有玩家主动 playCard 参与"打出"判定, 弃牌联动的自动出牌不计
//   (与 state.playedThisRound 同一口径)。
// ============================================================================

import type { BattleState, Card, ChallengeId, ChallengeRun, Combatant } from "../types";
import { shuffle } from "../rng";
import { RULES } from "../rules";
import {
  CHALLENGE_DEFS,
  CHALLENGE_PICK,
  CHALLENGE_POOL,
  MERCY_MAX_DAMAGE,
  RESTRAINT_MIN_MANA,
  ROTATION_MIN_OWNERS,
} from "./defs";

export * from "./defs";

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

// 本场是否抽到了该词条且尚未打破 —— 用于跳过不必要的统计开销。
function isLive(state: BattleState, id: ChallengeId): boolean {
  return state.challenges.some((run) => run.id === id && !run.broken);
}

// ---------------------------------------------------------------------------
// 大屠杀 —— 首杀记回合, 跨回合还有敌人存活即破
// ---------------------------------------------------------------------------
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

export function checkMassacreOnRoundSettle(state: BattleState): void {
  if (state.phase === "player" && state.challengeKillRound != null) {
    breakChallenge(state, "massacre", "敌人未在同一回合内全部倒下");
  }
}

// ---------------------------------------------------------------------------
// 出牌时判定 —— 唯快不破 / 轻装上阵 / 养精蓄锐
// faceCost 是本次实际结算的费用(已含减免), 与玩家在手牌上看到的数字一致。
// ---------------------------------------------------------------------------
export function noteChallengePlay(state: BattleState, card: Card, faceCost: number): void {
  if (card.cardType === "normal") {
    breakChallenge(state, "blitz", `打出了普通牌「${card.name}」`);
  }
  if (faceCost > RULES.combat.lowCostApMax) {
    breakChallenge(state, "low_cost", `打出了 ${faceCost} 费的「${card.name}」`);
  }
  if (state.round === 1) {
    breakChallenge(state, "slow_start", `第 1 回合打出了「${card.name}」`);
  }
}

// ---------------------------------------------------------------------------
// 换牌时判定 —— 不改初衷
// ---------------------------------------------------------------------------
export function noteChallengeRedraw(state: BattleState): void {
  breakChallenge(state, "no_redraw", "使用了换牌");
}

// ---------------------------------------------------------------------------
// 回合结束时判定 —— 克制 / 轮转
// ★ 中途取胜的那一回合不追判(与大屠杀口径一致): endRound 根本不会被调到。
// ---------------------------------------------------------------------------
export function checkChallengesOnEndTurn(state: BattleState): void {
  if ((state.resources[RULES.resource.name] ?? 0) < RESTRAINT_MIN_MANA) {
    breakChallenge(state, "restraint", `结束回合时法力不足 ${RESTRAINT_MIN_MANA} 点`);
  }
  if (isLive(state, "rotation")) {
    const owners = new Set(state.playedThisRound.map((played) => played.ownerCharId));
    if (owners.size < ROTATION_MIN_OWNERS) {
      breakChallenge(state, "rotation", `本回合只打出了 ${owners.size} 种归属角色的牌`);
    }
  }
}

// ---------------------------------------------------------------------------
// 伤害落到 HP 时判定 —— 慈悲 / 聚焦
// ★ 聚焦只认实际掉血(hpLost > 0): 护盾全吸收 / 未命中 / 持续伤害都不登记目标。
// ---------------------------------------------------------------------------
export function noteChallengeDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  hpLost: number,
): void {
  if (!sourceId || state.combatants[sourceId]?.team !== "player") return;
  if (hpLost > MERCY_MAX_DAMAGE) {
    breakChallenge(state, "mercy", `单次攻击造成了 ${hpLost} 点实际伤害`);
  }
  if (hpLost <= 0 || state.combatants[targetId]?.team !== "enemy") return;
  if (state.challengeFocusTargetId == null) {
    state.challengeFocusTargetId = targetId;
    return;
  }
  if (state.challengeFocusTargetId !== targetId) {
    breakChallenge(state, "focus_fire", `本回合伤害同时落在了 ${state.combatants[targetId]?.name} 身上`);
  }
}

// ---------------------------------------------------------------------------
// 敌人行动前判定 —— 抢拍。每回合只在第一次敌人行动前判一次。
// ---------------------------------------------------------------------------
export function noteChallengeEnemyAct(state: BattleState): void {
  if (state.challengeEnemyActRound === state.round) return;
  state.challengeEnemyActRound = state.round;
  const mana = state.resources[RULES.resource.name] ?? 0;
  if (mana > 0) {
    breakChallenge(state, "tempo", `敌人行动时还剩 ${mana} 点${RULES.resource.label}`);
  }
}

// ---------------------------------------------------------------------------
// 胜利瞬间判定 —— 及时治疗。阵亡成员(hp 0 ≠ 体力极限)视为已破。
// ---------------------------------------------------------------------------
export function checkChallengesOnWin(state: BattleState): void {
  for (const id of state.playerIds) {
    const ally = state.combatants[id];
    if (!ally) continue;
    if (!ally.alive) {
      breakChallenge(state, "untouched", `${ally.name} 已阵亡`);
      return;
    }
    if (ally.hp !== ally.hpLimit) {
      breakChallenge(state, "untouched", `${ally.name} 生命 ${ally.hp} / 体力极限 ${ally.hpLimit}`);
      return;
    }
  }
}

export function earnedChallengeBonus(state: BattleState): number {
  return state.challenges.reduce(
    (total, run) => total + (run.broken ? 0 : CHALLENGE_DEFS[run.id].dropBonus),
    0,
  );
}
