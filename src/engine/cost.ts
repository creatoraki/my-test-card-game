import type { BattleState, Card } from "./types";

export function cardCost(state: BattleState, card: Card): number {
  const rule = card.costRule;
  const count = rule?.when === "discardedThisRound"
    ? state.discardsThisRound
    : rule?.when === "fastPlaysThisRound"
      ? state.playedThisRound.filter((played) => played.cardType === "fast").length
      : 0;
  const delta = rule && count >= (rule.threshold ?? 1) ? rule.delta : 0;
  const heavy = card.marks?.includes("heavy") ? 1 : 0;
  return Math.max(0, card.cost + delta + heavy);
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