// ============================================================================
// 理赔 —— "保险转为治疗"的统一入口。到期、提前理赔、分期赔付、止损、寿险、保单转让(急诊)
// 全部走 claimInsurance: 回复生命 → 佣金抽成 → 溢额(受益人改道 → 按比例计入盈余)。
// ============================================================================

import type { BattleState, Combatant, StatusInstance } from "../types";
import { ops } from "../core/ops";
import { gainSurplus, overflowToSurplusRate } from "./surplus";
import { COMMISSION_CARD_ID, NO_CLAIM_BONUS_CARD_ID, handPassiveCount, hasStatus } from "./actuaryRules";

// 佣金: 每张手牌中的《佣金》按本次理赔回复量的这一比例获得盈余。
const COMMISSION_RATE = 0.2;
// 无赔优待: 存续期间从未受击的保险自然到期时, 每张手牌中的《无赔优待》提高的回复量比例。
const NO_CLAIM_BONUS = 0.5;

export function insuranceOf(cmb: Combatant | undefined): StatusInstance | undefined {
  return cmb?.statuses.find((status) => status.id === "insurance" && status.stacks > 0);
}

// 寿险随保险存续: 保险被移除、消耗、转走时一并移除。
export function dropLifeline(cmb: Combatant): void {
  cmb.statuses = cmb.statuses.filter((status) => status.id !== "lifeline");
}

export function removeInsurance(cmb: Combatant, inst: StatusInstance): void {
  cmb.statuses = cmb.statuses.filter((status) => status !== inst);
  dropLifeline(cmb);
}

// 保险存续期间是否受到过敌方直接攻击(供无赔优待读取)。合并 / 转移时任一份被打过即记为受过攻击。
export function markInsuranceHit(inst: StatusInstance): void {
  inst.data = { ...inst.data, hit: 1 };
}

export function insuranceWasHit(inst: StatusInstance): boolean {
  return (inst.data?.hit ?? 0) > 0;
}

// 溢额: 先改道给受益人(溢额来自其他队友时), 剩余部分按比例计入盈余。
function routeOverflow(state: BattleState, fromId: string, overflow: number): void {
  let remaining = Math.max(0, overflow);
  if (remaining <= 0) return;
  const beneficiary = state.playerIds
    .map((id) => state.combatants[id])
    .find((ally) => ally?.alive && ally.id !== fromId && hasStatus(ally, "beneficiary"));
  if (beneficiary) {
    const healed = ops.heal(state, undefined, beneficiary.id, remaining);
    if (healed > 0) ops.log(state, `${beneficiary.emoji} ${beneficiary.name} 作为受益人接收了 ${healed} 点溢额`);
    remaining -= healed;
  }
  gainSurplus(state, remaining * overflowToSurplusRate(state));
}

// 一次理赔。amount = 理赔的保险点数(已乘理赔倍率); 回复量照常吃施放者的治愈强度。
// ★ 调用方负责先扣除 / 移除保险层数, 这里只结算"保险转为治疗"及其连带收益。
export function claimInsurance(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
): void {
  const target = state.combatants[targetId];
  if (!target?.alive || amount <= 0) return;
  const out = { final: 0 };
  const healed = ops.heal(state, sourceId, targetId, amount, { scaled: true, out });
  ops.log(state, `${target.emoji} ${target.name} 的保险理赔 ${out.final} 点`);
  const commission = handPassiveCount(state, COMMISSION_CARD_ID);
  if (commission > 0) gainSurplus(state, out.final * COMMISSION_RATE * commission);
  routeOverflow(state, targetId, out.final - healed);
}

// 保险自然到期: 移除后按当前层数理赔; 存续期间未受击时吃无赔优待加成。
export function settleExpiredInsurance(state: BattleState, ownerId: string, inst: StatusInstance): void {
  const owner = state.combatants[ownerId];
  if (!owner) return;
  const stacks = inst.stacks;
  removeInsurance(owner, inst);
  const bonus = insuranceWasHit(inst) ? 0 : NO_CLAIM_BONUS * handPassiveCount(state, NO_CLAIM_BONUS_CARD_ID);
  if (bonus > 0) ops.log(state, `${owner.emoji} ${owner.name} 的保险享受无赔优待`);
  claimInsurance(state, inst.sourceId, ownerId, stacks * (1 + bonus));
}
