import type { Rarity } from "@/engine";

export const CARD_SHOP_PRICE: Record<Rarity, number> = {
  common: 150,
  uncommon: 300,
  rare: 1000,
};

export interface CardShopLevel {
  slotCount: number;
  refreshBase: number;
  refreshStep: number;
}

export const CARD_SHOP_LEVELS: Record<number, CardShopLevel> = {
  1: { slotCount: 6, refreshBase: 100, refreshStep: 100 },
  2: { slotCount: 7, refreshBase: 100, refreshStep: 100 },
  3: { slotCount: 7, refreshBase: 90, refreshStep: 90 },
  4: { slotCount: 8, refreshBase: 90, refreshStep: 90 },
  5: { slotCount: 8, refreshBase: 80, refreshStep: 80 },
};

export const CARD_SHOP_MAX_LEVEL = 5;

export interface CardShopTech {
  id: string;
  tier: number;
  name: string;
  desc: string;
  loot: number;
  materials: { itemId: string; count: number }[];
}

export const CARD_SHOP_TECHS: CardShopTech[] = [
  {
    id: "slot-1",
    tier: 1,
    name: "展柜扩容 I",
    desc: "槽位 6 → 7",
    loot: 400,
    materials: [{ itemId: "green-crystal", count: 3 }],
  },
  {
    id: "refresh-1",
    tier: 2,
    name: "补货链路优化 I",
    desc: "刷新价 100 → 90",
    loot: 900,
    materials: [
      { itemId: "green-crystal", count: 5 },
      { itemId: "blue-crystal", count: 3 },
    ],
  },
  {
    id: "slot-2",
    tier: 3,
    name: "展柜扩容 II",
    desc: "槽位 7 → 8",
    loot: 1600,
    materials: [
      { itemId: "green-crystal", count: 8 },
      { itemId: "blue-crystal", count: 5 },
      { itemId: "red-crystal", count: 2 },
    ],
  },
  {
    id: "refresh-2",
    tier: 4,
    name: "补货链路优化 II",
    desc: "刷新价 90 → 80",
    loot: 2600,
    materials: [
      { itemId: "blue-crystal", count: 8 },
      { itemId: "red-crystal", count: 4 },
    ],
  },
];

export const cardShopLevel = (level: number): CardShopLevel =>
  CARD_SHOP_LEVELS[level] ?? CARD_SHOP_LEVELS[1];

export const cardShopRefreshCost = (level: number, refreshes: number): number => {
  const config = cardShopLevel(level);
  return config.refreshBase + Math.max(0, refreshes) * config.refreshStep;
};

export function cardShopTechsOfTier(level: number): CardShopTech[] {
  return CARD_SHOP_TECHS.filter((tech) => tech.tier === level);
}

export function cardShopLevelOf(doneTechs: string[]): number {
  return Math.min(CARD_SHOP_MAX_LEVEL, doneTechs.length + 1);
}

export function isCardShopTechAvailable(tech: CardShopTech, done: string[]): boolean {
  return tech.tier === cardShopLevelOf(done) && !done.includes(tech.id);
}
