import { RAMPS } from "../../core/palette";
import { parseGrid, type GridPalette, type PixelGrid } from "../../core/spriteGrid";

// 主角像素部件（全部朝右绘制）：银发、黑色宽松夹克配白色内衬、青色饰物、深色长袜与黑白厚底靴。
// 头部、躯干、靴子为手绘字符网格；四肢与长发由骨骼实时光栅化。

export const HERO_RAMPS = {
  hair: ["#34344c", "#62647e", "#9ca0b8", "#cdd1e2", "#f2f3fa"],
  skin: ["#6a3a3a", "#c67e6c", "#f1b99d", "#ffdcc5", "#fff1e4"],
  jacket: ["#0b0c12", "#15161e", "#22242e", "#343745", "#4c5061"],
  white: ["#6c7284", "#a9b0bf", "#dde1e9", "#f6f7fa"],
  stocking: ["#101118", "#1c1e27", "#2a2d39", "#3b3f4e"],
  iris: ["#1a2c38", "#2e5c68", "#4db1b1", "#98e6de"],
} as const;

const H = HERO_RAMPS;

const HEAD_PALETTE: GridPalette = {
  H: H.hair[3], h: H.hair[2], L: H.hair[4], d: H.hair[1],
  S: H.skin[3], s: H.skin[2],
  K: "#2a1c26", E: H.iris[0], e: H.iris[2], W: "#ffffff",
  B: "#f08c8c", k: "#8a4a4a",
  C: RAMPS.bio[3],
};

const HEAD_ROWS = [
  "..........hH......",
  "......hHHHh.......",
  "....hHHLLLHHh.....",
  "...hHHLLLHHHHHh...",
  "..hHHLLHHHHHHHHh..",
  ".hHHHHHHHHHHHHHHh.",
  ".hHCHHHHHHHHHHHHHh",
  "hHCWCHHHhHHHHhHHHh",
  "hHHCHHHhShHHhSShHh",
  "hHHHHHhSSShHSSSShh",
  "dHHHHhSSKKKSSSKKSh",
  "dHHHhSSSWEESSSWESs",
  "dhHHhSSSeeeSSSeeSs",
  "dhHHhsSSSSSSSSSSs.",
  "dhHhhsSBBSSSSkSBs.",
  ".dhHhssSSSSSSSSs..",
  ".dhHh.ssSSSSSSs...",
  "..dhh...ssss......",
];

/** 眨眼帧：睫毛行变回皮肤，眼睛行变成一条闭合的眼线，下眼行变回皮肤。 */
const BLINK_ROWS = HEAD_ROWS.map((row, y) => {
  if (y === 10) return row.replace(/K/g, "S");
  if (y === 11) return row.replace(/[WE]/g, "K");
  if (y === 12) return row.replace(/e/g, "S");
  return row;
});

const TORSO_PALETTE: GridPalette = {
  J: H.jacket[2], j: H.jacket[1], k: H.jacket[0], G: H.jacket[3],
  T: H.white[3], t: H.white[1],
  C: RAMPS.bio[3],
};

const TORSO_ROWS = [
  "...jJJJJ....",
  "..jJGGJJTT..",
  ".jJGJJJJTTt.",
  ".jJJJJJCTTt.",
  "jjJJJJJCTTt.",
  "jJJJJJJCTtt.",
  "jJJJJJJCTtt.",
  "jJJJJJJCtTt.",
  "jjJJJJJCTTtj",
  "kjJJJJJJJJJj",
  "kTTTTTTTTTTk",
  "kjjJJJJJJJjk",
  ".kkjjjjjjkk.",
];

const BOOT_PALETTE: GridPalette = {
  B: H.jacket[1], W: H.white[2], T: H.white[3], t: H.white[1],
};

const BOOT_ROWS = [
  "BBBB...",
  "BWWBBB.",
  "BBBBBBB",
  "tTTTTTt",
];

export interface HeroGrids {
  head: PixelGrid;
  blink: PixelGrid;
  torso: PixelGrid;
  boot: PixelGrid;
}

let grids: HeroGrids | undefined;

/** 锚点：头部为下巴下方的脖颈点，躯干为下摆中心(髋部)，靴子为脚踝。 */
export function heroGrids(): HeroGrids {
  grids ??= {
    head: parseGrid(HEAD_ROWS, HEAD_PALETTE, 10, 17),
    blink: parseGrid(BLINK_ROWS, HEAD_PALETTE, 10, 17),
    torso: parseGrid(TORSO_ROWS, TORSO_PALETTE, 6, 12),
    boot: parseGrid(BOOT_ROWS, BOOT_PALETTE, 2, 0),
  };
  return grids;
}
