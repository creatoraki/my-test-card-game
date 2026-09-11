import type { ItemStack } from "@/items/types";
import { materialCostCheck, type TechCostMaterialCheck } from "./techCost";

export type NutritionTechKind = "capacity" | "potency";

export interface NutritionTech {
  id: string;
  kind: NutritionTechKind;
  requires: string[];
  x: number;
  y: number;
  name: string;
  desc: string;
  materials: { itemId: string; count: number }[];
}

export const NUTRITION_TECHS: NutritionTech[] = [
  {
    id: "capacity-1",
    kind: "capacity",
    requires: [],
    x: 280,
    y: 128,
    name: "席位扩建 I",
    desc: "席位 1 → 2",
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "potency-1",
    kind: "potency",
    requires: [],
    x: 280,
    y: 352,
    name: "疗养液配比 I",
    desc: "单次治疗 +30 → +40",
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "capacity-2",
    kind: "capacity",
    requires: ["capacity-1"],
    x: 520,
    y: 128,
    name: "席位扩建 II",
    desc: "席位 2 → 3",
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "potency-2",
    kind: "potency",
    requires: ["potency-1"],
    x: 520,
    y: 352,
    name: "疗养液配比 II",
    desc: "单次治疗 +40 → +50",
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "capacity-3",
    kind: "capacity",
    requires: ["capacity-2"],
    x: 760,
    y: 128,
    name: "席位扩建 III",
    desc: "席位 3 → 4",
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
  {
    id: "potency-3",
    kind: "potency",
    requires: ["potency-2"],
    x: 760,
    y: 352,
    name: "疗养液配比 III",
    desc: "单次治疗 +50 → +65",
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
];

export const NUTRITION_TREAT_COST = 100;
export const NUTRITION_POD_MAX = 4;
export const NUTRITION_MAX_LEVEL = 1 + NUTRITION_TECHS.length;
export const NUTRITION_TECH_CANVAS = { width: 900, height: 480 } as const;
const POTENCY_STEPS = [30, 40, 50, 65];

export function nutritionPods(done: string[]): number {
  return 1 + NUTRITION_TECHS.filter((tech) => tech.kind === "capacity" && done.includes(tech.id)).length;
}

export function nutritionHeal(done: string[]): number {
  const count = NUTRITION_TECHS.filter((tech) => tech.kind === "potency" && done.includes(tech.id)).length;
  return POTENCY_STEPS[Math.min(count, POTENCY_STEPS.length - 1)];
}

export function nutritionLevel(done: string[]): number {
  return 1 + done.length;
}

export function isTechAvailable(tech: NutritionTech, done: string[]): boolean {
  return !done.includes(tech.id) && tech.requires.every((id) => done.includes(id));
}

export type NutritionTechState = "done" | "available" | "lacking" | "locked";

export function nutritionTechState(
  tech: NutritionTech,
  done: string[],
  storage: ItemStack[],
): NutritionTechState {
  if (done.includes(tech.id)) return "done";
  if (!isTechAvailable(tech, done)) return "locked";
  return materialCostCheck(tech.materials, storage).every((material) => material.ok) ? "available" : "lacking";
}

export function nutritionTechCost(
  tech: NutritionTech,
  storage: ItemStack[],
): { materials: TechCostMaterialCheck[]; ok: boolean } {
  const materials = materialCostCheck(tech.materials, storage);
  return { materials, ok: materials.every((material) => material.ok) };
}
