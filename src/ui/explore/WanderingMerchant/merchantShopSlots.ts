import { getCardDef } from "@/data";
import type { MerchantPayment, MerchantSlot } from "@/data/curios/types";
import type { ShopSlot } from "@/data/shop/shop";

export interface MerchantShopSlots {
  slots: ShopSlot[];
  indexByKey: Record<string, number>;
  paymentByKey: Record<string, MerchantPayment>;
}

export function merchantShopSlots(merchantSlots: MerchantSlot[]): MerchantShopSlots {
  const indexByKey: Record<string, number> = {};
  const paymentByKey: Record<string, MerchantPayment> = {};
  const slots = merchantSlots.map((slot, index): ShopSlot => {
    const key = `merchant-${index}`;
    indexByKey[key] = index;
    paymentByKey[key] = slot.price;

    if (slot.kind === "card") {
      const cardRarity = getCardDef(slot.cardDefId).rarity;
      return {
        kind: "card",
        key,
        charId: slot.charId,
        cardDefId: slot.cardDefId,
        rarity: cardRarity === "basic" || !cardRarity ? "common" : cardRarity,
        price: slot.price.count,
        sold: slot.sold,
      };
    }

    return {
      kind: "item",
      key,
      itemId: slot.stack.itemId,
      affinity: slot.stack.affinity,
      roll: slot.stack.roll,
      price: slot.price.count,
      sold: slot.sold,
    };
  });

  return { slots, indexByKey, paymentByKey };
}

export function merchantIndexFromKey(key: string): number | null {
  const match = /^merchant-(\d+)$/.exec(key);
  return match ? Number(match[1]) : null;
}
