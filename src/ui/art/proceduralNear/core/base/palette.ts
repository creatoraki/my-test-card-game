import type { LightTone, NeonTone } from "../../types";

/** 五阶明暗色阶：所有体块都从同一套色阶取色，保证风格统一。 */
export interface Ramp {
  deep: string;
  dark: string;
  mid: string;
  light: string;
  hi: string;
}

// 冷调科技：钢材统一偏蓝灰，与远景的靛蓝紫大气一致；锈色只作点缀。

/** 枪铁色：主结构钢材。 */
export const STEEL: Ramp = { deep: "#07090f", dark: "#111624", mid: "#1c2336", light: "#2c3650", hi: "#4b5a7e" };
/** 冷银蓝合金：受光面板、罐体、前梁。 */
export const ALLOY: Ramp = { deep: "#0b0f1a", dark: "#1a2133", mid: "#2a3550", light: "#44557a", hi: "#7185b0" };
/** 近黑偏紫的碳纤维 / 涂装件。 */
export const CARBON: Ramp = { deep: "#050509", dark: "#0c0c16", mid: "#151626", light: "#222439", hi: "#393c5c" };
export const CONCRETE: Ramp = { deep: "#0b0d14", dark: "#161a26", mid: "#222838", light: "#333b50", hi: "#4f5870" };
export const OXIDE: Ramp = { deep: "#061014", dark: "#0e1d24", mid: "#183039", light: "#264753", hi: "#3f6a78" };
/** 锈色：只作少量点缀（各建筑抽取概率不超过 15%）。 */
export const RUST: Ramp = { deep: "#150d0b", dark: "#2a1914", mid: "#432820", light: "#5e3a2b", hi: "#80573f" };

// 城市墙面：全部压在冷调里，与远景的靛蓝紫大气一致。
/** 灰紫涂料墙。 */
export const PLASTER: Ramp = { deep: "#0a0b14", dark: "#151726", mid: "#20233a", light: "#2f3350", hi: "#4a4f72" };
/** 青灰小瓷砖。 */
export const TILE: Ramp = { deep: "#081014", dark: "#0f1c24", mid: "#182b36", light: "#243f4c", hi: "#3c6272" };
/** 冷调压暗的红砖。 */
export const BRICK: Ramp = { deep: "#110a10", dark: "#1f1219", mid: "#2e1b25", light: "#422634", hi: "#613a4c" };
/** 写字楼石材。 */
export const STONE: Ramp = { deep: "#0c0e16", dark: "#1a1e2c", mid: "#282e42", light: "#3a4260", hi: "#5a6488" };
/** 深海军蓝涂装（设施外壳）。 */
export const NAVY: Ramp = { deep: "#070b1a", dark: "#0e1630", mid: "#18244a", light: "#253766", hi: "#3f5690" };
/** 暗墨绿涂装（邮筒、回收箱）。 */
export const TEAL: Ramp = { deep: "#04100f", dark: "#0a1f1e", mid: "#123230", light: "#1d4a47", hi: "#2f6e69" };
/** 暗红涂装（消防栓、少量雨棚），只作点缀。 */
export const CRIMSON: Ramp = { deep: "#14060b", dark: "#2a0c16", mid: "#431424", light: "#5f2034", hi: "#86344e" };

/** 雨棚条纹配色：两色交替。 */
export const AWNING_PAIRS: readonly (readonly [string, string])[] = [
  ["#1b2d4a", "#8d9bb8"],
  ["#2a1840", "#7f6fa6"],
  ["#0f3136", "#6f9ca0"],
  ["#3a1426", "#9a7282"],
  ["#1c1f2e", "#6b7288"],
];

/** 抽取时的权重列表：合金 / 枪铁为主，锈色约 1/7。 */
export const HULL_RAMPS: readonly Ramp[] = [ALLOY, STEEL, OXIDE, ALLOY, STEEL, CARBON, RUST];

/** 霓虹偏品红 / 紫，青色留给全息屏与 LED；重复项即权重。 */
export const NEON_TONES: readonly NeonTone[] = ["pink", "violet", "pink", "blue", "cyan", "violet"];

/** core 为灯管芯，glow 为外发光。 */
export const NEON_COLORS: Record<NeonTone, { core: string; glow: string }> = {
  violet: { core: "#f3e2ff", glow: "#a54cff" },
  blue: { core: "#e0eeff", glow: "#3b7dff" },
  pink: { core: "#ffe3f7", glow: "#ff38c8" },
  cyan: { core: "#e6fdff", glow: "#2fd8ff" },
};

/** 暖色壁灯：少量点缀，与冷调形成对比。 */
export const LAMP = { core: "#fff3d2", glow: "#ffa84e", housing: "#1d1a1c" };
/** 冷白 LED 泛光灯。 */
export const FLOOD = { core: "#f2f6ff", glow: "#8fb0ff" };

/** 状态指示灯颜色。 */
export const LED = { cyan: "#5ff0ff", pink: "#ff5ad2", green: "#5dffb4", red: "#ff4a5e", amber: "#ffb347" } as const;
export const LED_COLORS: readonly string[] = [LED.cyan, LED.cyan, LED.green, LED.pink, LED.amber, LED.red];

export const HAZARD = { yellow: "#9c7f34", black: "#111218" };

/** 背后城市打来的冷蓝逆光（边缘光）。 */
export const RIM = "#7c94ff";
export const RIM_HOT = "#c3cfff";

/** 后排与高处的大气色，与远景的靛蓝紫一致。 */
export const FOG_TINT = "#1c2150";
/** 贴地雾：远景底部那层蓝紫薄雾。 */
export const FOG_MIST = "#3d4aa6";
export const AMBIENT_SHADOW = "#04050b";

/** 招牌 / 模板字使用的漆色（冷白）。 */
export const PAINT = { chalk: "#c9d2e6", faded: "#8e97ad" };

export function lightGlow(tone: LightTone): string {
  if (tone === "warm") return LAMP.glow;
  if (tone === "white") return FLOOD.glow;
  return NEON_COLORS[tone].glow;
}

export function lightCore(tone: LightTone): string {
  if (tone === "warm") return LAMP.core;
  if (tone === "white") return FLOOD.core;
  return NEON_COLORS[tone].core;
}

/** "#rrggbb" + 透明度 → rgba 字符串。 */
export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, alpha))})`;
}
