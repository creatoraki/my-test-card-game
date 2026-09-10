import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { SANCTUARY_RULES } from "@/data/sanctuary";
import type { ItemStack } from "@/items/types";
import type { SanctuaryState } from "@/store/townStore";

interface Params {
  storage: ItemStack[];
  loot: number;
  sanctuary: SanctuaryState;
  purifyRelic: (relicId: string) => boolean;
}

export function useSanctuaryPurify({ storage, loot, sanctuary, purifyRelic }: Params) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const curses = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).relic?.polarity === "curse"),
    [storage],
  );
  const blessings = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).relic?.polarity === "blessing"),
    [storage],
  );
  const selected = curses.find((stack) => stack.uid === selectedUid) ?? null;
  const selectedDef = selected ? getItemDef(selected.itemId) : null;
  const materials = selectedDef
    ? SANCTUARY_RULES.crystalCostByRarity[selectedDef.rarity]
    : null;
  const lootCost = selectedDef ? SANCTUARY_RULES.lootByRarity[selectedDef.rarity] : null;
  const enoughMaterials = Boolean(
    materials && Object.entries(materials).every(([itemId, count]) =>
      storage.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0) >= count,
    ),
  );
  const hasCapacity = sanctuary.purifying.length < SANCTUARY_RULES.capacity;
  const canStart = Boolean(
    selected && selectedDef && materials && enoughMaterials && hasCapacity && lootCost !== null && loot >= lootCost,
  );

  const confirm = () => {
    if (!canStart || !selected) return;
    if (purifyRelic(selected.itemId)) setSelectedUid(null);
  };

  const note = !hasCapacity
    ? "净化席位已满"
    : !selected
      ? "请选择一件诅咒遗物"
      : !enoughMaterials
        ? "净化材料不足"
        : lootCost !== null && loot < lootCost
          ? "居民积分不足"
          : "确认投入圣水池，开始净化";

  return {
    blessings,
    canStart,
    confirm,
    curses,
    lootCost,
    materialText: (cost: Readonly<Record<string, number>>) => materialText(cost, storage),
    materials,
    note,
    select: setSelectedUid,
    selected,
    selectedDef,
    sanctuary,
  };
}

function materialText(cost: Readonly<Record<string, number>>, storage: ItemStack[]): string {
  return Object.entries(cost).map(([itemId, count]) => {
    const owned = storage.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0);
    return `${getItemDef(itemId).name} ${owned}/${count}`;
  }).join(" · ");
}
