import { countByItemId } from "@/items/inventory";
import type { EquipSlot, ItemDef, ItemRarity, ItemStack } from "@/items/types";

export interface MaterialCost {
  itemId: string;
  count: number;
}

const SLOT_MATERIALS: Record<EquipSlot, [MaterialCost, MaterialCost]> = {
  weapon: [
    { itemId: "standard-gear", count: 4 },
    { itemId: "coil-spring", count: 3 },
  ],
  armor: [
    { itemId: "magnet", count: 4 },
    { itemId: "standard-gear", count: 3 },
  ],
  trinket: [
    { itemId: "logic-cube", count: 4 },
    { itemId: "standard-battery", count: 3 },
  ],
};

const UPGRADE_BY_TARGET: Partial<Record<ItemRarity, { crystalId: string; loot: number }>> = {
  fine: { crystalId: "green-crystal", loot: 300 },
  rare: { crystalId: "blue-crystal", loot: 600 },
  epic: { crystalId: "blue-crystal", loot: 1200 },
  legendary: { crystalId: "red-crystal", loot: 2400 },
};

export const REFORGE_COST: MaterialCost = { itemId: "green-crystal", count: 3 };

export interface UpgradeRecipe {
  materials: MaterialCost[];
  loot: number;
}

export function upgradeRecipe(slot: EquipSlot, target: ItemRarity): UpgradeRecipe | null {
  const crystal = UPGRADE_BY_TARGET[target];
  if (!crystal) return null;
  return {
    materials: [...SLOT_MATERIALS[slot], { itemId: crystal.crystalId, count: 3 }],
    loot: crystal.loot,
  };
}

export interface CostCheck {
  loot: { need: number; have: number; ok: boolean } | null;
  materials: { itemId: string; need: number; have: number; ok: boolean }[];
  ok: boolean;
}

export function upgradeCheck(nextDef: ItemDef, loot: number, storage: ItemStack[]): CostCheck {
  const recipe = nextDef.slot ? upgradeRecipe(nextDef.slot, nextDef.rarity) : null;
  if (!recipe) return { loot: null, materials: [], ok: false };
  const lootCheck = { need: recipe.loot, have: loot, ok: loot >= recipe.loot };
  const materials = recipe.materials.map((material) => {
    const have = countByItemId(storage, material.itemId);
    return { itemId: material.itemId, need: material.count, have, ok: have >= material.count };
  });
  return { loot: lootCheck, materials, ok: lootCheck.ok && materials.every((material) => material.ok) };
}

export function reforgeCheck(storage: ItemStack[]): CostCheck {
  const have = countByItemId(storage, REFORGE_COST.itemId);
  const material = {
    itemId: REFORGE_COST.itemId,
    need: REFORGE_COST.count,
    have,
    ok: have >= REFORGE_COST.count,
  };
  return { loot: null, materials: [material], ok: material.ok };
}