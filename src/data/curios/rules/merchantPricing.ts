import { NEAR_EXPIRY_FOOD_IDS } from "../../items/catalog/consumables";
import type { ItemCategory } from "@/items/types";

export const MERCHANT_FOOD_POOL = NEAR_EXPIRY_FOOD_IDS;

export const MERCHANT_PRICE_TIER: Readonly<Record<"card" | ItemCategory, number>> = {
  card: 1,
  scrap: 1,
  material: 2,
  module: 3,
  consumable: 1,
  equipment: 3,
  relic: 5,
};

export function merchantPriceCount(kind: "card" | ItemCategory): number {
  return MERCHANT_PRICE_TIER[kind];
}
