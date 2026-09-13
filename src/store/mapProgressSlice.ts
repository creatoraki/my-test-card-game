import { difficultyKey, rollAllDailyClearRewards, type MapDifficulty } from "../data";
import type { ItemStack } from "../items/types";
import type { TownStore } from "./townStore";

export interface DailyClearState {
  day: number;
  rewards: Record<string, ItemStack[]>;
}

export interface MapProgressState {
  clearedDifficulties: string[];
  dailyClear: DailyClearState;
}

export interface MapProgressSlice {
  markDifficultyCleared: (mapId: string, difficulty: MapDifficulty) => void;
  syncDailyClear: () => void;
  takeDailyClearReward: (mapId: string, difficulty: MapDifficulty) => ItemStack[];
}

export function freshMapProgress(day: number): MapProgressState {
  return {
    clearedDifficulties: [],
    dailyClear: { day, rewards: rollAllDailyClearRewards(day) },
  };
}

export function createMapProgressSlice(
  set: (partial: Partial<TownStore>) => void,
  get: () => TownStore,
): MapProgressSlice {
  return {
    markDifficultyCleared: (mapId, difficulty) => {
      const key = difficultyKey(mapId, difficulty);
      const { clearedDifficulties } = get();
      if (clearedDifficulties.includes(key)) return;
      set({ clearedDifficulties: [...clearedDifficulties, key] });
    },

    syncDailyClear: () => {
      const { day, dailyClear } = get();
      if (dailyClear.day === day) return;
      set({ dailyClear: { day, rewards: rollAllDailyClearRewards(day) } });
    },

    takeDailyClearReward: (mapId, difficulty) => {
      const stacks = get().dailyClear.rewards[difficultyKey(mapId, difficulty)] ?? [];
      return stacks.map((stack) => ({ ...stack }));
    },
  };
}
