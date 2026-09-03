import { prefersReducedMotion } from "@/ui/app/transitions";
import { designRectOf } from "@/ui/hooks/stage";

export { designRectOf };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

export const SLIDE_MS = duration(520);
export const WIDEN_MS = duration(260);
export const TALLEN_MS = duration(300);
export const OPEN_MS = SLIDE_MS + WIDEN_MS + TALLEN_MS;
export const CLOSE_TALLEN_MS = duration(240);
export const CLOSE_WIDEN_MS = duration(200);
export const CLOSE_SLIDE_MS = duration(460);
export const CLOSE_MS = CLOSE_TALLEN_MS + CLOSE_WIDEN_MS + CLOSE_SLIDE_MS;
export const CONTENT_IN_MS = duration(280);
export const MORPH_EASE = "cubic-bezier(0.2, 0.72, 0.28, 1)";

export const PANEL_RECT: Record<"awaken" | "nutrition", Rect> = {
  awaken: { x: 320, y: 130, w: 1280, h: 820 },
  nutrition: { x: 320, y: 100, w: 1280, h: 880 },
};

export const box = (rect: Rect): Record<string, string> => ({
  left: `${rect.x}px`,
  top: `${rect.y}px`,
  width: `${rect.w}px`,
  height: `${rect.h}px`,
});

export const centered = (rect: Rect, w: number, h: number): Rect => ({
  x: rect.x + (rect.w - w) / 2,
  y: rect.y + (rect.h - h) / 2,
  w,
  h,
});