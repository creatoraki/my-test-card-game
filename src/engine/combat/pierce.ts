import type { BattleState, Combatant } from "../types";
import { cleanup, getStatus, ops } from "../core/ops";
import { foesOf } from "./targeting";

function pierceOn(target: Combatant | undefined): number {
  return target ? getStatus(target, "pierce")?.stacks ?? 0 : 0;
}

export function pierceOf(target: Combatant | undefined): number;
export function pierceOf(state: BattleState, targetId: string): number;
export function pierceOf(
  targetOrState: Combatant | BattleState | undefined,
  targetId?: string,
): number {
  if (!targetOrState) return 0;
  if (targetId != null && "combatants" in targetOrState)
    return pierceOn(targetOrState.combatants[targetId]);
  return pierceOn(targetOrState as Combatant);
}

export function applyPierce(state: BattleState, targetId: string, stacks: number, sourceId?: string): number {
  const target = state.combatants[targetId];
  const amount = Math.max(0, Math.trunc(stacks));
  if (!target?.alive || amount <= 0) return 0;
  const before = pierceOf(target);
  ops.applyStatus(state, targetId, "pierce", amount, undefined, undefined, sourceId);
  return Math.max(0, pierceOf(target) - before);
}

export function removePierce(state: BattleState, targetId: string, stacks = Infinity): number {
  const target = state.combatants[targetId];
  const current = pierceOf(target);
  const amount = Math.min(current, Math.max(0, Math.trunc(stacks)));
  if (!target || amount <= 0) return 0;
  if (target.alive) ops.applyStatus(state, targetId, "pierce", -amount);
  else {
    const status = getStatus(target, "pierce");
    if (status) status.stacks -= amount;
  }
  cleanup(target);
  return amount;
}

export function mostPiercedFoe(state: BattleState, sourceId: string): string | undefined {
  const source = state.combatants[sourceId];
  if (!source) return undefined;
  return foesOf(state, source).reduce<string | undefined>((bestId, foe) => {
    if (!bestId || pierceOf(foe) > pierceOf(state.combatants[bestId])) return foe.id;
    return bestId;
  }, undefined);
}

export function transferPierce(
  state: BattleState,
  fromId: string,
  toId: string,
  stacks = Infinity,
): number {
  const moved = removePierce(state, fromId, stacks);
  if (moved <= 0) return 0;
  return applyPierce(state, toId, moved, fromId);
}
