import { getItemDef } from "../data";
import { canWalkCorridor } from "./corridor/session";
import type { ExploreState } from "./types";

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

export function canUseBeacon(s: ExploreState): boolean {
  return hasExploreRelic(s, "relic-emergency-beacon") && !s.beaconUsed && canWalkCorridor(s);
}
