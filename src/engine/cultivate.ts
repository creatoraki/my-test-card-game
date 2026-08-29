import type { BattleState, Card } from "./types";

export function resetCultivate(card: Card): void {
  if (card.cultivate) card.cultivateLeft = card.cultivate.turns;
}

export function advanceCultivate(card: Card, delta: number): void {
  if (!card.cultivate || delta <= 0) return;
  card.cultivateLeft = Math.max(0, (card.cultivateLeft ?? card.cultivate.turns) - delta);
}

export function tickCultivate(state: BattleState): void {
  for (const uid of state.hand) {
    const card = state.cards[uid];
    if (!card?.cultivate) continue;
    advanceCultivate(card, 1);
  }
}

export function cultivateReady(card: Card): boolean {
  return card.cultivate != null && (card.cultivateLeft ?? card.cultivate.turns) === 0;
}