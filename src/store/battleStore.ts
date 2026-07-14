// Zustand store: 包裹纯 TS 引擎, 供 UI 订阅与派发。
// 每次操作都对战斗状态做一次 structuredClone 再修改, 保证引擎不改动 React 当前持有的对象。

import { create } from "zustand";
import type { BattleSetup, BattleState } from "../engine";
import { createBattle, endRound, playCard } from "../engine";

interface BattleStore {
  battle: BattleState | null;
  init: (encounterId: string, setup: BattleSetup, seed?: number) => void;
  play: (uid: string, targetId?: string) => void;
  end: () => void;
  clear: () => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,

  init: (encounterId, setup, seed) => {
    set({ battle: createBattle(encounterId, setup, seed) });
  },

  play: (uid, targetId) => {
    const b = get().battle;
    if (!b || b.phase !== "player") return;
    const draft = structuredClone(b);
    playCard(draft, uid, targetId);
    set({ battle: draft });
  },

  end: () => {
    const b = get().battle;
    if (!b || b.phase !== "player") return;
    const draft = structuredClone(b);
    endRound(draft);
    set({ battle: draft });
  },

  clear: () => set({ battle: null }),
}));
