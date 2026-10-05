// 出牌时与培育相关的额外结算 —— 嫁接的属性加成、盛放(花期)的额外结算。playCard.ts 只调用这里。

import type { BattleState, Card, EffectDescriptor, StatBlock } from "../types";
import { cultivateReady } from "../deck/cultivate";
import { GRAFT_STAT_BONUS_PCT } from "../deck/graft";
import { addMod } from "../combat/stats";

// 嫁接加成作用的属性: 伤害与中毒层数由攻击力换算, 治疗与护盾由治愈力换算。
const GRAFT_STATS: (keyof StatBlock)[] = ["attack", "healPower"];

// 盛放: 任意存活我方单位带有该状态即生效。
export function bloomActive(state: BattleState): boolean {
  return state.playerIds.some((id) => {
    const unit = state.combatants[id];
    return unit?.alive && unit.statuses.some((status) => status.id === "bloom" && status.stacks > 0);
  });
}

// 已成熟的嫁接牌: 攻击力 / 治愈力加成(百分点); 盛放下按两次结算。
export function graftStatBonusPct(state: BattleState, card: Card): number {
  if (!card.grafted || !cultivateReady(card)) return 0;
  return GRAFT_STAT_BONUS_PCT * (bloomActive(state) ? 2 : 1);
}

// 把嫁接加成写进所属角色的出牌期临时面板(state.playStatMods), 由 playCard 在出牌结束时统一撤回。
// ⚠ 必须在 resetCultivate 之前调用, 否则嫁接已被剥离。
export function applyGraftStatBonus(state: BattleState, card: Card): void {
  const pct = graftStatBonusPct(state, card);
  const owner = state.combatants[card.ownerCharId];
  if (pct <= 0 || !owner) return;
  for (const stat of GRAFT_STATS) {
    addMod(owner, stat, pct, true);
    state.playStatMods.push({ targetId: owner.id, stat, amount: pct, pct: true });
  }
}

// 盛放期间额外结算一次的效果: 成熟牌 → 成熟效果。
// ⚠ 必须在 resetCultivate 之前读取, 否则培育阶段已被重置。
export function bloomExtraEffects(state: BattleState, card: Card): EffectDescriptor[] {
  if (!card.cultivate || !bloomActive(state)) return [];
  return cultivateReady(card) ? card.cultivate.effects : [];
}
