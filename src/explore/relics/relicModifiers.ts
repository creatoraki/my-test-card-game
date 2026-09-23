import { getItemDef } from "@/data";
import { RULES } from "@/engine/core/battleRules";
import type { StatModifier } from "@/engine/types";
import { occupiedSlots } from "@/items/inventory";
import { canWalkCorridor } from "../corridor/corridorSession";
import type { ExploreState } from "../types";

export function hasExploreRelic(s: ExploreState, itemId: string): boolean {
  return s.backpack.some((stack) => stack.itemId === itemId && getItemDef(stack.itemId).category === "relic");
}

export function relicBurdenAdapt(s: ExploreState): number {
  return hasExploreRelic(s, "relic-folding-crate") ? 5 : 0;
}

export function merchantExtraSlots(s: ExploreState): number {
  return hasExploreRelic(s, "relic-expiry-labeler") ? 2 : 0;
}

export function relicScrapSellBonus(s: ExploreState): number {
  return hasExploreRelic(s, "relic-recycle-list") ? 0.1 : 0;
}

/** 读取背包现状的开战属性修正(夜光贴纸)。与声明式 relic.mods 一样每名角色各叠一份。 */
export function relicBattleMods(s: ExploreState): StatModifier[] {
  if (!hasExploreRelic(s, "relic-glow-sticker")) return [];
  const free = RULES.burden.backpackSlots - occupiedSlots(s.backpack, getItemDef);
  const dodgeRate = Math.min(8, Math.floor(Math.max(0, free) / 3));
  return dodgeRate > 0 ? [{ flat: { dodgeRate } }] : [];
}

export function canUseBeacon(s: ExploreState): boolean {
  return hasExploreRelic(s, "relic-emergency-beacon") && !s.beaconUsed && canWalkCorridor(s);
}
