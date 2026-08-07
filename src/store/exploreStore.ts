// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管一趟远征的会话本身; 「本轮结束 → 真的建一场推进战斗 → 切界面」由
// runStore 编排, 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import type { ExploreState, PartySnapshot } from "../explore/types";
import type { ItemStack } from "../items/types";
import {
  abandonPending,
  abandonLoot,
  acceptEquipOffer,
  arriveNode,
  chooseEntry,
  chooseOption,
  chooseSlotCard,
  confirmNode,
  createSession,
  discardStack,
  finishBattle,
  finishGenerating,
  finishLeaving,
  finishReveal,
  grantExpTo,
  leaveRegion,
  pushOn,
  reorderBackpack as reorderBackpackFn,
  retreat,
  reforgeBackpackItem,
  resolvePendingAction,
  resolvePendingHealing,
  restEat,
  restSkip,
  chooseNpcOption,
  confirmNpc,
  shipHome,
  startReveal,
  startSlot,
  stopReel,
  takePendingContamination,
  takePending,
  takeAllLoot,
  takeLoot,
  takePendingExp,
  useItem,
} from "../explore/session";

interface ExploreStore {
  session: ExploreState | null;

  // initialBackpack = 出击准备界面装好的物资(见 store/sortieStore.ts)。缺省 = 空手出发。
  start: (
    mapId: string,
    party: PartySnapshot[],
    seed?: number,
    initialBackpack?: ItemStack[],
  ) => void;
  generateDone: () => void; // 浮现演出播完(UI 定时器) → sealed
  beginReveal: () => void; // 玩家按「探索路线」→ revealing。一轮只生效一次
  revealDone: () => void; // 揭示计时结束(UI 定时器)
  pickEntry: (lane: number) => void; // 选入口通道 A-E。★ 全轮唯一一次自由选择
  arrive: () => ExploreState | null; // 推进动画播完 → landed(只落点, 不结算)
  pickOption: (index: number) => ExploreState | null; // 落点浮层选分支
  confirmNode: () => void; // 结算浮层「确认」→ atNode 决策
  pushOn: () => void; // 「继续推进」→ 下一个推进段
  leaveRegion: () => void; // 「前往下一区域」→ 离场行走演出(leaving), 无路可走则直接披露
  leaveDone: () => void; // 离场行走演出播完(UI 动画计时器) → routeDisclosure

  // ---- 战斗签老虎机(设计文档 §2.4) ----
  startSlot: () => void; // 披露页「抽取战斗签」→ slotSpinning
  // 按下暂停。⚠ 传的是**滚动至今的毫秒数**, 不是符号 id: 定住哪个符号由 explore/slot 判,
  //   UI 只负责报时。两边各算一份就会「停在这个却给了那个」。
  stopReel: (elapsedMs: number) => ExploreState | null;
  chooseSlotCard: (index: number) => ExploreState | null; // 三选一 → inBattle
  consumePendingContamination: () => { total: number; each: number };
  retreatNow: () => void;
  settleBattle: (
    won: boolean,
    survivors: { charId: string; hp: number; hpLimit: number; alive: boolean }[],
    enemyDefIds: string[], // ⚠ 是 defId 列表不是数量 —— 掉落要查每个敌人自己的 dropTable
  ) => void;
  clear: () => void;

  // ---- 背包(阶段白名单的真相点在 explore/session, 这里只是转发) ----
  discardItem: (uid: string) => void;
  reorderBackpack: (uid: string, toIndex: number) => void;
  useItem: (uid: string) => string | null; // 返回结算摘要, UI 拿去飘一条
  takePending: (index: number) => void; // 替换模式: 收下待取物
  abandonPending: (index?: number) => void; // 替换模式: 放弃(省略 index = 全部放弃)
  shipHome: (uids: string[]) => void; // 投递口: 提前寄回据点
  takeLoot: (index: number) => void;
  takeAllLoot: () => void;
  abandonLoot: () => void;
  restEat: (uid: string) => void;
  restSkip: () => void;
  chooseNpcOption: (index: number) => void;
  confirmNpc: () => void;
  grantExpTo: (charId: string) => void;
  resolvePendingHealing: (charId: string, limit: boolean) => void;
  resolvePendingAction: () => void;
  acceptEquipOffer: (index: number) => void;
  reforgeBackpackItem: (uid: string) => void;
  consumePendingExp: () => Record<string, number>;
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

  start: (mapId, party, seed, initialBackpack) => {
    set({ session: createSession(mapId, party, seed, initialBackpack) });
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

  arrive: () => mutate(get, set, (d) => arriveNode(d)),

  pickOption: (index) => mutate(get, set, (d) => chooseOption(d, index)),

  confirmNode: () => {
    mutate(get, set, (d) => confirmNode(d));
  },

  pushOn: () => {
    mutate(get, set, (d) => pushOn(d));
  },

  leaveRegion: () => {
    mutate(get, set, (d) => leaveRegion(d));
  },

  leaveDone: () => {
    mutate(get, set, (d) => finishLeaving(d));
  },

  startSlot: () => {
    mutate(get, set, (d) => startSlot(d));
  },

  stopReel: (elapsedMs) => mutate(get, set, (d) => stopReel(d, elapsedMs)),

  chooseSlotCard: (index) => mutate(get, set, (d) => chooseSlotCard(d, index)),

  consumePendingContamination: () => {
    const s = get().session;
    if (!s || (s.pendingContaminationCount <= 0 && s.pendingContaminationEach <= 0)) {
      return { total: 0, each: 0 };
    }
    const draft = structuredClone(s);
    const count = takePendingContamination(draft);
    set({ session: draft });
    return count;
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

  reorderBackpack: (uid, toIndex) => {
    mutate(get, set, (d) => reorderBackpackFn(d, uid, toIndex));
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

  takeLoot: (index) => {
    mutate(get, set, (d) => takeLoot(d, index));
  },

  takeAllLoot: () => {
    mutate(get, set, (d) => takeAllLoot(d));
  },

  abandonLoot: () => {
    mutate(get, set, (d) => abandonLoot(d));
  },

  restEat: (uid) => {
    mutate(get, set, (d) => restEat(d, uid));
  },

  restSkip: () => {
    mutate(get, set, (d) => restSkip(d));
  },

  chooseNpcOption: (index) => {
    mutate(get, set, (d) => chooseNpcOption(d, index));
  },

  confirmNpc: () => {
    mutate(get, set, (d) => confirmNpc(d));
  },

  grantExpTo: (charId) => {
    mutate(get, set, (d) => grantExpTo(d, charId));
  },

  resolvePendingHealing: (charId, limit) => {
    mutate(get, set, (d) => resolvePendingHealing(d, charId, limit));
  },

  resolvePendingAction: () => {
    mutate(get, set, (d) => resolvePendingAction(d));
  },

  acceptEquipOffer: (index) => {
    mutate(get, set, (d) => acceptEquipOffer(d, index));
  },

  reforgeBackpackItem: (uid) => {
    mutate(get, set, (d) => reforgeBackpackItem(d, uid));
  },

  consumePendingExp: () => {
    let exp: Record<string, number> = {};
    mutate(get, set, (d) => {
      exp = takePendingExp(d);
      return Object.keys(exp).length > 0;
    });
    return exp;
  },
}));
