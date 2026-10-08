// 瞄准: 「告知目标」类技能的统一查询口径。
// 任意状态在定义里标 aims, 并把锁定对象写进实例的 targetId, 该对象即处于「被瞄准」——
// UI 只读这里, 不认具体状态 id; 新增瞄准类技能只需照做, 立绘框特效自动生效。

import type { BattleState } from "../types";
import { getStatusDef } from "../statuses";

export interface AimLock {
  sourceId: string; // 发起瞄准的单位
  statusId: string; // 承载瞄准的状态
}

/** 全场瞄准关系: 被瞄准单位 id → 指向它的瞄准列表。双方都只统计存活单位。 */
export function aimLocksByTarget(state: BattleState): Record<string, AimLock[]> {
  const result: Record<string, AimLock[]> = {};
  for (const source of Object.values(state.combatants)) {
    if (!source.alive) continue;
    for (const status of source.statuses) {
      if (!status.targetId || !getStatusDef(status.id)?.aims) continue;
      if (!state.combatants[status.targetId]?.alive) continue;
      (result[status.targetId] ??= []).push({ sourceId: source.id, statusId: status.id });
    }
  }
  return result;
}
