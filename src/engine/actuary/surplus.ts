// ============================================================================
// 盈余 —— 精算师自身的资源状态。只来自理赔溢额与《佣金》, 上限 = 治愈力 100% 换算的点数。
// 出口(分红 / 再保险 / 清算)走通用的 CONSUME_STATUS + lastConsumedStatusStacks, 这里只管入账。
// ============================================================================

import type { BattleState } from "../types";
import { ops } from "../core/ops";
import { healValue, statOf } from "../combat/stats";
import { actuaryOf, solvencyActive } from "./actuaryRules";

export const SURPLUS_STATUS = "surplus";
// 溢额入账比例(偿付能力生效时为 100%)。
export const OVERFLOW_TO_SURPLUS = 0.5;

// 盈余上限: 持有者治愈力 100% 换算的点数; 偿付能力生效时翻倍。
export function surplusCap(state: BattleState, ownerId: string): number {
  const owner = state.combatants[ownerId];
  if (!owner) return 0;
  return Math.round(healValue(statOf(owner, "healPower")) * (solvencyActive(state) ? 2 : 1));
}

export function overflowToSurplusRate(state: BattleState): number {
  return solvencyActive(state) ? 1 : OVERFLOW_TO_SURPLUS;
}

// 盈余入账(向下取整)。精算师不在场或已阵亡时作废; 超出上限的部分由状态上限截掉。
export function gainSurplus(state: BattleState, amount: number): void {
  const actuary = actuaryOf(state);
  const gained = Math.floor(amount);
  if (!actuary || gained <= 0) return;
  ops.applyStatus(state, actuary.id, SURPLUS_STATUS, gained);
}
