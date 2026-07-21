// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管牌局本身; 「打出遭遇卡 → 真的建一场战斗 → 切界面」由 runStore 编排,
// 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import type { AbilityId, ExploreState, PartySnapshot } from "../explore/types";
import {
  cancelDiscard,
  confirmDiscard,
  createSession,
  finishBattle,
  playEvent,
  playRoute,
  retreat,
  toggleDiscardPick,
  useAbility,
} from "../explore/session";

interface ExploreStore {
  session: ExploreState | null;

  start: (mapId: string, party: PartySnapshot[], carryCardIds?: string[]) => void;
  playEventCard: (uid: string) => void;
  playRouteCard: (uid: string) => ExploreState | null; // 返回新会话供 runStore 立刻建局
  retreatNow: () => void;
  settleBattle: (
    won: boolean,
    survivors: { charId: string; hp: number; alive: boolean }[],
    enemyCount: number,
  ) => void;
  ability: (id: AbilityId) => void;
  pickDiscard: (uid: string) => void;
  applyDiscard: () => void;
  abortDiscard: () => void;
  clear: () => void;
}

// 所有 mutation 共用: 克隆 → 交给纯函数 → 仅在真的改动时替换。
function mutate(
  get: () => ExploreStore,
  set: (partial: Partial<ExploreStore>) => void,
  fn: (draft: ExploreState) => boolean | void,
): ExploreState | null {
  const s = get().session;
  if (!s) return null;
  const draft = structuredClone(s);
  const ok = fn(draft);
  if (ok === false) return null;
  set({ session: draft });
  return draft;
}

export const useExploreStore = create<ExploreStore>((set, get) => ({
  session: null,

  start: (mapId, party, carryCardIds = []) => {
    set({ session: createSession(mapId, party, carryCardIds) });
  },

  playEventCard: (uid) => {
    mutate(get, set, (d) => playEvent(d, uid));
  },

  playRouteCard: (uid) => mutate(get, set, (d) => playRoute(d, uid)),

  retreatNow: () => {
    mutate(get, set, (d) => retreat(d));
  },

  settleBattle: (won, survivors, enemyCount) => {
    mutate(get, set, (d) => {
      finishBattle(d, won, survivors, enemyCount);
    });
  },

  ability: (id) => {
    mutate(get, set, (d) => useAbility(d, id));
  },

  pickDiscard: (uid) => {
    mutate(get, set, (d) => toggleDiscardPick(d, uid));
  },

  applyDiscard: () => {
    mutate(get, set, (d) => confirmDiscard(d));
  },

  abortDiscard: () => {
    mutate(get, set, (d) => cancelDiscard(d));
  },

  clear: () => set({ session: null }),
}));
