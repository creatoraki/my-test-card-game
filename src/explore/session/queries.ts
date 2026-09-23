// 查询辅助(UI 用) —— 只读, 不改会话。

import { isRoomExplored } from "../dungeon/session";
import { interactionCost } from "../energyCost";
import type { ExploreState } from "../types";

// ⚠ 背包开放时机是**硬约束**(设计文档 §6.3): 演出期与战斗中一律锁死。
//   故必须在这里拦截, 不能只靠 UI 隐藏按钮。
export function canOpenBackpack(s: ExploreState): boolean {
  return (
    s.phase === "landed" ||
    s.phase === "shopping" ||
    s.phase === "resolving" ||
    s.phase === "atNode"
  );
}

// 「再交互一个物件, 能量会掉到哪」—— 供 HUD 的后果预告与跨档预警用。
export function projectedEnergy(s: ExploreState): number {
  return Math.max(0, s.energy - interactionCost(s));
}

/** 已探索完的房间数 / 已到访的房间数 —— 小地图与结算页读它。 */
export function roomProgress(s: ExploreState): { visited: number; explored: number; total: number } {
  const rooms = Object.values(s.dungeon?.rooms ?? {});
  return {
    visited: rooms.filter((room) => room.visited).length,
    explored: rooms.filter((room) => room.visited && isRoomExplored(room)).length,
    total: rooms.length,
  };
}
