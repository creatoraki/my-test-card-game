import { NEAR_EXPIRY_FOOD_IDS } from "@/data/items/consumables";
import type { ItemCategory } from "@/items/types";

export const MERCHANT_FOOD_POOL = NEAR_EXPIRY_FOOD_IDS;

export const MERCHANT_PRICE_TIER: Readonly<Record<"card" | ItemCategory, number>> = {
  card: 2,
  scrap: 1,
  material: 1,
  module: 1,
  consumable: 1,
  equipment: 2,
  relic: 3,
};

export function merchantPriceCount(kind: "card" | ItemCategory): number {
  return MERCHANT_PRICE_TIER[kind];
}
