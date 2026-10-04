import type { BattleState, Combatant, StatusInstance } from "../types";
import { ops } from "../core/ops";

// 保险的层数查询与受击增值。理赔(保险转为治疗)的统一入口在 engine/actuary/claims。

export function insuranceStacksOf(cmb: Combatant): number {
  return cmb.statuses.find((status) => status.id === "insurance")?.stacks ?? 0;
}

export function partyInsuranceStacks(state: BattleState): number {
  return state.playerIds.reduce((sum, id) => {
    const ally = state.combatants[id];
    return sum + (ally?.alive ? insuranceStacksOf(ally) : 0);
  }, 0);
}

// 受击增值: 层数变为 floor(层数 × 倍率)。默认 ×1.2; 攻击者带有高风险时 ×1.5(不叠乘)。
export function growInsurance(
  state: BattleState,
  ownerId: string,
  inst: StatusInstance,
  multiplier = 1.2,
): void {
  const target = state.combatants[ownerId];
  if (!target || inst.stacks <= 0) return;
  const previous = inst.stacks;
  inst.stacks = Math.floor(inst.stacks * multiplier);
  if (inst.stacks > previous)
    ops.log(state, `${target.emoji} ${target.name} 的保险增至 ${inst.stacks}`);
}
