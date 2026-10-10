import { BRASS_CURSOR as BRASS } from "@/ui/art/cursor";
import type { CursorScheme } from "./types";

// 方案一：黄铜机械 —— 已定为全局指针，图形直接取正式模块 ui/art/cursor。
export const BRASS_CURSOR: CursorScheme = {
  id: "brass",
  name: "黄铜机械",
  summary: "厚实黄铜质感，深色描边在任何底色上都清晰，贴合钢框卡面风格。（已应用为全局指针）",
  accent: "#d9a441",
  glyphs: { default: BRASS.default, pointer: BRASS.pointer, aim: BRASS.aim },
};
