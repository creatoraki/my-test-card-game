import type { Card, EffectDescriptor } from "./types";
import { cultivateReady } from "./cultivate";

export function baseEffectsOf(card: Card): EffectDescriptor[] {
  const cultivated = cultivateReady(card) && card.cultivate?.mode === "replace";
  return cultivated ? card.cultivate?.effects ?? [] : card.effects;
}

export function activeEffectsOf(card: Card): EffectDescriptor[] {
  return [
    ...baseEffectsOf(card),
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ];
}
