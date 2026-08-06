// 仓库使用冷银白透玻璃、背包使用近黑玻璃 + 熔橙点缀，靠明度与色相双重区分。
// 背包 panel alpha 高于仓库是刻意的：它是物资准备步骤的主操作区。
import type { InventoryColorMap } from "@/ui/common/item/ItemInventoryPanel";

export const SORTIE_STORAGE_COLORS: InventoryColorMap = {
  panel: "#0b1a1fa6",
  panelDeep: "#04090cb3",
  panelGlow: "#ffffff14",
  panelLine: "#ffffff3d",
  frame: "#ffffffb3",
  frameHot: "#ffffff",
  accent: "#ffffffe6",
  accentAlt: "#75e1d4",
  text: "#ffffff",
  muted: "#b6c7c9",
  tray: "#ffffff0f",
  trayBorder: "#ffffff33",
  slot: "#ffffff12",
  slotBorder: "#ffffff2e",
  slotHover: "#ffffff2b",
  selected: "#c7fff6",
  selectedGlow: "#c7fff666",
  emptySlot: "#ffffff0a",
};

export const SORTIE_BACKPACK_COLORS: InventoryColorMap = {
  panel: "#0a0c0fdb",
  panelDeep: "#020305e8",
  panelGlow: "#ff7a2f14",
  panelLine: "#ffffff26",
  frame: "#c9ced6cc",
  frameHot: "#ff9c52",
  accent: "#ff7a2f",
  accentAlt: "#7fd6ff",
  text: "#f2f4f7",
  muted: "#7f868f",
  tray: "#00000066",
  trayBorder: "#ffffff1f",
  slot: "#0d1013cc",
  slotBorder: "#ffffff1f",
  slotHover: "#ff7a2f26",
  selected: "#ff7a2f",
  selectedGlow: "#ff7a2f59",
  emptySlot: "#ffffff08",
};