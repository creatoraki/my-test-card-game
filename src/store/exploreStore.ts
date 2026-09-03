// Zustand store: 包裹纯 TS 探索会话(explore/session.ts), 供 UI 订阅与派发。
// 与 battleStore 同模式 —— 每次操作先 structuredClone 再交给纯函数, 对 React 呈现不可变更新。
//
// 分工: 本 store 只管一趟远征的会话本身; 「本轮结束 → 真的建一场推进战斗 → 切界面」由
// runStore 编排, 因为只有它同时认识 battleStore 与界面路由。会话不持久化 —— 远征中途关页面即作废。

import { create } from "zustand";
import { getItemDef } from "../data";
import type { CardOfferCandidate, ExploreState, PartySnapshot } from "../explore/types";
import type { ItemStack } from "../items/types";
import {
  abandonPending,
  abandonLoot,
  addPendingLoot,
  acceptEquipOffer,
  arriveNode,
  chooseEntry,
  chooseOption,
  confirmNode,
  createSession,
  discardStack,
  dropContext,
  finishBattle,
  finishGenerating,
  finishLeaving,
  finishReveal,
  grantExpTo,
  recordExpGain,
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
  spendBattleEnergy as spendBattleEnergyFn,
  startReveal,
  syncPartyVitals as syncPartyVitalsFn,
  takeFromBackpack,
  putIntoBackpack,
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
import {
  abandonBoons,
  healPartyFlat,
  openCardOffer,
  rollEquipCrate,
  rollModuleCrate,
  takeBoon,
  takeCardOffer,
} from "../explore/boons";
import { buyFromShop as buyFromShopFn } from "../explore/shop";
import { EXPLORE_RULES } from "../explore/rules";
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
    survivors: { charId: string; hp: number; hpLimit?: number; alive: boolean; limitLoss: number }[],
    enemyDefIds: string[], // ⚠ 是 defId 列表不是数量 —— 掉落要查每个敌人自己的 dropTable
    challengeBonus: number,
    bountyBonus: number,
  ) => void;
  // 战斗回合消耗。★ 必须在 settleBattle 之后调用 —— 掉落系数与经验倍率读的是战前能量
  spendBattleEnergy: (rounds: number) => void;
  clear: () => void;

  // ---- 背包(阶段白名单的真相点在 explore/session, 这里只是转发) ----
  discardItem: (uid: string) => void;
  reorderBackpack: (uid: string, toIndex: number) => void;
  // ---- 远征途中换装的三块搬运(编排在 runStore, 这里同样只是转发) ----
  takeBackpackItem: (uid: string) => ItemStack | null; // 取出一整堆交给调用方
  putBackpackItems: (stacks: ItemStack[]) => boolean; // 收进背包, 容量不够整体失败
  syncPartyVitals: (charId: string, maxHp: number, burdenAdapt: number) => void;
  // 返回完整展示文案(「物品名 · 摘要」), UI 拿去飘一条; 用不了返回 null。
  // targetCharId 供指定角色类消耗品使用(必须传存活队员); 其余效果省略即可。
  useItem: (uid: string, targetCharId?: string) => string | null;
  takePending: (index: number) => void; // 替换模式: 收下待取物
  abandonPending: (index?: number) => void; // 替换模式: 放弃(省略 index = 全部放弃)
  shipHome: (uids: string[]) => void; // 投递口: 提前寄回据点
  takeLoot: (index: number) => boolean;
  /** 待拾取的模组直接装到某张卡上(不进背包, 不占格)。成功返回 true。 */
  installLootModule: (lootUid: string, charId: string, cardUid: string) => boolean;
  takeAllLoot: () => void;
  abandonLoot: () => void;
  takeBoonAction: (uid: string) => string | null;
  openCardOffer: (offers: CardOfferCandidate[]) => void;
  clearCardOffer: () => void;
  abandonBoons: () => void;
  restEat: (uid: string) => void;
  restSkip: () => void;
  chooseNpcOption: (index: number) => void;
  confirmNpc: () => void;
  grantExpTo: (charId: string) => void;
  recordExpGain: (amount: number) => void;
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

  settleBattle: (won, survivors, enemyDefIds, challengeBonus, bountyBonus) => {
    mutate(get, set, (d) => {
      finishBattle(d, won, survivors, enemyDefIds, challengeBonus, bountyBonus);
    });
  },

  spendBattleEnergy: (rounds) => {
    mutate(get, set, (d) => {
      spendBattleEnergyFn(d, rounds);
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

  // takeBackpackItem 要把取出的那一堆交回给编排层, 故与 useItem 同样自己接返回值。
  takeBackpackItem: (uid) => {
    let taken: ItemStack | null = null;
    mutate(get, set, (d) => {
      taken = takeFromBackpack(d, uid);
      return taken != null;
    });
    return taken;
  },

  putBackpackItems: (stacks) => {
    let ok = false;
    mutate(get, set, (d) => {
      ok = putIntoBackpack(d, stacks);
      return ok;
    });
    return ok;
  },

  syncPartyVitals: (charId, maxHp, burdenAdapt) => {
    mutate(get, set, (d) => syncPartyVitalsFn(d, charId, maxHp, burdenAdapt));
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

  // 「装载」通路: 模组不落背包直接上卡。★ 卡组是城镇侧的持久数据, 所以装配本身走 townStore;
  //   这里只负责在装成之后把这件模组从待拾取框里划掉 —— 装失败(条件不符/卡已有模组)则原样留着。
  installLootModule: (lootUid, charId, cardUid) => {
    const stack = get().session?.pendingLoot.find((item) => item.uid === lootUid);
    if (!stack) return false;
    if (getItemDef(stack.itemId).category !== "module") return false;
    if (!useTownStore.getState().installModuleStack(charId, cardUid, stack)) return false;
    mutate(get, set, (d) => {
      d.pendingLoot = d.pendingLoot.filter((item) => item.uid !== lootUid);
      return true;
    });
    return true;
  },

  takeAllLoot: () => {
    mutate(get, set, (d) => takeAllLoot(d));
  },

  abandonLoot: () => {
    mutate(get, set, (d) => abandonLoot(d));
  },

  takeBoonAction: (uid) => {
    let summary: string | null = null;
    mutate(get, set, (d) => {
      const boon = takeBoon(d, uid);
      if (!boon) return false;
      const kind = boon.kind;

      if (kind === "healDew") {
        const affected = healPartyFlat(d, EXPLORE_RULES.boons.healDewAmount);
        summary = affected
          ? `治疗露珠已拾取 · ${affected} 名队员恢复 ${EXPLORE_RULES.boons.healDewAmount} 点生命`
          : "治疗露珠已拾取 · 当前没有队员需要治疗";
        return true;
      }

      if (kind === "moduleCrate") {
        const stack = rollModuleCrate(d, dropContext(d, boon.dropK));
        if (!stack) {
          summary = "1 阶模组箱已拾取 · 当前没有可用模组";
          return true;
        }
        addPendingLoot(d, [stack]);
        summary = `1 阶模组箱已开启 · ${getItemDef(stack.itemId).name} 已加入战利品`;
        return true;
      }

      if (kind === "equipCrate") {
        const stack = rollEquipCrate(d, dropContext(d, boon.dropK));
        if (!stack) {
          summary = "随机装备箱已拾取 · 当前没有可用装备";
          return true;
        }
        addPendingLoot(d, [stack]);
        summary = `随机装备箱已开启 · ${getItemDef(stack.itemId).name} 已加入战利品`;
        return true;
      }

      const offers = useTownStore.getState().rollPartyDrawOffers(
        d.party.filter((member) => member.alive).map((member) => member.charId),
      );
      if (!offers.length) {
        summary = "卡牌奖励已拾取 · 当前没有可加入的卡牌";
        return true;
      }
      openCardOffer(d, offers);
      summary = `卡牌奖励已拾取 · 获得 ${offers.length} 张候选卡牌`;
      return true;
    });
    return summary;
  },

  openCardOffer: (offers) => {
    mutate(get, set, (d) => {
      openCardOffer(d, offers);
    });
  },

  clearCardOffer: () => {
    mutate(get, set, (d) => takeCardOffer(d) != null);
  },

  abandonBoons: () => {
    mutate(get, set, (d) => abandonBoons(d));
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

  recordExpGain: (amount) => {
    mutate(get, set, (d) => recordExpGain(d, amount));
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
