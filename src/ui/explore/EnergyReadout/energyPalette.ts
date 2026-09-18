// 净化粒子读数卡的档位配色 —— 全部取样自设计图(净化粒子.png)对应卡片的实际像素。
// main 与 ENERGY_TIERS.color 一致(见 explore/rules.ts)。

import { energyTier } from "@/explore/session";

export interface EnergyPalette {
  /** 液体主色(饱和)。 */
  main: string;
  /** 液体亮部。 */
  light: string;
  /** 液体最亮的中段。 */
  pale: string;
  /** 液体暗部。 */
  deep: string;
  /** 液体右缘的回光。 */
  rim: string;
  /** 大号数字。 */
  number: string;
  /** 能量条: 左端 → 中段 → 右端。 */
  bar: [string, string, string];
  /** 面板描边: 最亮的细线 / 外圈色带 / 外发光。 */
  edge: string;
  band: string;
  glow: string;
  /** 面板底色: 上 / 中 / 下。 */
  fill: [string, string, string];
}

const PALETTES: Record<number, EnergyPalette> = {
  1: {
    main: "#31fa67", light: "#7dfb8a", pale: "#a4fdae", deep: "#17b83c", rim: "#75fda7",
    number: "#c3f78d",
    bar: ["#95f763", "#affb9f", "#cbfdc9"],
    edge: "#a6e6d6", band: "#176856", glow: "#2b7a62",
    fill: ["#1a4042", "#122e30", "#1b4b3f"],
  },
  2: {
    main: "#fcd50a", light: "#fde35a", pale: "#fef3a0", deep: "#f0b000", rim: "#fbf4a6",
    number: "#ffff74",
    bar: ["#fce02d", "#fdf866", "#fcf98a"],
    edge: "#f5e36e", band: "#816f30", glow: "#8a7a3a",
    fill: ["#393e36", "#2b2d27", "#48452a"],
  },
  3: {
    main: "#0888fc", light: "#50eafd", pale: "#87f7fd", deep: "#096cfa", rim: "#5facf3",
    number: "#96f9fd",
    bar: ["#39dffd", "#80f9ff", "#a8fbfd"],
    edge: "#b4e7ff", band: "#11519a", glow: "#2e5a99",
    fill: ["#213a55", "#1a2b3f", "#163f65"],
  },
  4: {
    main: "#df46fc", light: "#ea79fa", pale: "#f5b0fd", deep: "#a408f9", rim: "#d945fb",
    number: "#ffa7ff",
    bar: ["#ea56fc", "#fca4fd", "#fbc0fb"],
    edge: "#e9a0f8", band: "#731aab", glow: "#7a3aa8",
    fill: ["#302c4e", "#24213b", "#38275a"],
  },
  5: {
    main: "#fd0531", light: "#fa68a5", pale: "#fb9cc0", deep: "#e51323", rim: "#fd4678",
    number: "#f9a8a4",
    bar: ["#fc515c", "#ff9994", "#fcbab0"],
    edge: "#eab0b5", band: "#8f0112", glow: "#a02a3a",
    fill: ["#3a232b", "#2f1e26", "#522831"],
  },
};

export function energyPalette(energy: number): EnergyPalette {
  return PALETTES[energyTier(energy).tier] ?? PALETTES[5];
}
