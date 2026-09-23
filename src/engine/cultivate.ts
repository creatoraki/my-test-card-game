import type { BattleState, Card, CultivateStage, Targeting } from "./types";
import { STATUS_DEFS } from "./hookRegistry";
import { ctxFor } from "./ops";

export function cultivateStage(card: Card): CultivateStage | null {
  if (!card.cultivate) return null;
  const left = card.cultivateLeft ?? card.cultivate.turns;
  if (left < 0) return "overripe";
  return left === 0 ? "mature" : "growing";
}

export function resetCultivate(card: Card): void {
  if (card.cultivate) card.cultivateLeft = card.cultivate.turns;
}

function notifyCultivateStage(state: BattleState, card: Card, stage: CultivateStage): void {
  for (const id of state.playerIds) {
    const owner = state.combatants[id];
    if (!owner?.alive) continue;
    for (const inst of [...owner.statuses])
      STATUS_DEFS[inst.id]?.hooks?.onCultivateStage?.(ctxFor(state, id, inst), card, stage);
  }
}

export function advanceCultivate(state: BattleState, card: Card, delta: number): void {
  if (!card.cultivate || delta <= 0) return;
  const amount = Math.floor(delta);
  for (let i = 0; i < amount; i++) {
    const before = cultivateStage(card);
    const left = card.cultivateLeft ?? card.cultivate.turns;
    if (left <= -1) break;
    card.cultivateLeft = left - 1;
    const after = cultivateStage(card);
    if (after && after !== before) notifyCultivateStage(state, card, after);
  }
}

export function cultivateReady(card: Card): boolean {
  return cultivateStage(card) === "mature";
}

export function cultivateOverripe(card: Card): boolean {
  return cultivateStage(card) === "overripe";
}

export function cultivateCanAdvance(card: Card): boolean {
  const stage = cultivateStage(card);
  return stage === "growing" || stage === "mature";
}

export function effectiveTargeting(card: Card): Targeting {
  if (cultivateOverripe(card))
    return card.cultivate?.overripe.targeting ?? card.cultivateTargeting ?? card.targeting;
  return cultivateReady(card) ? card.cultivateTargeting ?? card.targeting : card.targeting;
}

export function tickCultivate(state: BattleState): void {
  for (const uid of state.hand) {
    const card = state.cards[uid];
    if (card?.cultivate) advanceCultivate(state, card, 1);
  }
}
