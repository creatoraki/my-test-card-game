import type { ItemDef } from "@/items/types";
import type { TechTreeState } from "./types";
import { techLevel } from "./state";

export function techTrainingBonus(levels: TechTreeState["levels"]): number {
  return techLevel(levels, "training-points");
}

export function techScrapSellRate(levels: TechTreeState["levels"]): number {
  return 1 + 0.1 * techLevel(levels, "scrap-price");
}

export function sellPriceOf(def: ItemDef, levels: TechTreeState["levels"]): number {
  const basePrice = def.sellValue ?? 0;
  if (def.category !== "scrap") return basePrice;
  return Math.floor(basePrice * techScrapSellRate(levels));
}
