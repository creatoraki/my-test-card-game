// 咒术师效果: 痛楚提前结算。从 hexEffects.ts 分发进来。
// 提前结算是兑现, 不是额外伤害: 每结算 1 拍, 各段持续同时 −1, 到期的分段随之移除。

import type { BattleState, EffectDescriptor, StatusInstance } from "../types";
import { ops } from "../core/ops";
import { counterOf } from "../combat/counters";
import { syncSegments } from "../statuses/stacking";

export const TORMENT_STATUS = "boneRot";

function tormentOf(state: BattleState, unitId: string): StatusInstance | undefined {
  const unit = state.combatants[unitId];
  if (!unit?.alive) return undefined;
  return unit.statuses.find((status) => status.id === TORMENT_STATUS && status.stacks > 0);
}

// 扣除 1 拍持续; 全部分段到期后把痛楚从持有者身上移除。
function spendOneBeat(state: BattleState, unitId: string, torment: StatusInstance): void {
  if (torment.segments) {
    for (const segment of torment.segments) if (segment.duration != null) segment.duration -= 1;
    torment.segments = torment.segments.filter((segment) => segment.duration == null || segment.duration > 0);
    syncSegments(torment);
  } else if (torment.duration != null) {
    torment.duration -= 1;
    if (torment.duration <= 0) torment.stacks = 0;
  }
  const unit = state.combatants[unitId];
  if (unit && torment.stacks <= 0) unit.statuses = unit.statuses.filter((status) => status !== torment);
}

function settleBeats(effect: EffectDescriptor, state: BattleState): number {
  const raw = effect.amountFrom ? counterOf(state, effect.amountFrom) : effect.amount ?? 1;
  return Math.max(0, Math.floor(Math.min(effect.maxAmount ?? Infinity, raw)));
}

export function settleTorment(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const beats = settleBeats(effect, state);
  if (beats <= 0) return;
  let dealt = 0;
  for (const id of targetIds) {
    for (let beat = 0; beat < beats; beat++) {
      const torment = tormentOf(state, id);
      if (!torment) break;
      ops.dealDamage(state, undefined, id, torment.stacks, {
        flags: ["boneRot", "tormentSettle"],
        fixed: true,
        pure: true,
        unblockable: true,
        noLimitLoss: true,
        onDealt: (hpLost) => {
          dealt += hpLost;
        },
      });
      spendOneBeat(state, id, torment);
    }
  }
  if (effect.lifesteal != null && dealt > 0 && state.combatants[sourceId]?.alive)
    ops.heal(state, sourceId, sourceId, dealt * effect.lifesteal, { scaled: true });
}
