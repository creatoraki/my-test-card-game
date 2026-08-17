import type { BattleState, Card } from "./types";

export function resetCultivate(card: Card): void {
  if (card.cultivate) card.cultivateLeft = card.cultivate.turns;
}

export function tickCultivate(state: BattleState): void {
  for (const uid of state.hand) {
    const card = state.cards[uid];
    if (!card?.cultivate) continue;
    card.cultivateLeft = Math.max(0, (card.cultivateLeft ?? card.cultivate.turns) - 1);
  }
}

export function cultivateReady(card: Card): boolean {
  return card.cultivate != null && (card.cultivateLeft ?? card.cultivate.turns) === 0;
}