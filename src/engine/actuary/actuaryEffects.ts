// ============================================================================
// 精算师效果分发 —— 理赔、消耗、转移、补足保险, 以及溢出转保险的即时治疗。
// 由 effects.ts 的 applyEffect 按 ACTUARY_EFFECT_TYPES 转发过来。
// ============================================================================

import type { BattleState, EffectDescriptor, EffectType } from "../types";
import { ops } from "../core/ops";
import { healValue, offenseStatOf } from "../combat/stats";
import { reduceStatusStacks } from "../statuses/stacking";
import {
  claimInsurance,
  dropLifeline,
  insuranceOf,
  insuranceWasHit,
  removeInsurance,
} from "./claims";

export const ACTUARY_EFFECT_TYPES: ReadonlySet<EffectType> = new Set<EffectType>([
  "SETTLE_INSURANCE",
  "CONSUME_INSURANCE",
  "TRANSFER_INSURANCE",
  "TOP_UP_INSURANCE",
  "INDEMNITY_HEAL",
]);

// 施放者治愈力按倍率换算的点数(与 HEAL / 保险层数同口径, 含出牌数值加成)。
function healPoints(state: BattleState, sourceId: string, multiplier: number): number {
  const src = state.combatants[sourceId];
  if (!src) return 0;
  return healValue(offenseStatOf(state, src, "healPower"), multiplier) * (1 + state.playValueBonusPct / 100);
}

// 理赔: 缺省全额并移除保险; settlePct = 只理赔这一比例(向下取整), keepStacks = 不扣层数。
function settle(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const multiplier = effect.multiplier ?? 1;
  for (const id of targetIds) {
    const target = state.combatants[id];
    const insurance = insuranceOf(target);
    if (!target?.alive || !insurance) continue;
    if (effect.settlePct == null) {
      const stacks = insurance.stacks;
      removeInsurance(target, insurance);
      claimInsurance(state, sourceId, id, stacks * multiplier);
      continue;
    }
    const part = Math.floor(insurance.stacks * effect.settlePct);
    if (part <= 0) continue;
    if (!effect.keepStacks) {
      reduceStatusStacks(insurance, part);
      if (insurance.stacks <= 0) removeInsurance(target, insurance);
    }
    claimInsurance(state, sourceId, id, part * multiplier);
  }
}

// 消耗保险(保单质押 / 现金价值): 不回复生命, 消耗量写入 lastConsumedStatusStacks; 寿险随之移除。
function consume(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  state.lastConsumedStatusStacks = 0;
  for (const id of targetIds) {
    const target = state.combatants[id];
    const insurance = insuranceOf(target);
    if (!target || !insurance) continue;
    let limit = insurance.stacks;
    if (effect.consumePct != null) limit = Math.min(limit, Math.floor(insurance.stacks * effect.consumePct));
    if (effect.maxStacks != null) limit = Math.min(limit, Math.floor(effect.maxStacks));
    const consumed = reduceStatusStacks(insurance, limit);
    if (consumed <= 0) continue;
    state.lastConsumedStatusStacks += consumed;
    if (insurance.stacks <= 0) removeInsurance(target, insurance);
    else dropLifeline(target);
    ops.log(state, `${target.emoji} ${target.name} 的保险被消耗 ${consumed} 层`);
  }
}

// 保单转让: 其他队友的保险转到主目标(层数相加、回合取大)。claimTransferred = 转入部分立即理赔。
function transfer(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const targetId = targetIds[0];
  const target = targetId ? state.combatants[targetId] : undefined;
  if (!target?.alive) return;
  let total = 0;
  let duration = 0;
  let hit = false;
  for (const id of state.playerIds) {
    const ally = state.combatants[id];
    const insurance = insuranceOf(ally);
    if (!ally?.alive || id === targetId || !insurance) continue;
    total += insurance.stacks;
    duration = Math.max(duration, insurance.duration ?? 0);
    hit ||= insuranceWasHit(insurance);
    removeInsurance(ally, insurance);
  }
  if (total <= 0) return;
  ops.log(state, `${target.emoji} ${target.name} 受让了 ${total} 层保险`);
  if (effect.claimTransferred) {
    claimInsurance(state, sourceId, targetId, total);
    return;
  }
  ops.applyStatus(state, targetId, "insurance", total, duration > 0 ? duration : undefined, hit ? { hit: 1 } : undefined, sourceId);
}

// 灾后核保: 保险补足到已损失生命(本次增量上限 = stacksFromStat), 随后剩余回合设为 duration。
function topUp(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const cap = Math.round(healPoints(state, sourceId, effect.stacksFromStat?.multiplier ?? 0));
  for (const id of targetIds) {
    const target = state.combatants[id];
    if (!target?.alive) continue;
    const current = insuranceOf(target)?.stacks ?? 0;
    const add = Math.min(cap, Math.max(0, target.hpLimit - target.hp - current));
    if (add > 0) ops.applyStatus(state, id, "insurance", add, effect.duration, undefined, sourceId);
    const insurance = insuranceOf(target);
    if (insurance && effect.duration != null) insurance.duration = effect.duration;
  }
}

// 足额赔付: 即时治疗; 超出已损失生命的部分转为保险。即时治疗的溢出不是溢额, 不计入盈余。
function indemnityHeal(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const healing = healPoints(state, sourceId, effect.multiplier ?? 0);
  for (const id of targetIds) {
    const out = { final: 0 };
    const healed = ops.heal(state, sourceId, id, healing, { scaled: true, single: targetIds.length === 1, out });
    const overflow = out.final - healed;
    if (overflow > 0) ops.applyStatus(state, id, "insurance", overflow, effect.duration, undefined, sourceId);
  }
}

export function applyActuaryEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): void {
  if (effect.type === "SETTLE_INSURANCE") settle(state, effect, sourceId, targetIds);
  else if (effect.type === "CONSUME_INSURANCE") consume(state, effect, targetIds);
  else if (effect.type === "TRANSFER_INSURANCE") transfer(state, effect, sourceId, targetIds);
  else if (effect.type === "TOP_UP_INSURANCE") topUp(state, effect, sourceId, targetIds);
  else if (effect.type === "INDEMNITY_HEAL") indemnityHeal(state, effect, sourceId, targetIds);
}
