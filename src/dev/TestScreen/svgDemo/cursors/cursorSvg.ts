import { cursorCssValue, type CursorGlyph } from "@/ui/art/cursor";
import { CURSOR_STATES, type CursorState } from "./types";

export { cursorDataUri, cursorSvgMarkup, gearPath } from "@/ui/art/cursor";

/** 生成可直接写入 CSS cursor 的值，回落关键字按状态取。 */
export function cursorCss(glyph: CursorGlyph, state: CursorState, size: number) {
  const fallback = CURSOR_STATES.find((item) => item.id === state)?.fallback ?? "auto";
  return cursorCssValue(glyph, size, fallback);
}
