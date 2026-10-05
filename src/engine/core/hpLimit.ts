// 体力极限修复 —— 体力极限与当前生命按同一名义额度恢复: 体力极限已满时, 生命回复照样落地。
// RESTORE_HP_LIMIT 效果与根系网络(枯萎时修复)共用。

import type { BattleState } from "../types";
import { log, ops } from "./ops";

export function restoreHpLimit(state: BattleState, targetId: string, amount: number): void {
  const target = state.combatants[targetId];
  const restoreAmount = Math.round(amount);
  if (!target || !target.alive || restoreAmount <= 0) return;
  target.hpLimit = Math.min(target.maxHp, target.hpLimit + restoreAmount);
  ops.heal(state, undefined, targetId, restoreAmount);
  log(state, `${target.emoji} ${target.name} 体力极限恢复 ${restoreAmount}`);
}
