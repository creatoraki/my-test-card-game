import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import type { EquipSlot, ItemStack } from "@/items/types";
import type { CharacterState } from "@/store/townStore";
import { previewStatsWith } from "./equipPreview";

export function useEquipPreview(cs: CharacterState | undefined, storage: ItemStack[]) {
  const [activeSlot, setActiveSlot] = useState<EquipSlot | null>(null);
  const [hoveredStack, setHoveredStack] = useState<ItemStack | null>(null);

  const candidates = useMemo(
    () =>
      activeSlot
        ? storage.filter((stack) => {
            const def = getItemDef(stack.itemId);
            return def.category === "equipment" && def.slot === activeSlot;
          })
        : [],
    [activeSlot, storage],
  );

  const previewStats = useMemo(
    () => (cs && hoveredStack && activeSlot ? previewStatsWith(cs, activeSlot, hoveredStack) : null),
    [activeSlot, cs, hoveredStack],
  );

  const clear = () => {
    setActiveSlot(null);
    setHoveredStack(null);
  };

  return {
    activeSlot,
    candidates,
    hoveredStack,
    previewStats,
    setActiveSlot,
    setHoveredStack,
    clear,
  };
}