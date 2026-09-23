import type { EquipSlot, ItemStack } from "@/items/types";
import { useExploreStore } from "./exploreStore";
import { deriveStats, useTownStore, type ContaminationHit } from "../town/townStore";
import { takePendingPollution } from "@/explore/session";

export function applyPendingContamination(charIds: string[]): ContaminationHit[] {
  const request = useExploreStore.getState().consumePendingContamination();
  const town = useTownStore.getState();
  const hits: ContaminationHit[] = [];
  if (request.total > 0) hits.push(...town.contaminateCards(charIds, request.total));
  if (request.each > 0) hits.push(...town.contaminateCards(charIds, request.each, true));
  return hits;
}

export function applyPendingPollution(): void {
  const current = useExploreStore.getState().session;
  if (!current?.pendingPollution.length) return;
  const draft = structuredClone(current);
  const pending = takePendingPollution(draft);
  useExploreStore.setState({ session: draft });
  const town = useTownStore.getState();
  for (const entry of pending) {
    if (entry.amount > 0) town.addPollution(entry.charId, entry.amount);
    if (entry.amount < 0) town.reducePollution(entry.charId, -entry.amount);
    const character = town.characters[entry.charId];
    if (character) {
      const stats = deriveStats(character);
      useExploreStore.getState().syncPartyVitals(entry.charId, stats.maxHp, stats.burdenAdapt);
    }
  }
}

export function settleFallenGear(): void {
  const ids = useExploreStore.getState().takeUnsettledFallen();
  if (!ids.length) return;
  const town = useTownStore.getState();
  const dropped = ids.flatMap((charId) =>
    (["weapon", "armor", "trinket"] as EquipSlot[])
      .map((slot) => town.takeOffStack(charId, slot))
      .filter((stack): stack is ItemStack => Boolean(stack)),
  );
  const session = useExploreStore.getState().session;
  if (dropped.length && session && session.phase !== "wiped") useExploreStore.getState().addFallenGear(dropped);
}
