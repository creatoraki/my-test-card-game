import type { ItemRarity } from "@/items/types";

// 物品卡底条的稀有度英文代号 —— 设计图约定此处保留英文, 其余位置仍用 RARITY_LABEL 中文。
export const RARITY_CODE: Record<ItemRarity, string> = {
  common: "COMMON",
  fine: "UNCOMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};
