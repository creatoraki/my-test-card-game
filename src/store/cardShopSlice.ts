import type { Rarity } from "@/engine";
import {
  CARD_SHOP_PRICE,
  CARD_SHOP_TECHS,
  cardShopLevel,
  cardShopLevelOf,
  cardShopRefreshCost,
  isCardShopTechAvailable,
} from "@/data/cardShop";
import { techCostCheck } from "@/data/techCost";
import { consumeItems } from "@/items/inventory";
import type { CharacterState, TownStore } from "./townStore";
import {
  addCardToDeck,
  availablePools,
  rollRarity,
} from "./deckCards";

export interface CardShopSlot {
  key: string;
  charId: string;
  cardDefId: string;
  rarity: Rarity;
  price: number;
  sold: boolean;
}

export interface CardShopState {
  techs: string[];
  day: number;
  refreshes: number;
  slots: CardShopSlot[];
}

function randomIndex(length: number, rand: () => number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(rand() * length)));
}

export function rollCardShopStock(
  characters: Record<string, CharacterState>,
  awakened: string[],
  level: number,
  rand = Math.random,
): CardShopSlot[] {
  const candidates = awakened
    .map((charId) => characters[charId])
    .filter((character): character is CharacterState => Boolean(character));
  if (!candidates.length) return [];

  const slotCount = cardShopLevel(level).slotCount;
  const used = new Set<string>();
  const slots: CardShopSlot[] = [];

  for (let index = 0; index < slotCount; index += 1) {
    let picked: CardShopSlot | null = null;
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
      picked = {
        key: `cs-${slots.length}`,
        charId: character.charId,
        cardDefId,
        rarity,
        price: CARD_SHOP_PRICE[rarity],
        sold: false,
      };
      break;
    }
    if (picked) slots.push(picked);
  }

  return slots;
}

export function freshCardShop(
  day: number,
  characters: Record<string, CharacterState>,
  awakened: string[],
): CardShopState {
  return {
    techs: [],
    day,
    refreshes: 0,
    slots: rollCardShopStock(characters, awakened, 1),
  };
}

export interface CardShopSlice {
  refreshCardShop: () => void;
  buyCardShopCard: (key: string) => void;
  upgradeCardShop: (techId: string) => void;
}

export function createCardShopSlice(
  set: (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void,
  get: () => TownStore,
): CardShopSlice {
  return {
    refreshCardShop: () => {
      const { cardShop, loot, characters, awakened } = get();
      const level = cardShopLevelOf(cardShop.techs);
      const cost = cardShopRefreshCost(level, cardShop.refreshes);
      if (loot < cost) return;

      set({
        loot: loot - cost,
        cardShop: {
          ...cardShop,
          refreshes: cardShop.refreshes + 1,
          slots: rollCardShopStock(characters, awakened, level),
        },
      });
    },

    buyCardShopCard: (key) => {
      const { cardShop, loot, characters } = get();
      const slot = cardShop.slots.find((entry) => entry.key === key);
      const character = slot ? characters[slot.charId] : null;
      if (!slot || slot.sold || !character || loot < slot.price) return;

      const nextCharacter = { ...character, deck: [...character.deck] };
      if (!addCardToDeck(nextCharacter, slot.cardDefId)) return;

      set({
        loot: loot - slot.price,
        characters: { ...characters, [slot.charId]: nextCharacter },
        cardShop: {
          ...cardShop,
          slots: cardShop.slots.map((entry) =>
            entry.key === key ? { ...entry, sold: true } : entry,
          ),
        },
      });
    },

    upgradeCardShop: (techId) => {
      const { cardShop, loot, storage } = get();
      const tech = CARD_SHOP_TECHS.find((entry) => entry.id === techId);
      if (!tech || !isCardShopTechAvailable(tech, cardShop.techs)) return;
      if (!techCostCheck(tech, loot, storage).ok) return;

      const nextStorage = tech.materials.reduce(
        (current, material) => consumeItems(current, material.itemId, material.count),
        storage,
      );
      set({
        loot: loot - tech.loot,
        storage: nextStorage,
        cardShop: { ...cardShop, techs: [...cardShop.techs, tech.id] },
      });
    },
  };
}
