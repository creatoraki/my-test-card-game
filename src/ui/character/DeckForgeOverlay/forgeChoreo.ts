import type { Card, Rarity } from "@/engine";
import { prefersReducedMotion } from "@/ui/app/transitions";

const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

export const VEIL_MS = duration(200);
export const FRAME_MS = duration(260);
export const FRAME_STAGGER_MS = duration(90);
export const SETTLE_MS = duration(300);
export const COMMIT_MS = duration(420);
export const RARITY_SWEEP_MS = duration(300);
export const RARE_RIPPLE_MS = duration(440);
export const RARE_BREATH_MS = duration(1800);
export const EXP_FLIGHT_MS = duration(520);

export const SCAN_MS_BY_RARITY: Record<Rarity, number> = {
  common: duration(420),
  uncommon: duration(520),
  rare: duration(620),
};

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
};

export interface RevealPlan {
  card: Card;
  index: number;
  order: number;
  delay: number;
  duration: number;
}

function rarityOf(card: Card): Rarity {
  return card.rarity ?? "common";
}

export function revealOrder(cards: Card[]): RevealPlan[] {
  let elapsed = 0;
  return cards
    .map((card, index) => ({ card, index }))
    .sort((left, right) => {
      const rarityDelta = RARITY_ORDER[rarityOf(left.card)] - RARITY_ORDER[rarityOf(right.card)];
      return rarityDelta || left.index - right.index;
    })
    .map(({ card, index }, order) => {
      const scanDuration = SCAN_MS_BY_RARITY[rarityOf(card)];
      const plan = { card, index, order, delay: elapsed, duration: scanDuration };
      elapsed += scanDuration;
      return plan;
    });
}

export function totalRevealMs(cards: Card[]): number {
  if (!cards.length) return 0;
  const plans = revealOrder(cards);
  const frameSpan = FRAME_MS + Math.max(0, cards.length - 1) * FRAME_STAGGER_MS;
  const scanSpan = Math.max(...plans.map((plan) => plan.delay + plan.duration), 0);
  return VEIL_MS + frameSpan + scanSpan + SETTLE_MS;
}