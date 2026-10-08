// 羁绊对「出牌」本身的改写: 费用(力量 9 / 恶魔 12)、视为速攻(力量 9 / 战车 9)、
// 回手(星星 9)、血契代付法力(恶魔 4)。由 cards/cost.ts 与 battle/playCard.ts 调用。

import type { BattleState, Card, DiscardReason } from "../types";
import { RULES } from "../core/battleRules";
import { log, loseHp } from "../core/ops";
import { isAttackCard, isHeavyAttack, hasBondTier } from "./bondState";

const DEVIL_FREE_PLAYS = 2;

function devilFree(state: BattleState, card: Card): boolean {
  if (!hasBondTier(state, "devil", 3) || state.bond.round.devilFreePlays >= DEVIL_FREE_PLAYS) return false;
  const owner = state.combatants[card.ownerCharId];
  return Boolean(owner?.alive && owner.hp < owner.maxHp * 0.3);
}

function strengthFirstHeavy(state: BattleState, card: Card): boolean {
  return hasBondTier(state, "strength", 3) && !state.bond.round.strengthHeavyUsed && isHeavyAttack(card);
}

/** cards/cost.ts 读取: 覆盖费用(恶魔 12 免费)或费用增减(力量 9 −1)。 */
export function bondCostRule(state: BattleState | null, card: Card): { override?: number; delta: number } {
  if (!state?.bond || card.cardType === "passive") return { delta: 0 };
  if (devilFree(state, card)) return { override: 0, delta: 0 };
  return { delta: strengthFirstHeavy(state, card) ? -1 : 0 };
}

/**
 * 出牌时结算羁绊对本张牌的改写, 并消耗对应的每回合次数。
 * ⚠ 必须在 cardCost 读完费用之后调用 —— 否则力量 9 的降费会先被标记用掉。
 */
export function consumeBondPlay(state: BattleState, card: Card): { asFast: boolean } {
  if (!state.bond) return { asFast: false };
  const round = state.bond.round;
  let asFast = false;
  if (devilFree(state, card)) {
    round.devilFreePlays += 1;
    log(state, "恶魔·契约：本张牌不消耗法力");
  }
  if (strengthFirstHeavy(state, card)) {
    round.strengthHeavyUsed = true;
    asFast = true;
    log(state, "力量·驯狮：重攻视为速攻");
  }
  if (round.chariotFastPending && isAttackCard(card)) {
    round.chariotFastPending = false;
    asFast = true;
    log(state, "战车·驰骋：本张攻击牌视为速攻");
  }
  return { asFast };
}

/** 星星 9: 本回合第一张速攻牌结算后返回手牌。 */
export function starReturnsToHand(state: BattleState, card: Card, playedFast: boolean): boolean {
  if (!playedFast || card.exhaust || !hasBondTier(state, "star", 3) || state.bond.round.starReturnUsed) return false;
  state.bond.round.starReturnUsed = true;
  log(state, `星星·指引：${card.name} 返回手牌`);
  return true;
}

/** 隐者 9: 每回合第一次主动弃牌也触发该牌的「被弃置时」效果。调用即消耗次数。 */
export function hermitManualTriggers(state: BattleState, reason: DiscardReason): boolean {
  if (reason !== "manual" || !state.bond || !hasBondTier(state, "hermit", 3) || state.bond.round.hermitManualUsed)
    return false;
  state.bond.round.hermitManualUsed = true;
  log(state, "隐者·提灯：主动弃牌触发被弃置效果");
  return true;
}

// ---------------------------------------------------------------------------
// 恶魔 4 · 血契: 每回合 1 次, 法力只差 1 点时由出牌角色支付最大生命 15% 代替; 不能因此进入濒死。
// ---------------------------------------------------------------------------
export function bloodPactHpCost(state: BattleState, card: Card, manaCost: number): number {
  if (!state.bond || !hasBondTier(state, "devil", 1) || state.bond.round.devilBloodUsed) return 0;
  const mana = state.resources[RULES.resource.name] ?? 0;
  if (manaCost - mana !== 1) return 0;
  const owner = state.combatants[card.ownerCharId];
  if (!owner?.alive) return 0;
  const cost = Math.ceil(owner.maxHp * 0.15);
  return owner.hp > cost ? cost : 0;
}

/** 出牌支付: 法力不足时尝试血契, 返回实际应扣的法力。 */
export function payWithBloodPact(state: BattleState, card: Card, manaCost: number): number {
  const mana = state.resources[RULES.resource.name] ?? 0;
  if (mana >= manaCost) return manaCost;
  const hpCost = bloodPactHpCost(state, card, manaCost);
  if (hpCost <= 0) return manaCost;
  state.bond.round.devilBloodUsed = true;
  log(state, `恶魔·契约：${state.combatants[card.ownerCharId].name} 以 ${hpCost} 点生命代付 1 点法力`);
  loseHp(state, card.ownerCharId, hpCost);
  return manaCost - 1;
}
