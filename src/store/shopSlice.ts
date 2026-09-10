import {
  isShopTechAvailable,
  SHOP_TECHS,
  shopLevelOf,
  shopRefreshCost,
} from "@/data/shopTech";
import type { ShopSlot } from "@/data/shop";
import { techCostCheck } from "@/data/techCost";
import { makeItemStack } from "@/data";
import { consumeItems } from "@/items/inventory";
import type { CharacterState, TownStore } from "./townStore";
import { addCardToDeck } from "./deckCards";
import { rollShopStock } from "./shopStock";

export interface ShopState {
  level: number;
  techs: string[];
  day: number;
  refreshes: number;
  slots: ShopSlot[];
}

export function freshShop(
  day: number,
  characters: Record<string, CharacterState>,
  awakened: string[],
): ShopState {
  const techs: string[] = [];
  const level = shopLevelOf(techs);
  return {
    level,
    techs,
    day,
    refreshes: 0,
    slots: rollShopStock(characters, awakened, techs, level),
  };
}

export interface ShopSlice {
  refreshShop: () => void;
  buyShopSlot: (key: string) => void;
  upgradeShop: (techId: string) => void;
}

export function createShopSlice(
  set: (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void,
  get: () => TownStore,
): ShopSlice {
  return {
    refreshShop: () => {
      const { shop, loot, characters, awakened } = get();
      const cost = shopRefreshCost(shop.techs, shop.refreshes);
      if (loot < cost) return;

      set({
        loot: loot - cost,
        shop: {
          ...shop,
          refreshes: shop.refreshes + 1,
          slots: rollShopStock(characters, awakened, shop.techs, shop.level),
        },
      });
    },

    buyShopSlot: (key) => {
      const { shop, loot, characters, storage } = get();
      const slot = shop.slots.find((entry) => entry.key === key);
      if (!slot || slot.sold || loot < slot.price) return;

      const nextSlots = shop.slots.map((entry) =>
        entry.key === key ? { ...entry, sold: true } : entry,
      );
      if (slot.kind === "card") {
        const character = characters[slot.charId];
        if (!character) return;
        const nextCharacter = { ...character, deck: [...character.deck] };
        if (!addCardToDeck(nextCharacter, slot.cardDefId)) return;
        set({
          loot: loot - slot.price,
          characters: { ...characters, [slot.charId]: nextCharacter },
          shop: { ...shop, slots: nextSlots },
        });
        return;
      }

      set({
        loot: loot - slot.price,
        storage: [
          ...storage,
          makeItemStack(slot.itemId, 1, { affinity: slot.affinity, roll: slot.roll }),
        ],
        shop: { ...shop, slots: nextSlots },
      });
    },

    upgradeShop: (techId) => {
      const { shop, loot, storage } = get();
      const tech = SHOP_TECHS.find((entry) => entry.id === techId);
      if (!tech || !isShopTechAvailable(tech, shop.techs)) return;
      if (!techCostCheck(tech, loot, storage).ok) return;

      const nextStorage = tech.materials.reduce(
        (current, material) => consumeItems(current, material.itemId, material.count),
        storage,
      );
      const techs = [...shop.techs, tech.id];
      set({
        loot: loot - tech.loot,
        storage: nextStorage,
        shop: {
          ...shop,
          techs,
          level: shopLevelOf(techs),
        },
      });
    },
  };
}
