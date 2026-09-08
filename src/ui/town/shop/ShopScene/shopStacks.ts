import { useMemo } from "react";
import type { ShopSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";

export const asStack = (slot: ShopSlot): ItemStack => ({
  uid: slot.key,
  itemId: slot.itemId,
  count: 1,
  affinity: slot.affinity,
  roll: slot.roll,
});

export function useSlotStacks(slots: ShopSlot[]) {
  return useMemo(
    () => new Map<string, ItemStack>(slots.map((slot) => [slot.key, asStack(slot)])),
    [slots],
  );
}

