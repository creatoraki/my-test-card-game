import type { Card, EffectDescriptor } from "../types";
import { cultivateOverripe, cultivateReady } from "../deck/cultivate";

export function baseEffectsOf(card: Card): EffectDescriptor[] {
  if (cultivateOverripe(card)) return card.cultivate?.overripe?.effects ?? [];
  const cultivated = cultivateReady(card) && card.cultivate?.mode === "replace";
  return cultivated ? card.cultivate?.effects ?? [] : card.effects;
}

export function activeEffectsOf(card: Card): EffectDescriptor[] {
  return [
    ...baseEffectsOf(card),
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ];
}
