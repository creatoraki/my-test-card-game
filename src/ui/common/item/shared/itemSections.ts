// ============================================================================
// 背包分区 —— 探索底部背包、大背包面板、胜利回收背包共用同一套分区与排序。
//
// 分区顺序: 食物 → 换金物 → 材料 → 消耗品 → 遗物 → 装备(模组并入装备区, 排在装备之后)。
// ★ 只是**展示层**排序: session.backpack 的存储顺序不动, 各网格渲染前各自排一遍。
//   食物在数据上属于 consumable, 这里按 NEAR_EXPIRY_FOOD_IDS 单独提出来归进材料段。
// ============================================================================

import { getItemDef, NEAR_EXPIRY_FOOD_IDS } from "@/data";
import { RARITY_ORDER, type ItemDef, type ItemStack } from "@/items/types";

export type ItemSection = "food" | "scrap" | "material" | "consumable" | "relic" | "equipment";

export const SECTION_ORDER: readonly ItemSection[] = [
  "food",
  "scrap",
  "material",
  "consumable",
  "relic",
  "equipment",
];

export const SECTION_LABEL: Record<ItemSection, string> = {
  food: "食物",
  scrap: "换金物",
  material: "材料",
  consumable: "消耗品",
  relic: "遗物",
  equipment: "装备",
};

// 分区标识色: 分割线、分区标签、格子底边色条都读它。
export const SECTION_COLOR: Record<ItemSection, string> = {
  food: "#ffb45c",
  scrap: "#f2d15b",
  material: "#7fd4c4",
  consumable: "#6fb8ff",
  relic: "#c89bff",
  equipment: "#ff7a8a",
};

const FOOD_IDS = new Set<string>(NEAR_EXPIRY_FOOD_IDS);

export function itemSection(def: ItemDef): ItemSection {
  if (FOOD_IDS.has(def.id)) return "food";
  switch (def.category) {
    case "scrap":
      return "scrap";
    case "material":
      return "material";
    case "consumable":
      return "consumable";
    case "relic":
      return "relic";
    default:
      return "equipment"; // equipment 与 module
  }
}

const SECTION_RANK = new Map(SECTION_ORDER.map((section, index) => [section, index]));
const RARITY_RANK = new Map(RARITY_ORDER.map((rarity, index) => [rarity, index]));

/** 分区序 → 装备区内装备先于模组 → 稀有度高到低 → 同种相邻 → 原顺序(稳定)。 */
export function sortBySection(stacks: readonly ItemStack[]): ItemStack[] {
  return stacks
    .map((stack, index) => {
      const def = getItemDef(stack.itemId);
      return {
        stack,
        index,
        itemId: def.id,
        section: SECTION_RANK.get(itemSection(def)) ?? 0,
        module: def.category === "module" ? 1 : 0,
        rarity: RARITY_RANK.get(def.rarity) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.section - b.section ||
        a.module - b.module ||
        b.rarity - a.rarity ||
        a.itemId.localeCompare(b.itemId) ||
        a.index - b.index,
    )
    .map((entry) => entry.stack);
}

export interface SectionMark {
  section: ItemSection;
  /** 本格是否为该分区的第一格 —— 网格据此画分割线与分区标签。 */
  start: boolean;
}

/** 已排序列表逐格的分区标记, 下标与入参一一对应。 */
export function sectionMarks(sorted: readonly ItemStack[]): SectionMark[] {
  let previous: ItemSection | null = null;
  return sorted.map((stack) => {
    const section = itemSection(getItemDef(stack.itemId));
    const start = section !== previous;
    previous = section;
    return { section, start };
  });
}
