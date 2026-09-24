// 中毒结算事件 —— 中毒每扣一次血(含毒发)就分发给我方单位身上的 onFoePoisonTick 钩子(菌丝网络)。
// 与 deck/cultivate.ts 的 notifyCultivateStage 同写法: 走 hookRegistry, 不直接 import 状态表。

import type { BattleState } from "../types";
import { STATUS_DEFS } from "../core/hookRegistry";
import { ctxFor } from "../core/ops";

export function notifyPoisonTick(state: BattleState, victimId: string): void {
  for (const id of state.playerIds) {
    const holder = state.combatants[id];
    if (!holder?.alive) continue;
    for (const inst of [...holder.statuses])
      STATUS_DEFS[inst.id]?.hooks?.onFoePoisonTick?.(ctxFor(state, id, inst), victimId);
  }
}
