import { countByItemId } from "@/items/inventory";
import type { ItemStack } from "@/items/types";

export type NutritionTechKind = "capacity" | "potency";

export interface NutritionTech {
  id: string;
  kind: NutritionTechKind;
  tier: number;
  name: string;
  desc: string;
  loot: number;
  materials: { itemId: string; count: number }[];
}

export const NUTRITION_TECHS: NutritionTech[] = [
  {
    id: "capacity-1",
    kind: "capacity",
    tier: 1,
    name: "舱位扩建 I",
    desc: "舱位 1 → 2",
    loot: 300,
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "potency-1",
    kind: "potency",
    tier: 1,
    name: "营养液配比 I",
    desc: "单次治疗 +30 → +40",
    loot: 300,
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "capacity-2",
    kind: "capacity",
    tier: 2,
    name: "舱位扩建 II",
    desc: "舱位 2 → 3",
    loot: 750,
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "potency-2",
    kind: "potency",
    tier: 2,
    name: "营养液配比 II",
    desc: "单次治疗 +40 → +50",
    loot: 750,
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "capacity-3",
    kind: "capacity",
    tier: 3,
    name: "舱位扩建 III",
    desc: "舱位 3 → 4",
    loot: 1500,
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
  {
    id: "potency-3",
    kind: "potency",
    tier: 3,
    name: "营养液配比 III",
    desc: "单次治疗 +50 → +65",
    loot: 1500,
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
];

export const NUTRITION_TREAT_COST = 100;
export const NUTRITION_MAX_LEVEL = 4;
const POTENCY_STEPS = [30, 40, 50, 65];

export function nutritionPods(done: string[]): number {
  return 1 + NUTRITION_TECHS.filter((tech) => tech.kind === "capacity" && done.includes(tech.id)).length;
}

export function nutritionHeal(done: string[]): number {
  const count = NUTRITION_TECHS.filter((tech) => tech.kind === "potency" && done.includes(tech.id)).length;
  return POTENCY_STEPS[Math.min(count, POTENCY_STEPS.length - 1)];
}

export function nutritionLevel(done: string[]): number {
  const capacity = NUTRITION_TECHS.filter((tech) => tech.kind === "capacity" && done.includes(tech.id)).length;
  const potency = NUTRITION_TECHS.filter((tech) => tech.kind === "potency" && done.includes(tech.id)).length;
  return Math.min(NUTRITION_MAX_LEVEL, 1 + Math.min(capacity, potency));
}

export function nutritionTechsOfTier(tier: number): NutritionTech[] {
  return NUTRITION_TECHS.filter((tech) => tech.tier === tier);
}

export function isTechAvailable(tech: NutritionTech, done: string[]): boolean {
  return tech.tier === nutritionLevel(done) && !done.includes(tech.id);
}

export interface NutritionTechCheck {
  lootOk: boolean;
  materials: { itemId: string; need: number; have: number; ok: boolean }[];
  ok: boolean;
}

export function nutritionTechCheck(
  tech: NutritionTech,
  loot: number,
  storage: ItemStack[],
): NutritionTechCheck {
  const lootOk = loot >= tech.loot;
  const materials = tech.materials.map((material) => {
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