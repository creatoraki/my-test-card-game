import type { Rarity } from "@/engine";
import type { ItemStack } from "@/items/types";
import { techCostCheck } from "./techCost";

export const CARD_SHOP_PRICE: Record<Rarity, number> = {
  common: 150,
  uncommon: 300,
  rare: 1000,
};

export const SHOP_MAX_LEVEL = 5;
export const SHOP_TECH_CANVAS = { width: 900, height: 480 } as const;

export type ShopTechKind = "slot" | "refresh";

export interface ShopTech {
  id: string;
  kind: ShopTechKind;
  requires: string[];
  x: number;
  y: number;
  name: string;
  desc: string;
  loot: number;
  materials: { itemId: string; count: number }[];
}

export const SHOP_TECHS: ShopTech[] = [
  {
    id: "slot-1",
    kind: "slot",
    requires: [],
    x: 340,
    y: 150,
    name: "展柜扩容 I",
    desc: "槽位 6 → 7",
    loot: 400,
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "refresh-1",
    kind: "refresh",
    requires: [],
    x: 340,
    y: 340,
    name: "补货链路优化 I",
    desc: "刷新价 100 → 90",
    loot: 900,
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "slot-2",
    kind: "slot",
    requires: ["slot-1"],
    x: 640,
    y: 150,
    name: "展柜扩容 II",
    desc: "槽位 7 → 8",
    loot: 1600,
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
  {
    id: "refresh-2",
    kind: "refresh",
    requires: ["refresh-1"],
    x: 640,
    y: 340,
    name: "补货链路优化 II",
    desc: "刷新价 90 → 80",
    loot: 2600,
    materials: [
      { itemId: "blue-crystal", count: 8 },
      { itemId: "red-crystal", count: 4 },
    ],
  },
];

const SLOT_STEPS = [6, 7, 8];
const REFRESH_STEPS = [100, 90, 80];

export function shopSlotCount(done: string[]): number {
  const count = SHOP_TECHS.filter(
    (tech) => tech.kind === "slot" && done.includes(tech.id),
  ).length;
  return SLOT_STEPS[Math.min(count, SLOT_STEPS.length - 1)];
}

export function shopRefreshBase(done: string[]): number {
  const count = SHOP_TECHS.filter(
    (tech) => tech.kind === "refresh" && done.includes(tech.id),
  ).length;
  return REFRESH_STEPS[Math.min(count, REFRESH_STEPS.length - 1)];
}

export function shopRefreshCost(done: string[], refreshes: number): number {
  return shopRefreshBase(done) * (1 + Math.max(0, refreshes));
}

export function shopLevelOf(doneTechs: string[]): number {
  return Math.min(SHOP_MAX_LEVEL, doneTechs.length + 1);
}

export function isShopTechAvailable(tech: ShopTech, done: string[]): boolean {
  return !done.includes(tech.id) && tech.requires.every((id) => done.includes(id));
}

export type ShopTechState = "done" | "available" | "lacking" | "locked";

export function shopTechState(
  tech: ShopTech,
  done: string[],
  loot: number,
  storage: ItemStack[],
): ShopTechState {
  if (done.includes(tech.id)) return "done";
  if (!isShopTechAvailable(tech, done)) return "locked";
  return techCostCheck(tech, loot, storage).ok ? "available" : "lacking";
}
