import { GEAR_SLOTS } from "@/items/gearSlots";
import type { ItemStack } from "@/items/types";
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
  const aliveIds = draft.party.filter((member) => member.alive).map((member) => member.charId);
  for (const entry of pending) {
    const charId = "charId" in entry ? entry.charId : highestPollutionId(aliveIds);
    if (!charId) continue;
    if (entry.amount > 0) town.addPollution(charId, entry.amount);
    if (entry.amount < 0) town.reducePollution(charId, -entry.amount);
    const character = useTownStore.getState().characters[charId];
    if (character) {
      const stats = deriveStats(character);
      useExploreStore.getState().syncPartyVitals(charId, stats.maxHp, stats.burdenAdapt);
    }
  }
}

// 当前污染最高的存活队员; 同分取队伍中靠前的一名。
function highestPollutionId(charIds: string[]): string | undefined {
  const { characters } = useTownStore.getState();
  let best: string | undefined;
  for (const id of charIds) {
    const pollution = characters[id]?.pollution ?? 0;
    if (best === undefined || pollution > (characters[best]?.pollution ?? 0)) best = id;
  }
  return best;
}

export function settleFallenGear(): void {
  const ids = useExploreStore.getState().takeUnsettledFallen();
  if (!ids.length) return;
  const town = useTownStore.getState();
  const dropped = ids.flatMap((charId) =>
    GEAR_SLOTS
      .map((slot) => town.takeOffStack(charId, slot))
      .filter((stack): stack is ItemStack => Boolean(stack)),
  );
  const session = useExploreStore.getState().session;
  if (dropped.length && session && session.phase !== "wiped") useExploreStore.getState().addFallenGear(dropped);
}
