// DOT 到期事件 —— 敌人的灼烧 / 中毒某一段**自然到期**时分发给我方单位身上的 onFoeDotExpired 钩子(衔尾蛇)。
// 被焚尽、催化引爆、热能回收等效果移除的分段不经过节拍衰减, 不会派发。
// 与 poisonEvents.ts 同写法: 走 hookRegistry, 不直接 import 状态表。

import type { BattleState, StatusSegment } from "../types";
import { STATUS_DEFS } from "../core/hookRegistry";
import { ctxFor } from "../core/ops";

const DOT_IDS = new Set(["burn", "poison"]);

export function notifyDotExpired(
  state: BattleState,
  victimId: string,
  statusId: string,
  expired: StatusSegment[],
): void {
  if (!DOT_IDS.has(statusId) || expired.length === 0) return;
  if (state.combatants[victimId]?.team !== "enemy") return;
  for (const id of state.playerIds) {
    const holder = state.combatants[id];
    if (!holder?.alive) continue;
    for (const inst of [...holder.statuses]) {
      const hook = STATUS_DEFS[inst.id]?.hooks?.onFoeDotExpired;
      if (!hook) continue;
      for (const segment of expired) hook(ctxFor(state, id, inst), victimId, statusId, segment.stacks);
    }
  }
}
