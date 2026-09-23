// 物资中转仓与装备 —— 落袋、出售、仓库 ↔ 装备槽、卡牌模组装配与模组制造。

import {
  canEquipModule,
  craftCheck,
  getItemDef,
  getModuleRecipe,
  makeItemStack,
  recomputeCardModule,
  sellPriceOf,
} from "@/data";
import { removeByUid } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { shiftVitals } from "../town/characterStats";
import type { TownGet, TownSet, TownStore } from "../town/townTypes";

export type StorageSlice = Pick<
  TownStore,
  | "bankLoot"
  | "deposit"
  | "discardStored"
  | "withdraw"
  | "sellItem"
  | "depositHaul"
  | "equipItem"
  | "unequipItem"
  | "wearStack"
  | "takeOffStack"
  | "equipCardModule"
  | "installModuleStack"
  | "unequipCardModule"
  | "craftModule"
>;

export function createStorageSlice(set: TownSet, get: TownGet): StorageSlice {
  return {
    bankLoot: (amount) => {
      if (amount <= 0) return;
      set({ loot: get().loot + amount });
    },

    // 远征落袋。仓库无上限, 所以只是接上去 —— 不会有"装不下"这回事。
    deposit: (stacks) => {
      if (!stacks.length) return; // 幂等护栏, 同 bankLoot
      set({ storage: [...get().storage, ...stacks.map((s) => ({ ...s }))] });
    },

    discardStored: (uid) => {
      const next = removeByUid(get().storage, uid);
      if (next !== get().storage) set({ storage: next });
    },

    // 出击准备: 把一整堆从仓库取出, 交给调用方(store/sortie/sortieStore 会把它塞进待出发的背包)。
    // ★ 刻意返回那一堆而不是只做删除 —— 调用方需要拿到 uid 与 count 才能原样退回。
    // ⚠ 按 uid 整堆取, **不拆堆**: 仓库里合并显示的是 UI 的事(mergeStacksForDisplay),
    //   状态里存的本来就是逐 uid 的独立堆。
    withdraw: (uid) => {
      const { storage } = get();
      const st = storage.find((s) => s.uid === uid);
      if (!st) return null;
      set({ storage: removeByUid(storage, uid) });
      return { ...st };
    },

    // 回收台。⚠ 只有填了 sellValue 的废料、装备与祝福遗物能卖; 模组材料留给制造和装备养成使用。
    sellItem: (uid) => {
      const { storage, loot, techTree } = get();
      const st = storage.find((s) => s.uid === uid);
      if (!st) return;
      const value = sellPriceOf(getItemDef(st.itemId), techTree.levels);
      if (!value) return;
      set({ storage: removeByUid(storage, uid), loot: loot + value * st.count });
    },

    // 远征收尾的落袋出口。★「换金物回城即变现」的唯一真相点 ——
    // 换金物(scrap)带回据点后本来就只有「去回收台卖掉」一条路, 所以这里直接按回收台
    // 同一套 sellPriceOf 折成居民积分(科技树的回收溢价照吃), 不再进仓库让玩家一枚枚去点;
    // 其余物资(装备/材料/水晶/遗物/消耗品)照旧入仓。
    // ⚠ 与 deposit 分成两个出口是刻意的: 出击准备把未出发的物资退回仓库走的是 deposit,
    //   那条路径不该触发售出。
    // ⚠ 漏填 sellValue 的换金物(折算下来是 0)一律照常入仓 —— 绝不让物品凭空消失。
    depositHaul: (stacks, relicBonus = 0) => {
      if (!stacks.length) return 0; // 幂等护栏, 同 deposit
      const { techTree } = get();
      let sold = 0;
      const kept: ItemStack[] = [];
      for (const st of stacks) {
        const def = getItemDef(st.itemId);
        const value = def.category === "scrap" ? sellPriceOf(def, techTree.levels, relicBonus) : 0;
        if (value > 0) sold += value * st.count;
        else kept.push({ ...st });
      }
      set({
        storage: kept.length ? [...get().storage, ...kept] : get().storage,
        loot: get().loot + sold,
      });
      return sold;
    },

    // ---- 三装备槽(《物品设计.md》第二章) ----
    // 穿上 = 从仓库移出、进角色的槽位; 被替下的旧装备退回仓库, 不会凭空消失。
    // ⚠ 同一角色的同类槽位只能有一件; 不同角色可以各装一件同类装备。
    equipItem: (charId, uid) => {
      const { storage, characters } = get();
      const st = storage.find((s) => s.uid === uid);
      if (!st || !characters[charId]) return;
      const def = getItemDef(st.itemId);
      if (def.category !== "equipment" || !def.slot) return;
      // ⚠ 守卫全部走完才动手: 先把物品从仓库拿走再穿 —— 反过来的话 wearStack 交回的旧件
      //   会被这次 set 的 storage 快照(仍含新件)覆盖掉。
      set({ storage: removeByUid(storage, uid) });
      const old = get().wearStack(charId, st);
      if (old) set({ storage: [...get().storage, old] });
    },

    unequipItem: (charId, slot) => {
      const st = get().takeOffStack(charId, slot);
      if (!st) return;
      set({ storage: [...get().storage, st] });
    },

    // 穿上一件**已经在调用方手里**的装备(不从仓库取)。返回被替下的旧件, 由调用方决定它去哪。
    wearStack: (charId, stack) => {
      const { characters } = get();
      const cs = characters[charId];
      if (!cs) return null;
      const def = getItemDef(stack.itemId);
      if (def.category !== "equipment" || !def.slot) return null;

      const old = cs.equipped[def.slot];
      set({
        characters: {
          ...characters,
          [charId]: shiftVitals(cs, {
            ...cs,
            equipped: { ...cs.equipped, [def.slot]: { ...stack } },
          }),
        },
      });
      return old ? { ...old } : null;
    },

    // 卸下并把物品交出去(不进仓库)。槽位本来就空则返回 null, 不做任何改动。
    takeOffStack: (charId, slot) => {
      const { characters } = get();
      const cs = characters[charId];
      const st = cs?.equipped?.[slot];
      if (!cs || !st) return null;
      set({
        characters: {
          ...characters,
          [charId]: shiftVitals(cs, { ...cs, equipped: { ...cs.equipped, [slot]: null } }),
        },
      });
      return { ...st };
    },

    equipCardModule: (charId, cardUid, moduleUid) => {
      const moduleStack = get().storage.find((stack) => stack.uid === moduleUid);
      if (!moduleStack) return;
      // ★ 先装、装成了才扣仓库 —— 校验全在 installModuleStack 里, 这里不重复一遍。
      if (get().installModuleStack(charId, cardUid, moduleStack))
        set({ storage: removeByUid(get().storage, moduleUid) });
    },

    // 模组来源无关的装配核心。仓库装配与远征途中「从战利品直接装载」共用同一份校验,
    // 差别只在调用方要不要把这件模组从某个容器里扣掉。
    installModuleStack: (charId, cardUid, moduleStack) => {
      const { characters } = get();
      const cs = characters[charId];
      const card = cs?.deck.find((entry) => entry.uid === cardUid);
      if (!cs || !card || card.cardModule) return false;
      if (getItemDef(moduleStack.itemId).category !== "module") return false;
      if (!canEquipModule(card, moduleStack.itemId)) return false;

      const nextCard = { ...card, cardModule: { uid: moduleStack.uid, itemId: moduleStack.itemId } };
      recomputeCardModule(nextCard);
      set({
        characters: {
          ...characters,
          [charId]: {
            ...cs,
            deck: cs.deck.map((entry) => (entry.uid === cardUid ? nextCard : entry)),
          },
        },
      });
      return true;
    },

    unequipCardModule: (charId, cardUid) => {
      const { storage, characters } = get();
      const cs = characters[charId];
      const card = cs?.deck.find((entry) => entry.uid === cardUid);
      if (!cs || !card?.cardModule) return;

      const nextCard = { ...card, cardModule: null };
      recomputeCardModule(nextCard);
      set({
        storage: [...storage, { uid: card.cardModule.uid, itemId: card.cardModule.itemId, count: 1 }],
        characters: {
          ...characters,
          [charId]: {
            ...cs,
            deck: cs.deck.map((entry) => (entry.uid === cardUid ? nextCard : entry)),
          },
        },
      });
    },

    // ---- 模组制造 ----
    // 选定角色 → 按配方扣该角色经验与仓库材料 → 产出模组进仓库。
    // ⚠ 可行性判定统一走 data/crafting/moduleCrafting 的 craftCheck, UI 的置灰读的是同一个函数。
    craftModule: (charId, itemId) => {
      const { storage, characters } = get();
      const cs = characters[charId];
      const recipe = getModuleRecipe(charId, itemId);
      if (!cs || !recipe) return;
      if (!craftCheck(recipe, cs.exp, storage).ok) return;

      // 逐堆扣材料: 仓库存的是逐 uid 的独立堆, 扣空的堆整堆移除。
      let nextStorage = storage;
      for (const material of recipe.materials) {
        let left = material.count;
        for (const stack of nextStorage.filter((entry) => entry.itemId === material.itemId)) {
          if (left <= 0) break;
          const take = Math.min(left, stack.count);
          left -= take;
          nextStorage =
            take >= stack.count
              ? removeByUid(nextStorage, stack.uid)
              : nextStorage.map((entry) =>
                  entry.uid === stack.uid ? { ...entry, count: entry.count - take } : entry,
                );
        }
      }

      set({
        storage: [...nextStorage, makeItemStack(recipe.itemId)],
        // expEarned 是累计获得量, 只增不减 —— 消费只动可用经验池。
        characters: { ...characters, [charId]: { ...cs, exp: cs.exp - recipe.exp } },
      });
    },
  };
}
