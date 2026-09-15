import { POLLUTION_RULES, QUIRK_IDS, type QuirkId } from "@/engine";
import { makeCard } from "@/data";
import { availablePools } from "./deckCards";
import { shiftVitals } from "./characterStats";
import type { TownStore } from "./townStore";

export interface CurioTownSlice {
  addPollution: (charId: string, amount: number) => void;
  replaceCardWithCommon: (charId: string, uid: string) => boolean;
}

export function createCurioTownSlice(
  set: (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void,
  get: () => TownStore,
): CurioTownSlice {
  return {
    addPollution: (charId, amount) => {
      const state = get();
      const character = state.characters[charId];
      const gain = Math.max(0, Math.floor(amount));
      if (!character || !gain) return;
      let pollution = character.pollution + gain;
      let sick = character.sick;
      let quirks = [...character.quirks] as QuirkId[];
      if (pollution >= POLLUTION_RULES.threshold) {
        pollution = 0;
        sick = true;
        const available = QUIRK_IDS.filter((id) => !quirks.includes(id));
        if (quirks.length < POLLUTION_RULES.maxQuirks && available.length) {
          const quirk = available[Math.floor(Math.random() * available.length)];
          quirks = [...quirks, quirk];
        }
      }
      const next = { ...character, pollution, sick, quirks };
      set({ characters: { ...state.characters, [charId]: shiftVitals(character, next) } });
    },

    replaceCardWithCommon: (charId, uid) => {
      const state = get();
      const character = state.characters[charId];
      if (!character) return false;
      const index = character.deck.findIndex((card) => card.uid === uid);
      if (index < 0) return false;
      const reducedDeck = character.deck.filter((_, cardIndex) => cardIndex !== index);
      const candidates = availablePools({ ...character, deck: reducedDeck }).common;
      if (!candidates.length) return false;
      const cardDefId = candidates[Math.floor(Math.random() * candidates.length)];
      const nextDeck = character.deck.slice();
      nextDeck[index] = makeCard(cardDefId);
      set({ characters: { ...state.characters, [charId]: { ...character, deck: nextDeck } } });
      return true;
    },
  };
}
