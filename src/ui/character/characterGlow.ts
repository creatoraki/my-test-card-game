import type { BorderGlowProps } from "@/ui/common/BorderGlow";
import { hexToHslTriplet } from "@/ui/common/BorderGlow/borderGlowUtils";

export const CHARACTER_CARD_GLOW = {
  glass: true,
  glassBlur: 13,
  backgroundColor: "rgb(9 19 24 / 0.16)",
  borderRadius: 16,
  glowRadius: 30,
  glowIntensity: 1.08,
  coneSpread: 18,
  fill: true,
} as const;

function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  if (!/^[\da-f]{6}$/i.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixHex(hex: string, target: string, amount: number): string {
  const sourceRgb = hexToRgb(hex) ?? [128, 128, 128];
  const targetRgb = hexToRgb(target) ?? [0, 0, 0];
  const channels = sourceRgb.map((channel, index) => Math.round(channel + (targetRgb[index] - channel) * amount));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * 由角色色派生出 BorderGlow 的两项配色。
 *
 * ⚠⚠ 返回类型刻意锁成 BorderGlowProps 的子集, 键名必须与 BorderGlow 的 prop **逐字相同** ——
 *   使用方全都是 `<BorderGlow {...characterGlow(color)} />` 这样展开的, 而 JSX 的展开语法
 *   **不做多余属性检查**: 键名一旦对不上(比如曾经叫 gradientColors 而 prop 叫 colors),
 *   TS 一声不吭, BorderGlow 静静落回默认的紫/粉/天蓝三色 —— 满屏卡片都是同一道"极光",
 *   而不是各自的角色色。Required<Pick<>> 让这类错配变成编译错误
 *   (Required 是必要的: BorderGlowProps 里这两项都是可选的, 只用 Pick 会把可选性带出来)。
 */
export function characterGlow(hex: string): Required<Pick<BorderGlowProps, "glowColor" | "colors">> {
  return {
    glowColor: hexToHslTriplet(hex),
    colors: [hex, mixHex(hex, "#ffffff", 0.24), mixHex(hex, "#071015", 0.34)],
  };
}
