import type { ItemStack } from "@/items/types";

/** 一条模组制造配方: 由某个角色制造, 消耗该角色的经验池 + 仓库材料, 产出一件模组物品。 */
export interface ModuleRecipe {
  itemId: string; // 产出模组物品 id
  charId: string; // 制造者角色 id
  exp: number; // 消耗制造者的可用经验
  materials: { itemId: string; count: number }[];
}

export const MODULE_RECIPES: ModuleRecipe[] = [
  {
    itemId: "rush-module",
    charId: "swordsman",
    exp: 200,
    materials: [
      { itemId: "logic-cube", count: 3 },
      { itemId: "standard-battery", count: 2 },
    ],
  },
  {
    itemId: "discard-module",
    charId: "swordsman",
    exp: 200,
    materials: [
      { itemId: "standard-gear", count: 3 },
      { itemId: "logic-cube", count: 2 },
    ],
  },
];

export function recipesOfCharacter(charId: string): ModuleRecipe[] {
  return MODULE_RECIPES.filter((recipe) => recipe.charId === charId);
}

export function getModuleRecipe(charId: string, itemId: string): ModuleRecipe | undefined {
  return MODULE_RECIPES.find((recipe) => recipe.charId === charId && recipe.itemId === itemId);
}

/** 仓库里某种材料的总数。⚠ 按 count 求和 —— 仓库存的是逐 uid 的独立堆。 */
export function materialCount(storage: ItemStack[], itemId: string): number {
  return storage.reduce((sum, stack) => (stack.itemId === itemId ? sum + stack.count : sum), 0);
}

export interface CraftCheck {
  expOk: boolean;
  materials: { itemId: string; need: number; have: number; ok: boolean }[];
  ok: boolean;
}

/** 制造可行性。★ 唯一真相点: townStore 的护栏与 UI 的置灰都读它, 不各写一遍。 */
export function craftCheck(recipe: ModuleRecipe, exp: number, storage: ItemStack[]): CraftCheck {
  const expOk = exp >= recipe.exp;
  const materials = recipe.materials.map((material) => {
    const have = materialCount(storage, material.itemId);
    return { itemId: material.itemId, need: material.count, have, ok: have >= material.count };
  });
  return { expOk, materials, ok: expOk && materials.every((material) => material.ok) };
}
