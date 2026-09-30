import { POLLUTION_RULES, QUIRK_IDS, type Card, type QuirkId } from "@/engine";
import { makeCard } from "@/data";
import { commonReplaceCandidates } from "../town/deckCards";
import { shiftVitals } from "../town/characterStats";
import type { TownStore } from "../town/townStore";

export interface CurioTownSlice {
  addPollution: (charId: string, amount: number) => void;
  /** 成功返回换上的新卡(原卡连同模组一并移除); 失败返回 null。 */
  replaceCardWithCommon: (charId: string, uid: string) => Card | null;
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
      if (!character) return null;
      const index = character.deck.findIndex((card) => card.uid === uid);
      if (index < 0) return null;
      const candidates = commonReplaceCandidates(character, uid);
      if (!candidates.length) return null;
      const cardDefId = candidates[Math.floor(Math.random() * candidates.length)];
      const nextDeck = character.deck.slice();
      const fresh = makeCard(cardDefId);
      nextDeck[index] = fresh;
      set({ characters: { ...state.characters, [charId]: { ...character, deck: nextDeck } } });
      return fresh;
    },
  };
}
