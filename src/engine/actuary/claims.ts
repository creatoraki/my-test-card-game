// ============================================================================
// 理赔 —— "保险转为治疗"的统一入口。到期、提前理赔、止损、寿险、保单转让(急诊)
// 全部走 claimInsurance: 回复生命 → 佣金抽成 → 保费返还 → 溢额(受益人改道 → 按比例计入盈余)。
// 持有者带定损时改为: 只回复已损失生命 → 佣金按实际回复抽成 → 没用上的层数续回(不产生溢额)。
// ============================================================================

import type { BattleState, Combatant, StatusInstance } from "../types";
import { ops } from "../core/ops";
import { gainSurplus, overflowToSurplusRate } from "./surplus";
import { COMMISSION_CARD_ID, PREMIUM_REFUND_CARD_ID, handPassiveCount, hasStatus } from "./actuaryRules";
import { runRelicHook } from "../relics/types";

// 佣金: 每张手牌中的《佣金》按本次理赔回复量的这一比例获得盈余。
const COMMISSION_RATE = 0.2;
// 保费返还: 每张手牌中的《保费返还》让持有者获得本次溢额这一比例的护盾(溢额照常结算)。
const PREMIUM_REFUND_RATE = 0.5;

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

// 保费返还: 溢额按比例转为持有者的护盾, 不占用溢额本身(受益人与盈余照常结算)。
function refundOverflow(state: BattleState, sourceId: string | undefined, targetId: string, overflow: number): void {
  const refund = handPassiveCount(state, PREMIUM_REFUND_CARD_ID);
  if (refund <= 0 || overflow <= 0) return;
  ops.gainShield(state, sourceId, targetId, Math.floor(overflow * PREMIUM_REFUND_RATE * refund));
}

// 定损: 持有期间理赔只回复已损失生命, 被扣掉却没用上的层数续回给持有者, 持续这么多回合。
export const ASSESSED_CLAIM_STATUS = "assessedClaim";
const ASSESSED_RENEW_DURATION = 2;

export interface ClaimOpts {
  multiplier?: number; // 理赔倍率(提前理赔 ×1.5、寿险 ×2), 缺省 1
  // 本次理赔的层数已从保险上扣除(缺省 true)。止损这类不扣层数的理赔为 false: 定损时不再续回。
  deducted?: boolean;
}

// 定损续回: 按"未用上的回复量 ÷ 总回复量"把层数折回(理赔倍率与治愈强度都在这个比例里抵掉)。
function renewUnused(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  stacks: number,
  final: number,
  healed: number,
): void {
  const unused = final > 0 ? Math.floor(((final - healed) / final) * stacks) : 0;
  if (unused <= 0) return;
  const target = state.combatants[targetId];
  ops.log(state, `${target.emoji} ${target.name} 定损理赔，${unused} 层保险续回`);
  ops.applyStatus(state, targetId, "insurance", unused, ASSESSED_RENEW_DURATION, undefined, sourceId);
}

// 一次理赔。stacks = 理赔的保险层数, 回复量 = 层数 × 理赔倍率, 照常吃施放者的治愈强度。
// ★ 调用方负责先扣除 / 移除保险层数, 这里只结算"保险转为治疗"及其连带收益。
export function claimInsurance(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  stacks: number,
  opts: ClaimOpts = {},
): void {
  const target = state.combatants[targetId];
  const amount = stacks * (opts.multiplier ?? 1);
  if (!target?.alive || amount <= 0) return;
  const out = { final: 0 };
  const healed = ops.heal(state, sourceId, targetId, amount, { scaled: true, out });
  ops.log(state, `${target.emoji} ${target.name} 的保险理赔 ${out.final} 点`);
  const commission = handPassiveCount(state, COMMISSION_CARD_ID);
  if (hasStatus(target, ASSESSED_CLAIM_STATUS)) {
    // 定损: 回复量只认实际回复的生命, 不产生溢额(不进盈余、不改道受益人、不触发保费返还)。
    if (commission > 0) gainSurplus(state, healed * COMMISSION_RATE * commission);
    if (opts.deducted ?? true) renewUnused(state, sourceId, targetId, stacks, out.final, healed);
  } else {
    if (commission > 0) gainSurplus(state, out.final * COMMISSION_RATE * commission);
    refundOverflow(state, sourceId, targetId, out.final - healed);
    routeOverflow(state, targetId, out.final - healed);
  }
  runRelicHook(state, "afterInsuranceClaim", targetId, healed);
}

// 保险自然到期: 移除后按当前层数理赔。
export function settleExpiredInsurance(state: BattleState, ownerId: string, inst: StatusInstance): void {
  const owner = state.combatants[ownerId];
  if (!owner) return;
  const stacks = inst.stacks;
  removeInsurance(owner, inst);
  claimInsurance(state, inst.sourceId, ownerId, stacks);
}

// 超额保险: 层数中超出持有者已损失生命的部分(此刻理赔必然溢出的那部分)。
export function excessInsuranceOf(cmb: Combatant, inst: StatusInstance): number {
  return Math.max(0, inst.stacks - Math.max(0, cmb.hpLimit - cmb.hp));
}
