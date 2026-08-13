import type { BattleState, Card } from "./types";

export function cardCost(state: BattleState, card: Card): number {
  const rule = card.costRule;
  const count = rule?.when === "discardedThisRound"
    ? state.discardsThisRound
    : rule?.when === "fastPlaysThisRound"
      ? state.playedThisRound.filter((played) => played.cardType === "fast").length
      : 0;
  const delta = rule && count >= (rule.threshold ?? 1) ? rule.delta : 0;
  return Math.max(0, card.cost + delta);
}