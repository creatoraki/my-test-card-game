export * from "@/ui/common/panelMorph";
import type { Rect } from "@/ui/common/panelMorph";

export const CONTENT_DELAY_MS = 0;
export const STAGGER_MS = 40;

export const PANEL_RECT: Record<"awaken" | "nutrition", Rect> = {
  awaken: { x: 320, y: 130, w: 1280, h: 820 },
  nutrition: { x: 320, y: 100, w: 1280, h: 880 },
};
