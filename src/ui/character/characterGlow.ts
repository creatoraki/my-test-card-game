import { hexToHslTriplet } from "@/ui/common/BorderGlow/borderGlowUtils";

export const CHARACTER_CARD_GLOW = {
  glass: true,
  glassBlur: 20,
  backgroundColor: "rgb(9 19 24 / 0.34)",
  borderRadius: 16,
  glowRadius: 30,
  glowIntensity: 1.08,
  coneSpread: 18,
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

export function characterGlow(hex: string): { glowColor: string; gradientColors: string[] } {
  return {
    glowColor: hexToHslTriplet(hex),
    gradientColors: [hex, mixHex(hex, "#ffffff", 0.24), mixHex(hex, "#071015", 0.34)],
  };
}
