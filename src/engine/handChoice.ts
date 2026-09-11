import type { BattleState, Card, EffectDescriptor } from "./types";
import { baseEffectsOf } from "./cardEffects";
import { CARD_MARK_DEFS } from "./cardMarks";

function discardPickCount(effects: EffectDescriptor[]): number {
  return effects.reduce(
    (sum, effect) =>
      sum + (effect.discardPick === "handTop" || effect.discardPick === "handBottom"
        ? Math.max(0, Math.floor(effect.amount ?? 0))
        : 0),
    0,
  );
}

export function avidyaPickCount(state: BattleState, card: Card): number {
  if (!state.hand.some((uid) => state.cards[uid]?.id === "avidya")) return 0;
  const markEffects = (card.marks ?? []).flatMap((markId) => CARD_MARK_DEFS[markId]?.effects ?? []);
  const needed = discardPickCount([...baseEffectsOf(card), ...markEffects]);
  const available = state.hand.filter((uid) => uid !== card.uid).length;
  return Math.min(needed, available);
}
