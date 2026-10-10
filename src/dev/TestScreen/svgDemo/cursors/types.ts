import type { CursorGlyph } from "@/ui/art/cursor";

export { CURSOR_VIEWBOX, type CursorGlyph } from "@/ui/art/cursor";

/** 演示对比的指针状态：默认箭头 / 可交互对象上 / 瞄准敌人。 */
export type CursorState = "default" | "pointer" | "aim";

export interface CursorScheme {
  id: string;
  name: string;
  summary: string;
  /** 方案卡片强调色。 */
  accent: string;
  glyphs: Record<CursorState, CursorGlyph>;
}

export const CURSOR_STATES: readonly { id: CursorState; label: string; fallback: string }[] = [
  { id: "default", label: "默认", fallback: "default" },
  { id: "pointer", label: "可交互", fallback: "pointer" },
  { id: "aim", label: "瞄准", fallback: "crosshair" },
];
