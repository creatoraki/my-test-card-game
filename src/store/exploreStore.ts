// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管一趟远征的会话本身; 「走线落到战斗终点 → 真的建一场战斗 → 切界面」由
// runStore 编排, 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import type { ExploreState, PartySnapshot } from "../explore/types";
import {
  chooseEntry,
  chooseOption,
  createSession,
  finishBattle,
  finishGenerating,
  finishReveal,
  finishRouting,
  nextSegment,
  retreat,
  startReveal,
} from "../explore/session";

interface ExploreStore {
  session: ExploreState | null;

  start: (mapId: string, party: PartySnapshot[], seed?: number) => void;
  generateDone: () => void; // 生成演出播完(UI 定时器) → sealed
  beginReveal: () => void; // 玩家按「探索路线」→ revealing。一段只生效一次
  revealDone: () => void; // 展示计时结束(UI 定时器)
  pickEntry: (lane: number) => void; // 选入口 A-E
  routeDone: () => ExploreState | null; // 走线动画播完 → landed(只落点, 不结算)
  pickOption: (index: number) => ExploreState | null; // 落点浮层选分支; 返回新会话供 UI 判断要不要切战斗页
  advance: () => void; // 结算浮层「继续」→ 下一段
  retreatNow: () => void;
  settleBattle: (
    won: boolean,
    survivors: { charId: string; hp: number; alive: boolean }[],
    enemyCount: number,
  ) => void;
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

  start: (mapId, party, seed) => {
    set({ session: createSession(mapId, party, seed) });
  },

  generateDone: () => {
    mutate(get, set, (d) => finishGenerating(d));
  },

  beginReveal: () => {
    mutate(get, set, (d) => startReveal(d));
  },

  revealDone: () => {
    mutate(get, set, (d) => finishReveal(d));
  },

  pickEntry: (lane) => {
    mutate(get, set, (d) => chooseEntry(d, lane));
  },

  routeDone: () => mutate(get, set, (d) => finishRouting(d)),

  pickOption: (index) => mutate(get, set, (d) => chooseOption(d, index)),

  advance: () => {
    mutate(get, set, (d) => nextSegment(d));
  },

  retreatNow: () => {
    mutate(get, set, (d) => retreat(d));
  },

  settleBattle: (won, survivors, enemyCount) => {
    mutate(get, set, (d) => {
      finishBattle(d, won, survivors, enemyCount);
    });
  },

  clear: () => set({ session: null }),
}));
