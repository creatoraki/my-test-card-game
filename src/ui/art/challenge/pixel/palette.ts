// 像素图标共享色板: 每个色相 4 阶(hi 高光 / base 本色 / lo 暗面 / dk 最暗)。
// 主色取 Claude CLI 吉祥物的珊瑚橙, 其余色相按挑战语义取用。

export interface Ramp {
  hi: string;
  base: string;
  lo: string;
  dk: string;
}

export const INK = "#1b1319";

export const CORAL: Ramp = { hi: "#f7b395", base: "#d77757", lo: "#ad5439", dk: "#6f3223" };
export const CREAM: Ramp = { hi: "#fffbf2", base: "#efe5d3", lo: "#c7b69c", dk: "#8b7a64" };
export const GOLD: Ramp = { hi: "#fff0a8", base: "#f4c24c", lo: "#cf8a2a", dk: "#8c561a" };
export const TEAL: Ramp = { hi: "#b3f5ea", base: "#48c9b7", lo: "#258a80", dk: "#15514d" };
export const SKY: Ramp = { hi: "#c3e2ff", base: "#62a3f0", lo: "#3868c0", dk: "#233f7d" };
export const VIOLET: Ramp = { hi: "#e5caff", base: "#a67ae8", lo: "#6f49b3", dk: "#422a74" };
export const RED: Ramp = { hi: "#ffa3a0", base: "#e5484d", lo: "#ab2b37", dk: "#681a26" };
export const GREEN: Ramp = { hi: "#cdf7a0", base: "#72cf5c", lo: "#3f9443", dk: "#245a2c" };
export const STEEL: Ramp = { hi: "#eef2f7", base: "#a5b1c0", lo: "#6c7889", dk: "#3e4656" };
export const PINK: Ramp = { hi: "#ffd3e2", base: "#f28bb0", lo: "#c45a82", dk: "#7c3352" };
