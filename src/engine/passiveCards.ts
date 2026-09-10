import type { BattleState, Card } from "./types";

// 被动卡的基础判定与手牌筛选。保持为无副作用模块，避免与效果解释器形成循环依赖。
export function isPassive(card: Pick<Card, "cardType"> | undefined): boolean {
  return card?.cardType === "passive";
}

// 手牌中“能被打出”的那部分 —— 被动卡不参与费用与出牌口径的计算。
export function playableHandUids(state: BattleState): string[] {
  return state.hand.filter((uid) => !isPassive(state.cards[uid]));
}
