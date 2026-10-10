import type { CursorGlyph } from "./cursorSvg";
import { BADGE, BRASS_HIGHLIGHT, DEFS, INK, arrow, gear, outlined } from "./brassParts";

// 黄铜机械指针全套状态。箭头类热点统一在尖端 (3, 2)，居中类热点在 (16, 16)。
const TIP = [3, 2] as const;
const CENTER = [16, 16] as const;

/** 按下：箭头压暗、齿轮转过半齿并溅出一圈火花。 */
const PRESSED_SPARK = `<circle cx="${BADGE}" cy="${BADGE}" r="7" fill="none" stroke="#ffd36a" stroke-width="1" stroke-dasharray="1.6 2.4" opacity=".75"/>`;

/** 说明：右下角黄铜圆牌 + 墨色问号。 */
const HELP_PLATE = `<circle cx="${BADGE}" cy="${BADGE}" r="5.8" fill="url(#b)" stroke="${INK}" stroke-width="1.2"/>`
  + `<path d="M22.6 22.6 A1.9 1.9 0 1 1 25.45 24.25 C24.7 24.75 24.5 25.2 24.5 26.2" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`
  + `<circle cx="${BADGE}" cy="28.2" r=".95" fill="${INK}"/>`;

/** 禁止：右下角红色禁行圈。 */
const FORBID_RING = `<circle cx="${BADGE}" cy="${BADGE}" r="5" fill="#2a1208" stroke="${INK}" stroke-width="3.8"/>`
  + `<path d="M21 21 L28 28" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`
  + `<circle cx="${BADGE}" cy="${BADGE}" r="5" fill="none" stroke="#d8432e" stroke-width="2"/>`
  + `<path d="M21 21 L28 28" stroke="#d8432e" stroke-width="1.8" stroke-linecap="round"/>`;

/** 拖拽：横向黄铜双箭头；抓住时收窄并压暗。 */
const shuttle = (d: string, tone: "b" | "d") =>
  `<path d="${d}" fill="url(#${tone})" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`
  + `<circle cx="16" cy="16" r="1.4" fill="#3a2410"/><circle cx="15.7" cy="15.7" r=".5" fill="#ffe9a8"/>`;
const GRAB_D = "M2 16 L9 9.5 L9 13 L23 13 L23 9.5 L30 16 L23 22.5 L23 19 L9 19 L9 22.5 Z";
const GRABBING_D = "M5 16 L11 10.5 L11 13.6 L21 13.6 L21 10.5 L27 16 L21 21.5 L21 18.4 L11 18.4 L11 21.5 Z";

/** 瞄准：黄铜圆环准星 + 红色中心。 */
const SIGHT = outlined("M16 6 A10 10 0 1 1 15.99 6", 2.2, "url(#b)")
  + outlined("M16 1.6 V8 M16 24 V30.4 M1.6 16 H8 M24 16 H30.4", 1.6, BRASS_HIGHLIGHT)
  + `<circle cx="16" cy="16" r="2" fill="#c8321e" stroke="${INK}" stroke-width="1"/>`;

/** 加载圆环：暗槽 + 一段亮黄铜弧与弧头亮点，按帧旋转。 */
const WAIT_TRACK = `<circle cx="16" cy="16" r="10" fill="none" stroke="${INK}" stroke-width="5.6"/>`
  + `<circle cx="16" cy="16" r="10" fill="none" stroke="#5a3a12" stroke-width="3.2"/>`;
const WAIT_ARC = `<circle cx="16" cy="16" r="10" fill="none" stroke="url(#b)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="22 40.83"/>`
  + `<circle cx="10.12" cy="24.09" r="1.9" fill="#fff3c4" stroke="${INK}" stroke-width=".8"/>`;
const WAIT_HUB = `<circle cx="16" cy="16" r="3" fill="url(#b)" stroke="${INK}" stroke-width="1.2"/><circle cx="16" cy="16" r="1" fill="${INK}"/>`;

/** 加载动画帧数；整圈一周的时长见 BRASS_WAIT_CYCLE_MS。 */
export const BRASS_WAIT_FRAME_COUNT = 12;
export const BRASS_WAIT_CYCLE_MS = 960;

export const BRASS_WAIT_FRAMES: readonly CursorGlyph[] = Array.from({ length: BRASS_WAIT_FRAME_COUNT }, (_, i) => ({
  body: DEFS + WAIT_TRACK + `<g transform="rotate(${(360 / BRASS_WAIT_FRAME_COUNT) * i} 16 16)">${WAIT_ARC}</g>` + WAIT_HUB,
  hotspot: CENTER,
}));

export const BRASS_CURSOR = {
  default: { body: DEFS + arrow("b"), hotspot: TIP },
  pointer: { body: DEFS + arrow("b") + gear("b"), hotspot: TIP },
  pressed: { body: DEFS + arrow("d") + PRESSED_SPARK + gear("d", Math.PI / 8), hotspot: TIP },
  help: { body: DEFS + arrow("b") + HELP_PLATE, hotspot: TIP },
  forbidden: { body: DEFS + arrow("d") + FORBID_RING, hotspot: TIP },
  grab: { body: DEFS + shuttle(GRAB_D, "b"), hotspot: CENTER },
  grabbing: { body: DEFS + shuttle(GRABBING_D, "d"), hotspot: CENTER },
  aim: { body: DEFS + SIGHT, hotspot: CENTER },
  wait: BRASS_WAIT_FRAMES[0],
} satisfies Record<string, CursorGlyph>;

export type BrassCursorState = keyof typeof BRASS_CURSOR;
