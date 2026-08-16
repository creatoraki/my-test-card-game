// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管一趟远征的会话本身; 「本轮结束 → 真的建一场推进战斗 → 切界面」由
// runStore 编排, 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import { getItemDef } from "../data";
import type { ExploreState, PartySnapshot } from "../explore/types";
import type { ItemStack } from "../items/types";
import {
  abandonPending,
  abandonLoot,
  acceptEquipOffer,
  arriveNode,
  chooseEntry,
  chooseOption,
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
  cheatChangeEnergy,
  closeShopping,
  confirmNpc,
  shipHome,
  startReveal,
  engageRoundBattle,
  takePendingContamination,
  takePending,
  takeAllLoot,
  takeLoot,
  takePendingExp,
  useItem,
  applyEffect,
  type ItemUseResult,
} from "../explore/session";
import { buyFromShop as buyFromShopFn } from "../explore/shop";
import { useTownStore } from "./townStore";

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
  cheatEnergy: (delta: number) => void;
  revealDone: () => void; // 揭示计时结束(UI 定时器)
  pickEntry: (lane: number) => void; // 选入口通道 A-E。★ 全轮唯一一次自由选择
  arrive: () => ExploreState | null; // 推进动画播完 → landed(只落点, 不结算)
  pickOption: (index: number) => ExploreState | null; // 落点浮层选分支
  buyFromShop: (slotIndex: number, stockIndex?: number) => boolean;
  closeShop: () => void;
  confirmNode: () => void; // 结算浮层「确认」→ atNode 决策
  pushOn: () => void; // 「继续推进」→ 下一个推进段
  leaveRegion: () => void; // 「前往下一区域」→ 离场行走演出(leaving), 无路可走则直接披露
  leaveDone: () => void; // 离场行走演出播完(UI 动画计时器) → roundBattle
  engageRoundBattle: () => ExploreState | null; // 轮次战斗事件「迎战」→ inBattle
  consumePendingContamination: () => { total: number; each: number };
  fillStoryPlaceholders: (names: { charName: string; cardName: string }[]) => void;
  retreatNow: () => void;
  settleBattle: (
    won: boolean,
    survivors: { charId: string; hp: number; hpLimit: number; alive: boolean }[],
    enemyDefIds: string[], // ⚠ 是 defId 列表不是数量 —— 掉落要查每个敌人自己的 dropTable
    challengeBonus: number,
  ) => void;
  clear: () => void;

  // ---- 背包(阶段白名单的真相点在 explore/session, 这里只是转发) ----
  discardItem: (uid: string) => void;
  reorderBackpack: (uid: string, toIndex: number) => void;
  // 返回完整展示文案(「物品名 · 摘要」), UI 拿去飘一条; 用不了返回 null。
  // targetCharId 供指定角色类消耗品使用(必须传存活队员); 其余效果省略即可。
  useItem: (uid: string, targetCharId?: string) => string | null;
  takePending: (index: number) => void; // 替换模式: 收下待取物
  abandonPending: (index?: number) => void; // 替换模式: 放弃(省略 index = 全部放弃)
  shipHome: (uids: string[]) => void; // 投递口: 提前寄回据点
  takeLoot: (index: number) => boolean;
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

  cheatEnergy: (delta) => {
    mutate(get, set, (d) => cheatChangeEnergy(d, delta));
  },

  revealDone: () => {
    mutate(get, set, (d) => finishReveal(d));
  },

  pickEntry: (lane) => {
    mutate(get, set, (d) => chooseEntry(d, lane));
  },

  arrive: () => mutate(get, set, (d) => arriveNode(d)),

  pickOption: (index) => mutate(get, set, (d) => chooseOption(d, index)),

  buyFromShop: (slotIndex, stockIndex) => {
    let ok = false;
    mutate(get, set, (d) => {
      ok = buyFromShopFn(d, slotIndex, stockIndex, applyEffect);
      return ok;
    });
    return ok;
  },

  closeShop: () => {
    mutate(get, set, (d) => closeShopping(d));
  },

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

  engageRoundBattle: () => mutate(get, set, (d) => engageRoundBattle(d)),

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

  fillStoryPlaceholders: (names) => {
    const s = get().session;
    if (!s || !names.length) return;
    const charName = names[0]?.charName ?? "某名队员";
    const card1 = names[0]?.cardName ?? "未知卡牌";
    const card2 = names[1]?.cardName ?? card1;
    const fill = (text: string) =>
      text
        .replace(/\{实际角色名\}/g, charName)
        .replace(/\{实际卡牌名1\}/g, card1)
        .replace(/\{实际卡牌名2\}/g, card2)
        .replace(/\{实际卡牌名\}/g, card1);
    set({
      session: {
        ...s,
        pendingStory: s.pendingStory.map(fill),
        pendingNotes: s.pendingNotes.map(fill),
      },
    });
  },

  retreatNow: () => {
    mutate(get, set, (d) => retreat(d));
  },

  settleBattle: (won, survivors, enemyDefIds, challengeBonus) => {
    mutate(get, set, (d) => {
      finishBattle(d, won, survivors, enemyDefIds, challengeBonus);
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
  // ★ 污染是城镇侧状态: 纯会话函数只算出「要降谁、降多少」, 这里转交 townStore 落地后
  //   再按**实际降低值**重建展示文案(角色可能本来就没多少污染可降)。
  // ⚠ 圣水的有效性检查也在这里(纯会话函数摸不到污染值): 目标没有污染可降时不消耗物品,
  //   直接拒绝并返回 null(设计文档《消耗品》§2.3)。
  useItem: (uid, targetCharId) => {
    if (targetCharId) {
      const stack = get().session?.backpack.find((x) => x.uid === uid);
      const def = stack ? getItemDef(stack.itemId) : null;
      if (def?.use?.kind === "reducePollutionOne") {
        const pollution = useTownStore.getState().characters[targetCharId]?.pollution ?? 0;
        if (pollution <= 0) return null;
      }
    }
    let result: ItemUseResult | null = null;
    mutate(get, set, (d) => {
      result = useItem(d, uid, targetCharId);
      return result != null;
    });
    if (!result) return null;
    if (result.pollution) {
      const { charId, name, amount } = result.pollution;
      const actual = useTownStore.getState().reducePollution(charId, amount);
      const note = actual > 0 ? `${name} 污染 −${actual}` : `${name} 没有污染值可降低`;
      return `${result.itemName} · ${note}`;
    }
    return `${result.itemName} · ${result.note}`;
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
    let ok = false;
    mutate(get, set, (d) => {
      ok = takeLoot(d, index);
      return ok;
    });
    return ok;
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
