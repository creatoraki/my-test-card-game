import { countByItemId } from "@/items/inventory";
import type { ItemStack } from "@/items/types";

export interface TechCost {
  loot: number;
  materials: { itemId: string; count: number }[];
}

export interface TechCostMaterialCheck {
  itemId: string;
  need: number;
  have: number;
  ok: boolean;
}

export interface TechCostCheck {
  lootOk: boolean;
  materials: TechCostMaterialCheck[];
  ok: boolean;
}

export function techCostCheck(cost: TechCost, loot: number, storage: ItemStack[]): TechCostCheck {
  const lootOk = loot >= cost.loot;
  const materials = cost.materials.map((material) => {
    const have = countByItemId(storage, material.itemId);
    return {
      itemId: material.itemId,
      need: material.count,
      have,
      ok: have >= material.count,
    };
  });
  return { lootOk, materials, ok: lootOk && materials.every((material) => material.ok) };
}
