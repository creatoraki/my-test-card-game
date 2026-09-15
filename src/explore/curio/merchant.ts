import { getItemDef, makeRolledItemStack } from "@/data";
import { rngPick } from "@/engine/rng";
import { addToContainer, consumeItems, countByItemId, stackSlots } from "@/items/inventory";
import { RULES } from "@/engine/rules";
import { rollEquipCrate } from "../boons";
import { backpackFree, dropContext, randomRelicId } from "../session";
import { fireExploreRelic } from "../relics";
import type { CardOfferCandidate, ExploreState } from "../types";
import { MERCHANT_PRICES, merchantPrice } from "@/data/curios/merchantPricing";
import type { MerchantPayment, MerchantShelf, MerchantSlot } from "@/data/curios/types";

function activeMerchant(s: ExploreState): { shelf: MerchantShelf; objectId: string } | null {
  const objectId = s.corridor?.activeObjectId;
  const room = s.dungeon?.rooms[s.dungeon.currentRoomId];
  if (!objectId || !room) return null;
  const object = room.curios.find((curio) => curio.id === objectId && curio.kind === "merchant");
  if (!object?.shelf) return null;
  return { shelf: object.shelf, objectId };
}

function itemSlot(s: ExploreState, itemId: string, priceIndex: number): MerchantSlot {
  return { kind: "item", stack: makeRolledItemStack(s, itemId, 1), price: merchantPrice(priceIndex), sold: false };
}

export function createMerchantShelf(s: ExploreState, cards: CardOfferCandidate[]): MerchantShelf {
  const slots: MerchantSlot[] = cards.slice(0, 2).map((card, index) => ({
    kind: "card",
    charId: card.charId,
    cardDefId: card.cardDefId,
    price: merchantPrice(index),
    sold: false,
  }));
  const equipment = rollEquipCrate(s, dropContext(s));
  if (equipment) slots.push({ kind: "item", stack: equipment, price: merchantPrice(2), sold: false });
  slots.push(itemSlot(s, "attack-module-t1", 3));
  const relicId = randomRelicId(s);
  if (relicId) slots.push({ kind: "item", stack: makeRolledItemStack(s, relicId, 1), price: merchantPrice(4), sold: false });
  slots.push(itemSlot(s, rngPick(s, ["medical-kit-c", "sugar-cube-c", "holy-water-c"]), 5));
  // 装备池或遗物池为空时用消耗品补位，货架仍然保持六格。
  while (slots.length < 6) slots.push(itemSlot(s, "medical-kit-c", slots.length));
  return { slots: slots.slice(0, 6), opened: true };
}

export function openMerchantShelf(s: ExploreState, cards: CardOfferCandidate[]): boolean {
  const room = s.dungeon?.rooms[s.dungeon.currentRoomId];
  const objectId = s.corridor?.activeObjectId;
  if (!room || !objectId || s.phase !== "landed" && s.phase !== "shopping") return false;
  const object = room.curios.find((curio) => curio.id === objectId && curio.kind === "merchant");
  if (!object) return false;
  if (!object.shelf) object.shelf = createMerchantShelf(s, cards);
  s.phase = "shopping";
  return true;
}

export function merchantShelf(s: ExploreState): MerchantShelf | null {
  return activeMerchant(s)?.shelf ?? null;
}

export function merchantSlot(s: ExploreState, index: number): MerchantSlot | null {
  return merchantShelf(s)?.slots[index] ?? null;
}

export function merchantQuote(s: ExploreState, index: number): {
  slot: MerchantSlot | null;
  price: MerchantPayment | null;
  affordable: boolean;
} {
  const slot = merchantSlot(s, index);
  const price = slot?.price ?? null;
  return { slot, price, affordable: Boolean(slot && !slot.sold && price && countByItemId(s.backpack, price.itemId) >= price.count) };
}

export function canBuyMerchantSlot(s: ExploreState, index: number): boolean {
  const slot = merchantSlot(s, index);
  if (!slot || slot.sold || s.phase !== "shopping") return false;
  if (countByItemId(s.backpack, slot.price.itemId) < slot.price.count) return false;
  if (slot.kind === "item" && stackSlots(slot.stack, getItemDef(slot.stack.itemId)) > backpackFree(s)) return false;
  return true;
}

export function payMerchant(s: ExploreState, price: MerchantPayment): void {
  s.backpack = consumeItems(s.backpack, price.itemId, price.count);
}

export function markMerchantSlotSold(s: ExploreState, index: number): boolean {
  const active = activeMerchant(s);
  const slot = active?.shelf.slots[index];
  if (!slot || slot.sold) return false;
  active.shelf.slots[index] = { ...slot, sold: true };
  return true;
}

/** 购买物品类商品；卡牌商品由状态层先确认卡组可接纳后再标记售出。 */
export function buyFromMerchant(s: ExploreState, index: number): boolean {
  const slot = merchantSlot(s, index);
  if (!slot || slot.kind !== "item" || !canBuyMerchantSlot(s, index)) return false;
  const result = addToContainer(s.backpack, [slot.stack], (itemId) => getItemDef(itemId), RULES.burden.backpackSlots);
  if (result.overflow.length) return false;
  payMerchant(s, slot.price);
  s.backpack = result.next;
  s.stats.pickups += result.taken.length;
  if (getItemDef(slot.stack.itemId).category === "relic" && !s.ownedRelicIds.includes(slot.stack.itemId)) {
    s.ownedRelicIds.push(slot.stack.itemId);
    fireExploreRelic(s, { type: "itemPicked" });
  }
  markMerchantSlotSold(s, index);
  return true;
}

export function merchantPriceCount(): number {
  return MERCHANT_PRICES.length;
}
