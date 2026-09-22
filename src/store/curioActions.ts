import { chooseCurioDecision, selectForCurio } from "@/explore/curio/resolve";
import {
  buyFromMerchant,
  canBuyMerchantSlot,
  markMerchantSlotSold,
  merchantSlot,
  openMerchantShelf as openMerchantShelfPure,
  payMerchant,
} from "@/explore/curio/merchant";
import type { OfferingPick } from "@/explore/curio/offering";
import type { ExploreState } from "@/explore/types";
import { applyPendingPollution, settleFallenGear } from "./exploreAftermath";
import { useExploreStore } from "./exploreStore";
import { useTownStore } from "./townStore";

function mutateCurio(fn: (draft: ExploreState) => boolean): ExploreState | null {
  const current = useExploreStore.getState().session;
  if (!current) return null;
  const draft = structuredClone(current);
  if (!fn(draft)) return null;
  useExploreStore.setState({ session: draft });
  applyPendingPollution();
  settleFallenGear();
  return useExploreStore.getState().session;
}

export function chooseCurio(decisionId: string, executorId: string): ExploreState | null {
  return mutateCurio((draft) => chooseCurioDecision(draft, decisionId, executorId));
}

export function selectCurio(decisionId: string, executorId: string, picks: OfferingPick[]): ExploreState | null {
  return mutateCurio((draft) => selectForCurio(draft, decisionId, executorId, picks));
}

export function openMerchantShelf(): ExploreState | null {
  const current = useExploreStore.getState().session;
  if (!current) return null;
  const activeId = current.corridor?.activeObjectId;
  const room = current.dungeon?.rooms[current.dungeon.currentRoomId];
  const object = activeId ? room?.curios.find((curio) => curio.id === activeId) : null;
  if (!object || object.kind !== "merchant") return null;
  const cards = object.shelf
    ? []
    : useTownStore.getState().rollPartyDrawOffers(
        current.party.filter((member) => member.alive).map((member) => member.charId),
      ).slice(0, 2);
  return mutateCurio((draft) => openMerchantShelfPure(draft, cards));
}

export function buyMerchantSlot(index: number): boolean {
  const current = useExploreStore.getState().session;
  if (!current) return false;
  const slot = merchantSlot(current, index);
  if (!slot || !canBuyMerchantSlot(current, index)) return false;

  if (slot.kind === "item") {
    return Boolean(mutateCurio((draft) => buyFromMerchant(draft, index)));
  }

  const draft = structuredClone(current);
  const draftSlot = merchantSlot(draft, index);
  if (!draftSlot || draftSlot.kind !== "card" || !canBuyMerchantSlot(draft, index)) return false;
  const town = useTownStore.getState();
  if (!town.pickPartyDraw(slot.charId, slot.cardDefId)) return false;
  payMerchant(draft, draftSlot.price);
  if (!markMerchantSlotSold(draft, index)) return false;
  useExploreStore.setState({ session: draft });
  return true;
}
