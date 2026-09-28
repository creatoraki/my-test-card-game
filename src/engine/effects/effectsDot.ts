// 持续伤害类效果 —— 从 effects.ts 拆出的状态消耗、扩散、立即结算与焚尽。

import type { BattleState, EffectDescriptor } from "../types";
import { ops } from "../core/ops";
import { foesOf } from "../combat/targeting";
import { getStatusDef } from "../statuses";
import { runStatusTickNow } from "../combat/statusLifecycle";
import { reduceStatusStacks } from "../statuses/stacking";

function consumeStatus(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  state.lastConsumedStatusStacks = 0;
  if (!effect.status) return;
  for (const id of targetIds) {
    const target = state.combatants[id];
    const status = target?.statuses.find((entry) => entry.id === effect.status);
    if (!target || !status) continue;
    let limit = status.stacks;
    if (effect.consumePct != null) limit = Math.min(limit, Math.floor(status.stacks * effect.consumePct));
    if (effect.maxStacks != null) limit = Math.min(limit, Math.floor(effect.maxStacks));
    const consumed = reduceStatusStacks(status, limit);
    if (consumed <= 0) continue;
    state.lastConsumedStatusStacks += consumed;
    if (status.stacks <= 0) target.statuses = target.statuses.filter((entry) => entry !== status);
    ops.log(state, `${target.emoji} ${target.name} 的${getStatusDef(effect.status)?.name ?? effect.status}被消耗 ${consumed} 层`);
  }
}

function spreadStatus(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const src = state.combatants[sourceId];
  if (!effect.status || !src) return;
  const spreadTargets = foesOf(state, src).filter((target) =>
    !effect.targetHasStatus || target.statuses.some((status) => status.id === effect.targetHasStatus && status.stacks > 0),
  );
  for (const sourceTargetId of targetIds) {
    const sourceTarget = state.combatants[sourceTargetId];
    const sourceStatus = sourceTarget?.statuses.find((entry) => entry.id === effect.status);
    if (!sourceStatus) continue;
    const stacks = Math.floor(sourceStatus.stacks * (effect.spreadPct ?? 0.5));
    if (stacks <= 0) continue;
    for (const target of spreadTargets) {
      if (target.id !== sourceTargetId)
        ops.applyStatus(state, target.id, effect.status, stacks, effect.duration ?? sourceStatus.duration, undefined, sourceId);
    }
  }
}

// 毒发 N: 按当前全部层数立即结算 N 次, 不扣层数也不扣持续。
function tickStatusNow(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  if (!effect.status) return;
  const times = Math.max(1, Math.floor(effect.amount ?? 1));
  for (const id of targetIds)
    for (let i = 0; i < times; i++) runStatusTickNow(state, id, effect.status);
}

// 焚尽: 移除目标的全部灼烧, 立即造成"每段层数 × 剩余结算次数"之和的伤害(× multiplier)。
// 持续伤害性质: 无视护盾、不吃状态乘区(蚀刻 / 穿孔), 也不读取易燃。
function incinerate(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  const multiplier = effect.multiplier ?? 1;
  for (const id of targetIds) {
    const target = state.combatants[id];
    const burn = target?.statuses.find((status) => status.id === "burn" && status.stacks > 0);
    if (!target?.alive || !burn) continue;
    const segments = burn.segments ?? [{ stacks: burn.stacks, duration: burn.duration, appliedAt: 0 }];
    const remaining = segments.reduce((sum, segment) => sum + segment.stacks * Math.max(1, segment.duration ?? 1), 0);
    target.statuses = target.statuses.filter((status) => status !== burn);
    const damage = Math.round(remaining * multiplier);
    ops.log(state, `${target.emoji} ${target.name} 的灼烧被焚尽`);
    if (damage <= 0) continue;
    ops.dealDamage(state, undefined, id, damage, {
      flags: ["burn", "incinerate"],
      fixed: true,
      pure: true,
      unblockable: true,
      noLimitLoss: true,
    });
  }
}

export function applyDotEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): void {
  if (effect.type === "CONSUME_STATUS") consumeStatus(state, effect, targetIds);
  else if (effect.type === "SPREAD_STATUS") spreadStatus(state, effect, sourceId, targetIds);
  else if (effect.type === "TICK_STATUS") tickStatusNow(state, effect, targetIds);
  else if (effect.type === "INCINERATE") incinerate(state, effect, targetIds);
}
