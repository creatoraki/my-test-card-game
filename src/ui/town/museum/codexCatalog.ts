import { CARD_DEFS, CHARACTERS, ENEMIES, ITEM_DEFS, makeCard, makeItemStack } from "@/data";
import { BOSS_ENEMIES, ELITE_ENEMIES, MINION_ENEMIES } from "@/data/enemies";
import type { Card, CardDef, EnemyDef } from "@/engine";
import type { CodexState } from "@/store/townStore";
import { RARITY_ORDER, type ItemDef, type ItemStack } from "@/items/types";
import { ITEM_TABS } from "@/ui/common/item/itemFilters";

export { ENEMIES };

const CATEGORY_ORDER = new Map(ITEM_TABS.map((tab, index) => [tab.id, index]));
const CARD_RARITY_ORDER: Record<string, number> = { basic: 0, common: 1, uncommon: 2, rare: 3 };

export const ITEM_CATALOG: ItemDef[] = [...ITEM_DEFS].sort((leftItem, rightItem) => {
  const category = (CATEGORY_ORDER.get(leftItem.category) ?? 99) - (CATEGORY_ORDER.get(rightItem.category) ?? 99);
  if (category !== 0) return category;
  const rarity = RARITY_ORDER.indexOf(leftItem.rarity) - RARITY_ORDER.indexOf(rightItem.rarity);
  return rarity || leftItem.name.localeCompare(rightItem.name, "zh-CN");
});

export const CARD_CATALOG: CardDef[] = [...CARD_DEFS]
  .filter((def) => !def.temporary)
  .sort((leftCard, rightCard) => {
    const owner = leftCard.ownerCharId.localeCompare(rightCard.ownerCharId);
    if (owner !== 0) return owner;
    const rarity = (CARD_RARITY_ORDER[leftCard.rarity ?? "common"] ?? 1) - (CARD_RARITY_ORDER[rightCard.rarity ?? "common"] ?? 1);
    return rarity || leftCard.cost - rightCard.cost || leftCard.name.localeCompare(rightCard.name, "zh-CN");
  });

export const CARD_RARITY_LABEL: Record<string, string> = {
  basic: "基础",
  common: "普通",
  uncommon: "罕见",
  rare: "稀有",
};

export interface CardGroup {
  id: string;
  name: string;
  color: string;
  cards: CardDef[];
}

export const CARD_GROUPS: CardGroup[] = CHARACTERS
  .map((character) => ({
    id: character.id,
    name: character.name,
    color: character.color,
    cards: CARD_CATALOG.filter((card) => card.ownerCharId === character.id),
  }))
  .filter((group) => group.cards.length > 0);

export type EnemyTier = "minions" | "elites" | "boss";

export interface EnemyGroup {
  id: EnemyTier;
  name: string;
  enemies: EnemyDef[];
}

export const ENEMY_GROUPS: EnemyGroup[] = [
  { id: "minions", name: "普通敌人", enemies: MINION_ENEMIES },
  { id: "elites", name: "精英敌人", enemies: ELITE_ENEMIES },
  { id: "boss", name: "首领敌人", enemies: BOSS_ENEMIES },
];

const ITEM_STACK_CACHE = new Map<string, ItemStack>();
const CARD_CACHE = new Map<string, Card>();

export function itemStackFor(defId: string): ItemStack {
  const cached = ITEM_STACK_CACHE.get(defId);
  if (cached) return cached;
  const stack = makeItemStack(defId);
  ITEM_STACK_CACHE.set(defId, stack);
  return stack;
}

export function cardFor(defId: string): Card {
  const cached = CARD_CACHE.get(defId);
  if (cached) return cached;
  const card = makeCard(defId);
  CARD_CACHE.set(defId, card);
  return card;
}

export const ITEM_CATALOG_STACKS = ITEM_CATALOG.map((def) => itemStackFor(def.id));

export interface CodexCount {
  unlocked: number;
  total: number;
}

export interface CodexProgress {
  items: CodexCount;
  cards: CodexCount;
  enemies: CodexCount;
  unlocked: number;
  total: number;
}

export function codexProgress(codex: CodexState): CodexProgress {
  const items = { unlocked: codex.items.length, total: ITEM_CATALOG.length };
  const cards = { unlocked: codex.cards.length, total: CARD_CATALOG.length };
  const enemies = { unlocked: codex.enemies.length, total: ENEMIES.length };
  return {
    items,
    cards,
    enemies,
    unlocked: items.unlocked + cards.unlocked + enemies.unlocked,
    total: items.total + cards.total + enemies.total,
  };
}
