// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管一趟远征的会话本身; 「走线落到战斗终点 → 真的建一场战斗 → 切界面」由
// runStore 编排, 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import type { ExploreState, PartySnapshot } from "../explore/types";
import {
  abandonPending,
  chooseEntry,
  chooseOption,
  createSession,
  discardStack,
  finishBattle,
  finishGenerating,
  finishReveal,
  finishRouting,
  nextSegment,
  retreat,
  shipHome,
  startReveal,
  takePending,
  useItem,
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
    enemyDefIds: string[], // ⚠ 是 defId 列表不是数量 —— 掉落要查每个敌人自己的 dropTable
  ) => void;
  clear: () => void;

  // ---- 背包(阶段白名单的真相点在 explore/session, 这里只是转发) ----
  discardItem: (uid: string) => void;
  useItem: (uid: string) => string | null; // 返回结算摘要, UI 拿去飘一条
  takePending: (index: number) => void; // 替换模式: 收下待取物
  abandonPending: (index?: number) => void; // 替换模式: 放弃(省略 index = 全部放弃)
  shipHome: (uids: string[]) => void; // 投递口: 提前寄回据点
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

  settleBattle: (won, survivors, enemyDefIds) => {
    mutate(get, set, (d) => {
      finishBattle(d, won, survivors, enemyDefIds);
    });
  },

  clear: () => set({ session: null }),

  // ---- 背包 ----
  discardItem: (uid) => {
    mutate(get, set, (d) => discardStack(d, uid));
  },

  // useItem 要把摘要交回 UI, 所以不能只走 mutate 的布尔约定 —— 自己接一下返回值。
  useItem: (uid) => {
    let note: string | null = null;
    mutate(get, set, (d) => {
      note = useItem(d, uid);
      return note != null;
    });
    return note;
  },

  takePending: (index) => {
    mutate(get, set, (d) => takePending(d, index));
  },

  abandonPending: (index) => {
    mutate(get, set, (d) => abandonPending(d, index));
  },

  shipHome: (uids) => {
    mutate(get, set, (d) => shipHome(d, uids));
  },
}));
