import type { BattleState, EffectDescriptor, StatusInstance } from "./types";
import { getStatusDef } from "./statuses";
import { syncSegments } from "./statuses/stacking";
import { rngPick } from "./rng";
import { foesOf } from "./targeting";
import { transferPierce } from "./pierce";
import { ops } from "./ops";

function matchesKind(status: StatusInstance, kind: EffectDescriptor["statusKind"]): boolean {
  const actual = getStatusDef(status.id)?.kind;
  return kind === "all" || actual === (kind ?? "debuff");
}

function extendStatuses(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  const amount = Math.max(0, Math.floor(effect.amount ?? 1));
  if (amount <= 0) return;
  for (const id of targetIds) {
    const target = state.combatants[id];
    if (!target?.alive) continue;
    for (const status of target.statuses) {
      if (!matchesKind(status, effect.statusKind)) continue;
      if (status.segments) {
        for (const segment of status.segments) {
          if (segment.duration != null) segment.duration += amount;
        }
        syncSegments(status);
      } else if (status.duration != null) {
        status.duration += amount;
      }
    }
  }
}

function transferStatus(state: BattleState, effect: EffectDescriptor, sourceIds: string[], sourceId: string): void {
  if (effect.status !== "pierce") return;
  const source = state.combatants[sourceId];
  const candidates = source
    ? foesOf(state, source).filter((foe) => !sourceIds.includes(foe.id))
    : [];
  for (const fromId of sourceIds) {
    const target = candidates.length ? rngPick(state, candidates) : undefined;
    if (!target) continue;
    transferPierce(state, fromId, target.id, effect.maxStacks ?? Infinity);
    ops.log(state, `${target.name} 接收了转移的穿孔`);
  }
}

function transferDebuffs(state: BattleState, sourceId: string): void {
  const source = state.combatants[sourceId];
  const target = source ? rngPick(state, foesOf(state, source)) : undefined;
  if (!target || state.lastRemovedStatuses.length === 0) {
    state.lastRemovedStatuses = [];
    return;
  }
  for (const status of state.lastRemovedStatuses)
    ops.applyStatus(state, target.id, status.id, status.stacks, 1, status.data, sourceId);
  ops.log(state, `${target.name} 接收了被转移的负面状态`);
  state.lastRemovedStatuses = [];
}

export function applyStatusMoveEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): void {
  if (effect.type === "EXTEND_STATUS") extendStatuses(state, effect, targetIds);
  else if (effect.type === "TRANSFER_STATUS") transferStatus(state, effect, targetIds, sourceId);
  else if (effect.type === "TRANSFER_DEBUFFS") transferDebuffs(state, targetIds[0] ?? sourceId);
}
