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
// ── 关闭编排 ──
// 所有 morph 面板统一走「面板竖向折叠成一条横线 → 横线淡出」; 同时右侧入口砖从画布
// 右缘外主动滑回它的静态初始位。两段轻微重叠: 折叠推进到约七成时砖块起步。
export const COLLAPSE_MS = duration(340);
export const ENTRY_BACK_DELAY_MS = duration(240);
export const ENTRY_BACK_MS = duration(420);
// 关闭总时长 = 入口砖起步延迟 + 入口砖滑回时长(折叠比它先结束, 不参与相加)。
// usePanelMorph 的卸载兜底计时器吃这个值。
export const CLOSE_MS = ENTRY_BACK_DELAY_MS + ENTRY_BACK_MS;
export const CONTENT_IN_MS = duration(280);
export const MORPH_EASE = "cubic-bezier(0.2, 0.72, 0.28, 1)";

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
