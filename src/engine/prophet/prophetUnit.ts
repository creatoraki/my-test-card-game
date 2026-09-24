// ============================================================================
// 预言家单位辅助 —— 星印来源、星契归属、星辉上限都要找到"小队中的预言家"。
// 本文件只读 state, 不 import 任何运行时模块, 状态定义与原语都可以放心引用。
// ============================================================================

import type { BattleState } from "../types";
import { RULES } from "../core/battleRules";

export const PROPHET_CHAR_ID = "prophet";
export const MILKY_WAY_MAX_BONUS = 2;

// 小队中存活的预言家单位 id; 不在队或已阵亡时为 undefined。
export function prophetIdOf(state: BattleState): string | undefined {
  return state.playerIds.find((id) => {
    const unit = state.combatants[id];
    return unit?.alive && unit.team === "player" && unit.charId === PROPHET_CHAR_ID;
  });
}

// 星辉上限: 基础 3, 带【银河】时 +2。
export function starlightMaxOf(state: BattleState, ownerId: string): number {
  const owner = state.combatants[ownerId];
  const milkyWay = owner?.statuses.some((status) => status.id === "milkyWay" && status.stacks > 0) ?? false;
  return RULES.combat.starlightMax + (milkyWay ? MILKY_WAY_MAX_BONUS : 0);
}
