// 统一商店货架生成。卡牌货位在这里生成，因为它需要读取角色卡组；物品货位则
// 委托 data/shop.ts，保证装备模型、羁绊和物品价格只在数据层维护。

import {
  CARD_SHOP_PRICE,
  shopSlotCount,
} from "@/data/shopTech";
import {
  pickShopKind,
  rollShopItemSlot,
  type ShopCardSlot,
  type ShopItemKind,
  type ShopItemSlot,
  type ShopSlot,
} from "@/data/shop";
import type { CharacterState } from "./townStore";
import { availablePools, rollRarity } from "./deckCards";

function randomIndex(length: number, rand: () => number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(rand() * length)));
}

function rollCardSlot(
  candidates: CharacterState[],
  used: Set<string>,
  rand: () => number,
): ShopCardSlot | null {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const character = candidates[randomIndex(candidates.length, rand)];
    const pools = availablePools(character);
    const rarity = rollRarity(character.deckLevel, pools, rand);
    const pool = pools[rarity];
    if (!pool.length) continue;

    const cardDefId = pool[randomIndex(pool.length, rand)];
    const uniqueKey = `${character.charId}:${cardDefId}`;
    if (used.has(uniqueKey)) continue;

    used.add(uniqueKey);
    return {
      kind: "card",
      key: "",
      charId: character.charId,
      cardDefId,
      rarity,
      price: CARD_SHOP_PRICE[rarity],
      sold: false,
    };
  }
  return null;
}

function pickFallbackItemKind(rand: () => number): ShopItemKind {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const kind = pickShopKind(rand);
    if (kind !== "card") return kind;
  }
  return "equipment";
}

function rollItemSlot(
  kind: ShopItemKind,
  level: number,
  used: Set<string>,
  rand: () => number,
): ShopItemSlot | null {
  return rollShopItemSlot(kind, level, used, rand);
}

export function rollShopStock(
  characters: Record<string, CharacterState>,
  awakened: string[],
  techs: string[],
  level: number,
  rand: () => number = Math.random,
): ShopSlot[] {
  const candidates = awakened
    .map((charId) => characters[charId])
    .filter((character): character is CharacterState => Boolean(character));
  const cardUsed = new Set<string>();
  const itemUsed = new Set<string>();
  const slots: ShopSlot[] = [];

  for (let index = 0; index < shopSlotCount(techs); index += 1) {
    const kind = pickShopKind(rand);
    let slot: ShopSlot | null = null;
    if (kind === "card" && candidates.length) {
      slot = rollCardSlot(candidates, cardUsed, rand);
    }
    if (!slot) {
      const itemKind = kind === "card" ? pickFallbackItemKind(rand) : kind;
      slot = rollItemSlot(itemKind, level, itemUsed, rand);
    }
    if (slot) slots.push({ ...slot, key: `sl-${index}` });
  }

  return slots;
}
