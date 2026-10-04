// ============================================================================
// 保险的受击联动 —— 增值、高风险、止损、寿险、共同海损。
// 这些规则分别挂在不同状态上(目标的保险 / 止损 / 寿险 / 共同海损, 攻击者的高风险), 但彼此有先后:
//   扣血前: 共同海损先分摊, 再判定寿险(按分摊后的伤害);
//   受击后: 先增值, 再止损(按增值后的层数), 最后寿险理赔。
// 所以每个状态的钩子都只转发到这里, 同一次伤害只结算一遍(WeakSet 去重), 与状态挂上的先后无关。
// ============================================================================

import type { BattleState, Combatant, DamageCtx } from "../types";
import { ops } from "../core/ops";
import { growInsurance } from "../combat/insurance";
import { claimInsurance, dropLifeline, insuranceOf, markInsuranceHit, removeInsurance } from "./claims";
import { hasStatus } from "./actuaryRules";

const INSURANCE_GROWTH = 1.2;
const HIGH_RISK_GROWTH = 1.5;
const HIGH_RISK_INSURANCE_DURATION = 2;
const LIFELINE_CLAIM_MULTIPLIER = 2;

const beforeHpLossDone = new WeakSet<DamageCtx>();
const afterHitDone = new WeakSet<DamageCtx>();
const armedLifelines = new WeakSet<DamageCtx>();
// 分摊伤害走 loseHp, 不会重入伤害管线; 这里只防同一次分摊里再次分摊。
let sharing = false;

function isEnemyAttackOnAlly(state: BattleState, dmg: DamageCtx): boolean {
  const source = dmg.sourceId ? state.combatants[dmg.sourceId] : undefined;
  const target = state.combatants[dmg.targetId];
  return dmg.isAttack && source?.team === "enemy" && target?.team === "player";
}

function lifelineReady(state: BattleState, cmb: Combatant): boolean {
  return hasStatus(cmb, "lifeline") && Boolean(insuranceOf(cmb)) && !state.lifelineUsed.includes(cmb.id);
}

// 寿险生效: 移除寿险并记入本场已触发, 立即理赔全部保险 ×2。
function triggerLifeline(state: BattleState, ownerId: string): void {
  const owner = state.combatants[ownerId];
  if (!owner?.alive) return;
  dropLifeline(owner);
  if (!state.lifelineUsed.includes(ownerId)) state.lifelineUsed.push(ownerId);
  ops.log(state, `${owner.emoji} ${owner.name} 的寿险生效，生命保留为 1`);
  const insurance = insuranceOf(owner);
  if (!insurance) return;
  const stacks = insurance.stacks;
  removeInsurance(owner, insurance);
  claimInsurance(state, insurance.sourceId, ownerId, stacks * LIFELINE_CLAIM_MULTIPLIER);
}

// 视为受到一次敌方直接攻击: 保险增值并记录受击, 随后结算止损(按增值后的层数, 不扣层数)。
function onStruck(state: BattleState, ownerId: string, growth: number): void {
  const owner = state.combatants[ownerId];
  if (!owner?.alive) return;
  const insurance = insuranceOf(owner);
  if (insurance) {
    growInsurance(state, ownerId, insurance, growth);
    markInsuranceHit(insurance);
  }
  const stopLoss = owner.statuses.find((status) => status.id === "stopLoss");
  if (!stopLoss) return;
  owner.statuses = owner.statuses.filter((status) => status !== stopLoss);
  ops.log(state, `${owner.emoji} ${owner.name} 的止损生效`);
  const current = insuranceOf(owner);
  if (current) claimInsurance(state, current.sourceId, ownerId, current.stacks);
}

// 共同海损的分摊: 失去生命(不吃护盾与防御), 视为受到一次直接攻击 —— 增值、急诊记录、止损;
// 不触发风险准备金与高风险。分摊同样受寿险保护。
function applyShare(state: BattleState, allyId: string, share: number): void {
  const ally = state.combatants[allyId];
  if (!ally?.alive) return;
  let lost = share;
  const armed = ally.hp > 0 && lost >= ally.hp && lifelineReady(state, ally);
  if (armed) lost = ally.hp - 1;
  if (lost > 0) ops.loseHp(state, allyId, lost);
  if (!state.attackedThisRound.includes(allyId)) state.attackedThisRound.push(allyId);
  onStruck(state, allyId, INSURANCE_GROWTH);
  if (armed) triggerLifeline(state, allyId);
}

function shareDamage(state: BattleState, target: Combatant, dmg: DamageCtx): void {
  const allies = state.playerIds.map((id) => state.combatants[id]).filter((ally) => ally?.alive);
  if (allies.length <= 1) return;
  const share = Math.ceil(dmg.amount / allies.length);
  dmg.amount = share;
  ops.log(state, `共同海损：${target.emoji} ${target.name} 受到的伤害由全队分摊，每人 ${share} 点`);
  sharing = true;
  try {
    for (const ally of allies) if (ally.id !== target.id) applyShare(state, ally.id, share);
  } finally {
    sharing = false;
  }
}

// 扣血前(护盾吸收之后): 共同海损分摊 → 寿险拦截致命伤害。
export function actuaryBeforeHpLoss(state: BattleState, targetId: string, dmg: DamageCtx): void {
  if (beforeHpLossDone.has(dmg)) return;
  beforeHpLossDone.add(dmg);
  const target = state.combatants[targetId];
  if (!target?.alive || target.team !== "player" || target.hp <= 0 || dmg.amount <= 0) return;
  if (!sharing && isEnemyAttackOnAlly(state, dmg) && hasStatus(target, "generalAverage"))
    shareDamage(state, target, dmg);
  if (dmg.amount >= target.hp && lifelineReady(state, target)) {
    dmg.amount = target.hp - 1;
    armedLifelines.add(dmg);
  }
}

// 受击后: 增值(高风险改为 ×1.5) → 止损 → 未投保者被高风险攻击时获得保险 → 寿险理赔。
export function actuaryAfterHit(state: BattleState, ownerId: string, dmg: DamageCtx): void {
  if (afterHitDone.has(dmg)) return;
  afterHitDone.add(dmg);
  const owner = state.combatants[ownerId];
  if (!owner?.alive || owner.team !== "player") return;
  if (isEnemyAttackOnAlly(state, dmg)) {
    const attacker = state.combatants[dmg.sourceId!];
    const highRisk = attacker?.statuses.find((status) => status.id === "highRisk" && status.stacks > 0);
    const insured = Boolean(insuranceOf(owner));
    onStruck(state, ownerId, highRisk ? HIGH_RISK_GROWTH : INSURANCE_GROWTH);
    const insure = Math.round(highRisk?.data?.insure ?? 0);
    if (!insured && highRisk && insure > 0)
      ops.applyStatus(state, ownerId, "insurance", insure, HIGH_RISK_INSURANCE_DURATION, undefined, highRisk.sourceId);
  }
  if (armedLifelines.has(dmg)) triggerLifeline(state, ownerId);
}
