// 出牌时与培育相关的额外结算 —— 嫁接的数值加成、盛放(花期)的额外结算。playCard.ts 只调用这里。

import type { BattleState, Card, EffectDescriptor } from "../types";
import { cultivateOverripe, cultivateReady } from "../deck/cultivate";
import { GRAFT_VALUE_BONUS_PCT } from "../deck/graft";

// 盛放: 任意存活我方单位带有该状态即生效。
export function bloomActive(state: BattleState): boolean {
  return state.playerIds.some((id) => {
    const unit = state.combatants[id];
    return unit?.alive && unit.statuses.some((status) => status.id === "bloom" && status.stacks > 0);
  });
}

// 已成熟的嫁接牌: 数值加成(百分点); 盛放下按两次结算。
export function graftBonusPct(state: BattleState, card: Card): number {
  if (!card.grafted || !cultivateReady(card)) return 0;
  return GRAFT_VALUE_BONUS_PCT * (bloomActive(state) ? 2 : 1);
}

// 盛放期间额外结算一次的效果: 成熟牌 → 培育效果; 过熟牌 → 过熟效果。
// ⚠ 必须在 resetCultivate 之前读取, 否则培育阶段已被重置。
export function bloomExtraEffects(state: BattleState, card: Card): EffectDescriptor[] {
  if (!card.cultivate || !bloomActive(state)) return [];
  if (cultivateOverripe(card)) return card.cultivate.overripe?.effects ?? [];
  if (cultivateReady(card)) return card.cultivate.effects;
  return [];
}
