import type { CSSProperties } from "react";

export interface InventoryColorMap {
  panel?: string;
  panelDeep?: string;
  panelGlow?: string;
  panelLine?: string;
  frame?: string;
  frameHot?: string;
  accent?: string;
  accentAlt?: string;
  text?: string;
  muted?: string;
  tray?: string;
  trayBorder?: string;
  slot?: string;
  slotBorder?: string;
  slotHover?: string;
  selected?: string;
  selectedGlow?: string;
  emptySlot?: string;
}

export const DEFAULT_COLORS: Required<InventoryColorMap> = {
  panel: "#050a15e6",
  panelDeep: "#020712e6",
  panelGlow: "#00f3ff10",
  panelLine: "#00f3ff2b",
  frame: "#00f3ff",
  frameHot: "#8cffff",
  accent: "#00f3ff",
  accentAlt: "#ff0080",
  text: "#ffffff",
  muted: "#7a8fa6",
  tray: "#0000004d",
  trayBorder: "#00f3ff1a",
  slot: "#001432cc",
  slotBorder: "#00f3ff1f",
  slotHover: "#00325099",
  selected: "#ff0080",
  selectedGlow: "#ff008066",
  emptySlot: "#00f3ff0d",
};

export function inventoryThemeVars(
  colorMap?: InventoryColorMap,
  columns?: number,
): CSSProperties {
  const colors = { ...DEFAULT_COLORS, ...colorMap };

  return {
    ...(columns == null ? {} : { "--inventory-columns": String(columns) }),
    "--inventory-panel": colors.panel,
    "--inventory-panel-deep": colors.panelDeep,
    "--inventory-panel-glow": colors.panelGlow,
    "--inventory-panel-line": colors.panelLine,
    "--inventory-frame": colors.frame,
    "--inventory-frame-hot": colors.frameHot,
    "--inventory-accent": colors.accent,
    "--inventory-accent-alt": colors.accentAlt,
    "--inventory-text": colors.text,
    "--inventory-muted": colors.muted,
    "--inventory-tray": colors.tray,
    "--inventory-tray-border": colors.trayBorder,
    "--inventory-slot": colors.slot,
    "--inventory-slot-border": colors.slotBorder,
    "--inventory-slot-hover": colors.slotHover,
    "--inventory-selected": colors.selected,
    "--inventory-selected-glow": colors.selectedGlow,
    "--inventory-empty-slot": colors.emptySlot,
  } as CSSProperties;
}