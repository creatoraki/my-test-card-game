export * from "@/ui/common/panelMorph";
import type { Rect } from "@/ui/common/panelMorph";
import type { PanelId } from "./useCryoMorph";

export const CONTENT_DELAY_MS = 0;
export const STAGGER_MS = 40;

export const PANEL_RECT: Record<PanelId, Rect> = {
  revive: { x: 320, y: 130, w: 1280, h: 820 },
  nutrition: { x: 200, y: 80, w: 1520, h: 920 },
  sanctuary: { x: 200, y: 80, w: 1520, h: 920 },
};
