import { CHARACTERS } from "@/data/characters";
import { RULES } from "@/engine/rules";
import { hexToHslTriplet } from "@/ui/common/BorderGlow/borderGlowUtils";

export interface CharacterCardData {
  id: string;
  name: string;
  emoji: string;
  glowColor: string;
  gradientColors: string[];
}

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

function gradientColors(color: string): string[] {
  return [color, mixHex(color, "#ffffff", 0.24), mixHex(color, "#071015", 0.34)];
}

export const CHARACTER_CARDS: CharacterCardData[] = CHARACTERS.map((character) => ({
  id: character.id,
  name: character.name,
  emoji: character.emoji,
  glowColor: hexToHslTriplet(character.color),
  gradientColors: gradientColors(character.color),
}));

export const PARTY_LIMIT = RULES.progression.partySize;
export const DEFAULT_PARTY = CHARACTER_CARDS.slice(0, PARTY_LIMIT).map((character) => character.id);