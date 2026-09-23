import type { BattleState, DamageCtx, StatusCtx, StatusHooks } from "../types";
import { STATUS_DEFS } from "../hookRegistry";
import { cleanup, ctxFor } from "../ops";
import { alliesOf } from "../targeting";

type StatusHookName = keyof StatusHooks;
type StatusHookArgs<K extends StatusHookName> =
  NonNullable<StatusHooks[K]> extends (c: StatusCtx, ...rest: infer R) => unknown ? R : never;

// 依次触发某单位身上所有状态的同名钩子。遍历快照, 钩子里增删状态不影响本轮。
export function runStatusHooks<K extends StatusHookName>(
  state: BattleState,
  ownerId: string,
  hook: K,
  ...args: StatusHookArgs<K>
): void {
  const owner = state.combatants[ownerId];
  if (!owner) return;
  for (const inst of [...owner.statuses]) {
    const callback = STATUS_DEFS[inst.id]?.hooks?.[hook] as
      | ((c: StatusCtx, ...rest: StatusHookArgs<K>) => void)
      | undefined;
    callback?.(ctxFor(state, ownerId, inst), ...args);
  }
}

// 单体攻击在目标的防御/格挡完成后、目标护盾吸收前，给目标的其他存活友方一次护卫机会。
export function runGuardHooks(state: BattleState, dmg: DamageCtx): void {
  const target = state.combatants[dmg.targetId];
  if (!target) return;
  for (const ally of alliesOf(state, target)) {
    if (ally.id === target.id) continue;
    runStatusHooks(state, ally.id, "onGuardAlly", dmg);
    cleanup(ally);
  }
}
