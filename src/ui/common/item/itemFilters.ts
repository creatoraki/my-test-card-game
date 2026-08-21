// ============================================================================
// 物品分类 tab 的定义与过滤 —— 纯 TS, 背包面板与仓库设施共用同一套。
// 两个界面用同一个 tab 顺序与同一条过滤规则, 玩家换界面不用重新找东西。
//
// 两级: 一级按 ItemCategory; 选中「装备」时再展开武器/防具/饰品的二级 tab
// (三装备槽见《物品设计.md》第二章)。
// ============================================================================

import { getItemDef } from "@/data";
import type { EquipSlot, ItemCategory, ItemStack } from "@/items/types";

export type ItemTab = "all" | ItemCategory;
export type EquipTab = "all" | EquipSlot;

export const ITEM_TABS: { id: ItemTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "equipment", label: "装备" },
  { id: "module", label: "模组" },
  { id: "consumable", label: "消耗品" },
  { id: "material", label: "模组材料" },
  { id: "data", label: "数据存档" },
  { id: "scrap", label: "废料" },
];

export const EQUIP_TABS: { id: EquipTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "weapon", label: "武器" },
  { id: "armor", label: "防具" },
  { id: "trinket", label: "饰品" },
];

export function matchTab(stack: ItemStack, tab: ItemTab, equipTab: EquipTab): boolean {
  const def = getItemDef(stack.itemId);
  if (tab === "all") return true;
  if (def.category !== tab) return false;
  if (tab !== "equipment" || equipTab === "all") return true;
  return def.slot === equipTab;
}

// 各 tab 下有几件 —— tab 上挂个计数, 玩家不用逐个点开找。
export function tabCounts(stacks: ItemStack[]): Record<ItemTab, number> {
  const out: Record<string, number> = { all: stacks.length };
  for (const st of stacks) {
    const c = getItemDef(st.itemId).category;
    out[c] = (out[c] ?? 0) + 1;
  }
  return out as Record<ItemTab, number>;
}
