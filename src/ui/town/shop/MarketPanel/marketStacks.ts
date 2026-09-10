import type { ShopItemSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";

export const asStack = (slot: ShopItemSlot): ItemStack => ({
  uid: slot.key,
  itemId: slot.itemId,
  count: 1,
  affinity: slot.affinity,
  roll: slot.roll,
});
