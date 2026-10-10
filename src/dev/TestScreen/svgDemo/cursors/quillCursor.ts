import type { CursorScheme } from "./types";

// 方案三：羽笔墨迹。羊皮纸色羽毛 + 墨色笔尖指向左上；交互态滴一滴墨，瞄准态为毛笔圈 + 朱印。
// 墨色部件外圈垫一层羊皮纸色，暗底上同样可辨。
const INK = "#1d2433";
const PAPER = "#f3e6c8";
const DEFS = `<defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".55" stop-color="#e8d6b0"/><stop offset="1" stop-color="#b3936a"/></linearGradient></defs>`;
const QUILL = `<path d="M6 6 C12 6 22 10 28 28 C10 22 6 12 6 6 Z" fill="url(#p)" stroke="#3b2a1a" stroke-width="1.3" stroke-linejoin="round"/>`
  + `<path d="M12.5 12.5 L14.6 10.4 M17 17 L19.6 14.4 M21.5 21.5 L23.6 19.4 M12.5 12.5 L10.4 14.6 M17 17 L14.4 19.6 M21.5 21.5 L19.4 23.6" stroke="#8a6c45" stroke-width=".8" stroke-linecap="round" opacity=".8"/>`
  + `<path d="M6.5 6.5 L27 27" stroke="#5b4128" stroke-width="1.1" stroke-linecap="round"/>`
  + `<path d="M1.8 1.8 L8 4.4 L6.6 6.6 L4.4 8 Z" fill="#1f2530" stroke="${PAPER}" stroke-width=".8" stroke-linejoin="round"/>`
  + `<path d="M2.6 2.6 L5.4 5.4" stroke="#aab4c2" stroke-width=".6" stroke-linecap="round"/>`;
const DROP = `<path d="M26 2.4 C28.2 5.6 29.2 7.3 29.2 8.8 A3.2 3.2 0 0 1 22.8 8.8 C22.8 7.3 23.8 5.6 26 2.4 Z" fill="#24365e" stroke="${PAPER}" stroke-width=".9" stroke-linejoin="round"/>`
  + `<ellipse cx="24.9" cy="8.6" rx=".7" ry="1" fill="#9fb6e6"/>`;
const RING = "M16 5.2 A10.8 10.8 0 1 1 6.1 11.6";
const RING_TAIL = "M6.65 10.6 A10.8 10.8 0 0 1 14.1 5.36";
const STROKES = "M16 1.8 V8.4 M16 23.6 V30.2 M1.8 16 H8.4 M23.6 16 H30.2";
const SIGHT = `<path d="${RING}" fill="none" stroke="${PAPER}" stroke-width="4.4" stroke-linecap="round"/>`
  + `<path d="${RING_TAIL}" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>`
  + `<path d="${STROKES}" stroke="${PAPER}" stroke-width="3.8" stroke-linecap="round"/>`
  + `<path d="${RING}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
  + `<path d="${RING_TAIL}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`
  + `<path d="${STROKES}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
  + `<path d="M16 13.2 L18.8 16 L16 18.8 L13.2 16 Z" fill="#b3261e" stroke="${PAPER}" stroke-width=".8" stroke-linejoin="round"/>`;

export const QUILL_CURSOR: CursorScheme = {
  id: "quill",
  name: "羽笔墨迹",
  summary: "羊皮纸羽毛与墨迹笔触，手绘书卷气，适合事件档案与信使面板。",
  accent: "#e8d6b0",
  glyphs: {
    default: { body: DEFS + QUILL, hotspot: [2, 2] },
    pointer: { body: DEFS + QUILL + DROP, hotspot: [2, 2] },
    aim: { body: SIGHT, hotspot: [16, 16] },
  },
};
