import { getItemDef, makeRolledItemStack } from "@/data";
import { rngPick, shuffle } from "@/engine/rng";
import { addToContainer, consumeItems, countByItemId, stackSlots } from "@/items/inventory";
import { RULES } from "@/engine/rules";
import { rollEquipCrate } from "../boons";
import { backpackFree, dropContext, randomRelicId } from "../session";
import { fireExploreRelic } from "../relics";
import { merchantExtraSlots } from "../relicModifiers";
import type { CardOfferCandidate, ExploreState } from "../types";
import { MERCHANT_FOOD_POOL, merchantPriceCount } from "@/data/curios/merchantPricing";
import type { MerchantPayment, MerchantShelf, MerchantSlot } from "@/data/curios/types";

function activeMerchant(s: ExploreState): { shelf: MerchantShelf; objectId: string } | null {
  const objectId = s.corridor?.activeObjectId;
  const room = s.dungeon?.rooms[s.dungeon.currentRoomId];
  if (!objectId || !room) return null;
  const object = room.curios.find((curio) => curio.id === objectId && curio.kind === "merchant");
  if (!object?.shelf) return null;
  return { shelf: object.shelf, objectId };
}

function itemSlot(s: ExploreState, itemId: string, foods: [string, string]): MerchantSlot {
  const stack = makeRolledItemStack(s, itemId, 1);
  return {
    kind: "item",
    stack,
    price: { itemId: rngPick(s, foods), count: merchantPriceCount(getItemDef(itemId).category) },
    sold: false,
  };
}

export function createMerchantShelf(s: ExploreState, cards: CardOfferCandidate[]): MerchantShelf {
  const foods = shuffle(s, [...MERCHANT_FOOD_POOL]).slice(0, 2) as [string, string];
  const slots: MerchantSlot[] = cards.slice(0, 2).map((card) => ({
    kind: "card",
    charId: card.charId,
    cardDefId: card.cardDefId,
    price: { itemId: rngPick(s, foods), count: merchantPriceCount("card") },
    sold: false,
  }));
  const equipment = rollEquipCrate(s, dropContext(s));
  if (equipment) {
    slots.push({
      kind: "item",
      stack: equipment,
      price: { itemId: rngPick(s, foods), count: merchantPriceCount("equipment") },
      sold: false,
    });
  }
  slots.push(itemSlot(s, "attack-module-t1", foods));
  const relicId = randomRelicId(s);
  if (relicId) {
    const stack = makeRolledItemStack(s, relicId, 1);
    slots.push({
      kind: "item",
      stack,
      price: { itemId: rngPick(s, foods), count: merchantPriceCount("relic") },
      sold: false,
    });
  }
  slots.push(itemSlot(s, rngPick(s, ["medical-kit-c", "sugar-cube-c", "holy-water-c"]), foods));
  const size = 6 + merchantExtraSlots(s);
  while (slots.length < size) slots.push(itemSlot(s, "medical-kit-c", foods));
  return { slots: slots.slice(0, size), foods, opened: true };
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

export function merchantBuyReason(s: ExploreState, index: number): string | null {
  if (s.phase !== "shopping") return "当前无法交换";
  const slot = merchantSlot(s, index);
  if (!slot) return "当前无法交换";
  if (slot.sold) return "已售出";
  if (countByItemId(s.backpack, slot.price.itemId) < slot.price.count) {
    return `缺少${getItemDef(slot.price.itemId).name}`;
  }
  if (slot.kind === "item" && stackSlots(slot.stack, getItemDef(slot.stack.itemId)) > backpackFree(s)) {
    return "背包空间不足";
  }
  return null;
}

export function canBuyMerchantSlot(s: ExploreState, index: number): boolean {
  return merchantBuyReason(s, index) === null;
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
