import type { BattleState, Combatant, StatusInstance } from "./types";
import { ops } from "./ops";

export function insuranceStacksOf(cmb: Combatant): number {
  return cmb.statuses.find((status) => status.id === "insurance")?.stacks ?? 0;
}

export function partyInsuranceStacks(state: BattleState): number {
  return state.playerIds.reduce((sum, id) => {
    const ally = state.combatants[id];
    return sum + (ally?.alive ? insuranceStacksOf(ally) : 0);
  }, 0);
}

export function settleInsurance(
  state: BattleState,
  sourceId: string | undefined,
  targetIds: string[],
  multiplier: number,
): void {
  for (const targetId of targetIds) {
    const target = state.combatants[targetId];
    const insurance = target?.statuses.find((status) => status.id === "insurance");
    if (!target || !insurance || insurance.stacks <= 0) continue;

    const amount = insurance.stacks * multiplier;
    ops.heal(state, sourceId, targetId, amount, { scaled: true });
    target.statuses = target.statuses.filter((status) => status !== insurance);
    ops.log(state, `${target.emoji} ${target.name} 的保险已兑现`);
  }
}

export function growInsurance(state: BattleState, ownerId: string, inst: StatusInstance): void {
  const target = state.combatants[ownerId];
  if (!target || inst.stacks <= 0) return;
  const previous = inst.stacks;
  inst.stacks = Math.floor(inst.stacks * 1.2);
  if (inst.stacks > previous)
    ops.log(state, `${target.emoji} ${target.name} 的保险增至 ${inst.stacks}`);
}
