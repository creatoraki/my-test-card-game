import { gearPath } from "./cursorSvg";

// 黄铜机械指针的共用零件；坐标系 viewBox 0 0 32 32。
// 渐变 b 为常态黄铜、d 为按下/压暗黄铜，每个指针文档各自内嵌，互不冲突。
export const INK = "#24160a";
export const BRASS_HIGHLIGHT = "#e7b552";

export const DEFS = `<defs>`
  + `<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#d9a441"/><stop offset="1" stop-color="#7a4b14"/></linearGradient>`
  + `<linearGradient id="d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c779"/><stop offset=".45" stop-color="#a8741f"/><stop offset="1" stop-color="#4f300a"/></linearGradient>`
  + `</defs>`;

export type BrassTone = "b" | "d";

/** 实心箭头 + 左缘高光 + 铆钉，尖端热点 (3, 2)。 */
export const arrow = (tone: BrassTone) =>
  `<path d="M3 2 L3 25 L9 19.6 L13 28.6 L17.2 26.8 L13.3 18 L21 18 Z" fill="url(#${tone})" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
  + `<path d="M4.7 5.6 V20.6" stroke="#fff6d2" stroke-width="1" stroke-linecap="round" opacity="${tone === "b" ? 0.75 : 0.45}"/>`
  + `<circle cx="7.2" cy="15" r="1.25" fill="#3a2410"/><circle cx="6.9" cy="14.7" r=".45" fill="#ffe9a8"/>`;

/** 箭头右下角徽记的圆心。 */
export const BADGE = 24.5;

export const gear = (tone: BrassTone, phase = 0) =>
  `<path d="${gearPath(BADGE, BADGE, 6, 4.4, 8, phase)}" fill="url(#${tone})" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`
  + `<circle cx="${BADGE}" cy="${BADGE}" r="1.6" fill="${INK}"/>`;

/** 先描深色底线再描亮线，保证亮底暗底都可辨。 */
export const outlined = (d: string, width: number, color: string, extra = "") =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 2}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
  + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
