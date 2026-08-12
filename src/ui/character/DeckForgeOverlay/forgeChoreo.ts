import type { Card, Rarity } from "@/engine";
import { prefersReducedMotion } from "@/ui/app/transitions";

const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

export const CHARGE_MS = 700;
export const SPEND_MS = duration(360);
export const VEIL_MS = duration(200);
export const BACK_MS = duration(300);
export const BACK_STAGGER_MS = duration(110);
export const IMPACT_MS = duration(280);
export const SHAKE_MS = duration(240);
export const SETTLE_MS = duration(300);
export const COMMIT_MS = duration(420);
export const RARE_BREATH_MS = duration(1800);
export const EXP_FLIGHT_MS = duration(520);

export const FLIP_MS_BY_RARITY: Record<Rarity, number> = {
  common: duration(460),
  uncommon: duration(560),
  rare: duration(700),
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

export function rarityOf(card: Card): Rarity {
  return card.rarity === "basic" ? "common" : card.rarity ?? "common";
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
      const flipDuration = FLIP_MS_BY_RARITY[rarityOf(card)];
      const plan = { card, index, order, delay: elapsed, duration: flipDuration };
      elapsed += flipDuration;
      return plan;
    });
}

export function totalRevealMs(cards: Card[]): number {
  if (!cards.length) return 0;
  const plans = revealOrder(cards);
  const backSpan = BACK_MS + Math.max(0, cards.length - 1) * BACK_STAGGER_MS;
  const flipSpan = Math.max(...plans.map((plan) => plan.delay + plan.duration), 0);
  return VEIL_MS + backSpan + flipSpan + IMPACT_MS + SETTLE_MS;
}