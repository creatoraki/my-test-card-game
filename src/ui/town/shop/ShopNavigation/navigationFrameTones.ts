// 导航牌配色：全部走 --rail-* 变量；pale / flare 未在主题里声明时由 hot 与白混出。
import type { NavTone } from "./navigationFrameGeometry";

export const ACCENT = "var(--rail-accent, #ff3b4e)";
export const HOT = "var(--rail-accent-hot, #ff8d97)";
export const DEEP = "var(--rail-accent-deep, #5a1119)";
/** 选中亮条的浅粉主体。 */
export const PALE = `var(--rail-accent-pale, color-mix(in srgb, ${HOT} 55%, #ffffff))`;
/** 右下切角的近白热核。 */
export const FLARE = `var(--rail-accent-flare, color-mix(in srgb, ${HOT} 45%, #ffffff))`;

export const TONE: Record<NavTone, string> = {
  accent: ACCENT,
  hot: HOT,
  flare: FLARE,
  white: "#ffffff",
};
