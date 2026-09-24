// 暮色生态方舟主调色板。所有绘制模块只从这里取色阶，按索引由暗到亮排列，保证画风统一。
// 光照约定：主光为左上方暮光（暖色边缘光），局部光源为生物青光与暖色灯。

export type Ramp = readonly string[];

export const RAMPS = {
  /** 深渊/墨色：描边、最暗阴影、剪影。 */
  ink: ["#05060c", "#0a0c16", "#121525", "#1b1f33"],
  /** 天空自顶向地平线：靛蓝 → 紫 → 玫红 → 琥珀。 */
  sky: ["#10122b", "#191c3d", "#262750", "#3a3263", "#553c73", "#7a4878", "#a45876", "#cc6e70", "#e8906c", "#f6b778"],
  cloud: ["#2c2548", "#4a3560", "#734870", "#a45d74", "#d98474", "#f7b88a"],
  stone: ["#141722", "#1f2433", "#2d3446", "#3f495d", "#586579", "#7a8799", "#a3adba"],
  /** 方舟建筑的象牙石材。 */
  ivory: ["#231f2a", "#3a3442", "#58515e", "#7d7680", "#a59ea2", "#cbc3bf", "#e9e0d4"],
  moss: ["#101d17", "#17301f", "#214827", "#35652f", "#528640", "#7aa84f", "#abcf67"],
  leaf: ["#0b1717", "#112523", "#18382f", "#21503a", "#2f6c44", "#4a8c50", "#78b161"],
  bark: ["#140d10", "#221619", "#342224", "#4a322e", "#654539", "#855e48"],
  metal: ["#0b141a", "#122027", "#1b2f37", "#27434a", "#375b5f", "#517b79", "#7ea39c"],
  brass: ["#1f110c", "#3a2012", "#5f351a", "#8c5427", "#b97a38", "#e0a956", "#ffd98c"],
  glass: ["#16223a", "#223756", "#325473", "#4a7890", "#76a8b4"],
  bio: ["#0c3a42", "#12636b", "#1f9ba0", "#3fd3cd", "#8ef5e4", "#e0fff6"],
  lamp: ["#4a1d10", "#8c3a16", "#d7661f", "#f7a23a", "#ffd572", "#fff4c4"],
  water: ["#162c4a", "#21496a", "#326f8c", "#5aa0b4", "#98d4dc", "#e2fbff"],
  flowerPink: ["#4a1a34", "#8a2e52", "#c8506e", "#ee8098", "#ffc0c8"],
  flowerGold: ["#4a2a10", "#8a561a", "#cc8a26", "#f2c048", "#fff0a0"],
} as const satisfies Record<string, Ramp>;

export type RampName = keyof typeof RAMPS;

/** 各视差层对应的暮色雾：越远越接近地平线的紫红雾色。 */
export const FOG = {
  dome: "#7a5a86",
  tower: "#4c3d68",
  island: "#2e2a4c",
  deep: "#1a1830",
} as const;

/** 暖色边缘光（左上方暮光）。 */
export const RIM_LIGHT = "#ffc48a";

function toRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** 两色线性混合，t=0 为 a，t=1 为 b。 */
export function mixHex(a: string, b: string, t: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return toHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t);
}

/** 大气透视：整条色阶向雾色混合，暗部混合更多以压低对比度。 */
export function fogRamp(ramp: Ramp, amount: number, fog: string): Ramp {
  const last = ramp.length - 1;
  return ramp.map((color, i) => mixHex(color, fog, Math.min(1, amount * (1.15 - (i / last) * 0.3))));
}
