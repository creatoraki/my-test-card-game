// 卡组锻造 —— 经验的唯一去处: 升卡组等级 / 抽卡 / 删卡 / 降低最小卡组下限, 外加装备羁绊重铸。

import {
  RULES,
  deckUpgradeCost,
  drawCostToday,
  lowerMinSizeCost,
  removeCostToday,
} from "../engine";
import { bondPool, getCharacter } from "../data";
import { addCardToDeck, availablePools, rollRarity } from "./deckCards";
import type { CharacterState, TownGet, TownSet, TownStore } from "./townTypes";

export type DeckForgeSlice = Pick<
  TownStore,
  | "upgradeDeck"
  | "forgeDraw"
  | "cancelDraw"
  | "grantFreeDraw"
  | "pickDraw"
  | "rollPartyDrawOffers"
  | "pickPartyDraw"
  | "removeCard"
  | "removeCardFree"
  | "reforgeEquipped"
  | "lowerMinDeck"
>;

function rollDrawOptions(cs: CharacterState): string[] | null {
  const pools = availablePools(cs);
  const rarity = rollRarity(cs.deckLevel, pools, Math.random);
  const pool = pools[rarity];
  if (!pool.length) return null;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(RULES.deck.drawChoices, shuffled.length));
}

function rollPartyDrawOption(cs: CharacterState): string | null {
  const pools = availablePools(cs);
  const rarity = rollRarity(cs.deckLevel, pools, Math.random);
  const pool = pools[rarity];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function cardBelongsToCharacter(cs: CharacterState, cardDefId: string): boolean {
  return Object.values(getCharacter(cs.charId).pools).some((pool) => pool.includes(cardDefId));
}

// 取该角色今日的锻造用量; 跨日自动归零(懒重置, 不依赖 advanceDay)。
function todayUsage(cs: CharacterState, day: number): { draw: number; remove: number } {
  if (cs.forgeDay !== day) return { draw: 0, remove: 0 };
  return { draw: cs.drawUsedToday, remove: cs.removeUsedToday };
}

export function deckForgeCosts(cs: CharacterState, day: number): {
  draw: number;
  remove: number;
  upgrade: number | null;
} {
  const usage = todayUsage(cs, day);
  return {
    draw: drawCostToday(usage.draw),
    remove: removeCostToday(usage.remove),
    upgrade: deckUpgradeCost(cs.deckLevel),
  };
}

export function createDeckForgeSlice(set: TownSet, get: TownGet): DeckForgeSlice {
  // 只替换一名角色的档案。
  const putCharacter = (charId: string, next: CharacterState) =>
    set({ characters: { ...get().characters, [charId]: next } });

  return {
    upgradeDeck: (charId) => {
      const cs = get().characters[charId];
      if (!cs) return;
      const cost = deckUpgradeCost(cs.deckLevel);
      if (cost == null || cs.exp < cost) return;
      putCharacter(charId, { ...cs, exp: cs.exp - cost, deckLevel: cs.deckLevel + 1 });
    },

    forgeDraw: (charId) => {
      const cs = get().characters[charId];
      const { day } = get();
      if (!cs) return;
      const usage = todayUsage(cs, day);
      const cost = drawCostToday(usage.draw);
      if (cs.pendingDraw || cs.exp < cost) return;

      const options = rollDrawOptions(cs);
      if (!options) return;
      putCharacter(charId, {
        ...cs,
        exp: cs.exp - cost,
        pendingDraw: options,
        forgeDay: day,
        drawUsedToday: usage.draw + 1,
        removeUsedToday: usage.remove,
      });
    },

    cancelDraw: (charId) => {
      const cs = get().characters[charId];
      if (!cs?.pendingDraw) return;
      putCharacter(charId, { ...cs, pendingDraw: null });
    },

    grantFreeDraw: (charId) => {
      const cs = get().characters[charId];
      if (!cs || cs.pendingDraw) return;
      const options = rollDrawOptions(cs);
      if (!options) return;
      putCharacter(charId, { ...cs, pendingDraw: options });
    },

    pickDraw: (charId, cardDefId) => {
      const cs = get().characters[charId];
      if (!cs?.pendingDraw?.includes(cardDefId)) return;
      // 再校验一次限携 —— 候选是抽卡那一刻算的, 期间卡组可能已经变了。
      const next = { ...cs, deck: [...cs.deck] };
      if (!addCardToDeck(next, cardDefId)) {
        putCharacter(charId, { ...cs, pendingDraw: null });
        return;
      }
      putCharacter(charId, { ...next, pendingDraw: null });
    },

    rollPartyDrawOffers: (charIds) => charIds.flatMap((charId) => {
      const cs = get().characters[charId];
      const cardDefId = cs ? rollPartyDrawOption(cs) : null;
      return cardDefId ? [{ charId, cardDefId }] : [];
    }),

    pickPartyDraw: (charId, cardDefId) => {
      const cs = get().characters[charId];
      if (!cs || !cardBelongsToCharacter(cs, cardDefId)) return false;
      const next = { ...cs, deck: [...cs.deck] };
      if (!addCardToDeck(next, cardDefId)) return false;
      putCharacter(charId, next);
      return true;
    },

    removeCard: (charId, uid) => {
      const cs = get().characters[charId];
      const { day } = get();
      if (!cs) return;
      const usage = todayUsage(cs, day);
      const cost = removeCostToday(usage.remove);
      if (cs.exp < cost) return;
      if (cs.deck.length <= cs.minDeckSize) return; // 卡组不能低于最小下限
      if (!cs.deck.some((c) => c.uid === uid)) return;
      putCharacter(charId, {
        ...cs,
        exp: cs.exp - cost,
        forgeDay: day,
        drawUsedToday: usage.draw,
        removeUsedToday: usage.remove + 1,
        deck: cs.deck.filter((c) => c.uid !== uid),
      });
    },

    removeCardFree: (charId, uid) => {
      const cs = get().characters[charId];
      if (!cs || cs.deck.length <= cs.minDeckSize) return;
      if (!cs.deck.some((c) => c.uid === uid)) return;
      putCharacter(charId, { ...cs, deck: cs.deck.filter((c) => c.uid !== uid) });
    },

    reforgeEquipped: (charId, slot, bias) => {
      const cs = get().characters[charId];
      const equipped = cs?.equipped?.[slot];
      const pool = bondPool(bias);
      if (!cs || !equipped || !pool.length) return;
      const affinity = pool[Math.floor(Math.random() * pool.length)];
      putCharacter(charId, {
        ...cs,
        equipped: { ...cs.equipped, [slot]: { ...equipped, affinity } },
      });
    },

    // 降低最小卡组下限。★ 只开放后续删卡空间, 不会直接删掉任何卡。
    lowerMinDeck: (charId) => {
      const cs = get().characters[charId];
      if (!cs) return;
      const cost = lowerMinSizeCost(cs.minDeckSize);
      if (cost == null || cs.exp < cost) return;
      putCharacter(charId, { ...cs, exp: cs.exp - cost, minDeckSize: cs.minDeckSize - 1 });
    },
  };
}
