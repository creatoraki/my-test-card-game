import type { BattleState, Card } from "./types";

export function cardCost(state: BattleState, card: Card): number {
  const delta = card.costRule?.when === "discardedThisRound" && state.discardsThisRound > 0
    ? card.costRule.delta
    : 0;
  return Math.max(0, card.cost + delta);
}