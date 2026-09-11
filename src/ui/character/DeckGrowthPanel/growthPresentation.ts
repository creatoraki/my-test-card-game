import type { Rarity } from "@/engine";

export const GROWTH_RARITIES: { id: Rarity; label: string }[] = [
  { id: "common", label: "普通" },
  { id: "uncommon", label: "罕见" },
  { id: "rare", label: "稀有" },
];

export const percentage = (value: number) => `${Math.round(value * 10) / 10}%`;
