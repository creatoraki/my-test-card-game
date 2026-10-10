import type { CursorScheme } from "./types";

// 方案二：霓虹线框。深色实心底 + 青色发光描边，交互态挂洋红信号环，瞄准态为四角括号准星。
// 发光用加宽半透明描边模拟，不依赖滤镜；每条亮线下垫深色底线，保证亮底上也看得清。
const CYAN = "#5ff6ff";
const MAGENTA = "#ff7ae0";
const DARK = "#04121a";
const ARROW_D = "M4 3 L4 26.5 L10.4 20.4 L14.8 29.4 L18.6 27.6 L14.3 18.9 L23.2 18.9 Z";
const ARROW = `<path d="${ARROW_D}" fill="none" stroke="#3ef0ff" stroke-width="4" stroke-linejoin="round" opacity=".25"/>`
  + `<path d="${ARROW_D}" fill="#07161f" stroke="${CYAN}" stroke-width="1.5" stroke-linejoin="round"/>`
  + `<path d="M6.6 9.5 V20" stroke="#c8fdff" stroke-width="1.1" stroke-linecap="round"/>`;
const RING = `<circle cx="25.5" cy="25.5" r="4.2" fill="none" stroke="#ff4fd8" stroke-width="3.6" opacity=".3"/>`
  + `<circle cx="25.5" cy="25.5" r="4.2" fill="#1a0718" stroke="${MAGENTA}" stroke-width="1.4"/>`
  + `<circle cx="25.5" cy="25.5" r="1.3" fill="#ffd2f5"/>`
  + `<path d="M25.5 29.7 V31.3 M29.7 25.5 H31.3" stroke="${MAGENTA}" stroke-width="1.2" stroke-linecap="round"/>`;
const BRACKETS = "M5 11 V5 H11 M21 5 H27 V11 M27 21 V27 H21 M11 27 H5 V21";
const DIAMOND = "M16 11.5 L20.5 16 L16 20.5 L11.5 16 Z";
const RAYS = "M16 1.5 V6 M16 26 V30.5 M1.5 16 H6 M26 16 H30.5";
const SIGHT = `<path d="${BRACKETS}" fill="none" stroke="#3ef0ff" stroke-width="4.4" opacity=".25"/>`
  + `<path d="${BRACKETS}" fill="none" stroke="${DARK}" stroke-width="3.2"/>`
  + `<path d="${BRACKETS}" fill="none" stroke="${CYAN}" stroke-width="1.6"/>`
  + `<path d="${RAYS}" stroke="${DARK}" stroke-width="2.6" stroke-linecap="round"/>`
  + `<path d="${RAYS}" stroke="${CYAN}" stroke-width="1" stroke-linecap="round"/>`
  + `<path d="${DIAMOND}" fill="none" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>`
  + `<path d="${DIAMOND}" fill="none" stroke="${MAGENTA}" stroke-width="1.4" stroke-linejoin="round"/>`
  + `<circle cx="16" cy="16" r="1.2" fill="#ffffff"/>`;

export const NEON_CURSOR: CursorScheme = {
  id: "neon",
  name: "霓虹线框",
  summary: "冷色发光线框，科技感强，适合舱室与终端类界面，暗场景下最醒目。",
  accent: CYAN,
  glyphs: {
    default: { body: ARROW, hotspot: [4, 3] },
    pointer: { body: ARROW + RING, hotspot: [4, 3] },
    aim: { body: SIGHT, hotspot: [16, 16] },
  },
};
