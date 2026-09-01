import type { BattleState, Card } from "./types";

export function cardCost(state: BattleState | null, card: Card): number {
  const rule = card.costRule;
  const count = !state
    ? 0
    : rule?.when === "discardedThisRound"
      ? state.discardsThisRound
      : rule?.when === "fastPlaysThisRound"
        ? state.playedThisRound.filter((played) => played.cardType === "fast").length
        : 0;
  // per = 线性叠加(每 1 点计数都减一次, 迦具土); 缺省 = 达到阈值只叠加一次。
  const threshold = rule?.threshold ?? 1;
  const delta = !rule || count < threshold ? 0 : rule.per ? rule.delta * count : rule.delta;
  // 卡牌实例的累计层数(岚被丢弃回手的次数)达到门槛后的费用修正。
  const stackRule = card.stackCostRule;
  const stackDelta = stackRule && (card.discardStacks ?? 0) >= stackRule.atLeast ? stackRule.delta : 0;
  const heavy = card.marks?.includes("heavy") ? 1 : 0;
  return Math.max(0, card.cost + delta + stackDelta + heavy);
}

export function starPayable(card: Card): boolean {
  return card.starPay === true || card.marks?.includes("starPact") === true;
}

export function starlightStacksOf(state: BattleState, card: Card): number {
  return state.combatants[card.ownerCharId]?.statuses.find((status) => status.id === "starlight")?.stacks ?? 0;
}

export function starlightPayment(state: BattleState, card: Card): number {
  return starPayable(card) ? Math.min(starlightStacksOf(state, card), cardCost(state, card)) : 0;
}

export function manaCostOf(state: BattleState, card: Card): number {
  return cardCost(state, card) - starlightPayment(state, card);
}
