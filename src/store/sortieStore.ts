// Zustand store: 一次「出击准备」的临时会话 —— 选定地图 + 装填背包, 直到真的出发为止。
//
// 边界(与 exploreStore 同一条): **不持久化**。准备到一半刷新页面即作废 —— 那是一个还没
// 发生的远征, 存下来只会让「积分扣了但东西不在仓库也不在背包」这种半截状态漏进存档。
// ⚠ 正因为不持久化, cancel() 的回滚必须做全: 玩家关页面前唯一的正规出口就是它。
//
// 分工: 本 store 只管「带什么走」。真的建立探索会话是 runStore.startExpedition 的事 ——
// 只有它同时认识 exploreStore 与界面路由。钱与仓库的真相点仍在 townStore, 本 store 不缓存
// 积分余额, 每次买都现读现扣。
//
// ★★ 来源记账为什么按「itemId × 件数」而不是按 uid:
//   临期食品 maxStack 5 会**并堆** —— 从仓库拿的 2 瓶牛奶与货柜买的 3 瓶会合成同一堆、
//   共用一个 uid。按 uid 记账当场就分不清这堆里哪几瓶该退钱、哪几瓶该回仓库。
//   故只记「本次买了某 itemId 几件」, 退回时**先抵扣购买(退款), 剩下的算仓库来源**。
//   总量守恒与哪一堆并进了哪一堆无关, 怎么并都不会多出或蒸发东西。

import { create } from "zustand";
import { RULES } from "../engine";
import { getItemDef, makeItemStack } from "../data";
import { addToContainer, occupiedSlots, removeByUid } from "../items/inventory";
import type { ItemStack } from "../items/types";
import { useTownStore } from "./townStore";

export type SortieStep = "map" | "prep";

interface SortieStore {
  step: SortieStep;
  mapId: string | null;
  backpack: ItemStack[]; // 待带走的物资。容量 = RULES.burden.backpackSlots
  bought: Record<string, number>; // itemId → 本次买入且**尚未退掉**的件数

  open: () => void; // 据点大厅「出击」→ 从头开一次准备
  pickMap: (mapId: string) => void; // 选定地图 → 进物资准备
  backToMap: () => void; // 准备页「重选地图」(已装的物资保留)
  buy: (itemId: string) => boolean; // 货柜购买。false = 钱不够 / 背包满
  takeFromStorage: (uid: string) => boolean; // 仓库消耗品 → 背包。false = 背包满
  putBack: (uid: string) => void; // 背包里的一整堆退回来源
  cancel: () => void; // 取消出击: 全量回滚
  clear: () => void; // 出击成功后清空(不回滚 —— 东西跟着远征走了)
}

const EMPTY = {
  step: "map" as SortieStep,
  mapId: null,
  backpack: [] as ItemStack[],
  bought: {} as Record<string, number>,
};

// 背包已占格数。★ 与探索层同一个算法(items/inventory.occupiedSlots), 于是准备界面读到的
// 负重与出发后第一场战斗吃到的惩罚必然一致。
export const sortieUsedSlots = (backpack: ItemStack[]): number =>
  occupiedSlots(backpack, getItemDef);

// 把一整堆退回来源。★ 纯计算 + 副作用集中在这里, putBack 与 cancel 共用同一条规则,
//   两处各写一份必然在某次改动后对不上。返回新的 { backpack, bought }。
function refundStack(
  stack: ItemStack,
  backpack: ItemStack[],
  bought: Record<string, number>,
): { backpack: ItemStack[]; bought: Record<string, number> } {
  const def = getItemDef(stack.itemId);
  const price = def.buyValue ?? 0;

  // 先抵扣购买 —— 这堆里最多有 bought[itemId] 件是本次买的。
  const refundCount = Math.min(bought[stack.itemId] ?? 0, stack.count);
  if (refundCount > 0) {
    useTownStore.getState().bankLoot(refundCount * price);
  }

  // 剩下的是从仓库拿来的, 原样送回去。⚠ 重新实例化(新 uid)是无害的: 仓库不认 uid 身份,
  //   只有本会话内部的定位需要它, 而这一刻它已经离开本会话了。
  const rest = stack.count - refundCount;
  if (rest > 0) {
    useTownStore
      .getState()
      .deposit([makeItemStack(stack.itemId, rest, { affinity: stack.affinity, roll: stack.roll })]);
  }

  const nextBought = { ...bought };
  if (refundCount > 0) {
    const left = (nextBought[stack.itemId] ?? 0) - refundCount;
    if (left > 0) nextBought[stack.itemId] = left;
    else delete nextBought[stack.itemId];
  }
  return { backpack: removeByUid(backpack, stack.uid), bought: nextBought };
}

export const useSortieStore = create<SortieStore>((set, get) => ({
  ...EMPTY,

  open: () => set({ ...EMPTY }),

  pickMap: (mapId) => set({ mapId, step: "prep" }),

  // ★ 重选地图不清空背包: 玩家可能只是想换个难度, 没道理让他把补给重买一遍。
  backToMap: () => set({ step: "map" }),

  buy: (itemId) => {
    const price = getItemDef(itemId).buyValue;
    if (price == null) return false; // 没标价的东西不该出现在货柜里(护栏)

    const loot = useTownStore.getState().loot;
    if (loot < price) return false; // 与 townStore.buyShopItem 同写法: 买不起就什么都不发生

    // 容量与堆叠一律交给 addToContainer —— 食品 maxStack 5 的并堆规则只有它认识。
    const { backpack, bought } = get();
    const { next, overflow } = addToContainer(
      backpack,
      [makeItemStack(itemId, 1)],
      getItemDef,
      RULES.burden.backpackSlots,
    );
    if (overflow.length) return false; // 背包满: 整笔不生效, 钱也不扣

    useTownStore.setState({ loot: loot - price });
    set({ backpack: next, bought: { ...bought, [itemId]: (bought[itemId] ?? 0) + 1 } });
    return true;
  },

  takeFromStorage: (uid) => {
    const { backpack } = get();
    const town = useTownStore.getState();
    // ★ 先试算再真取: 装不下就不能把东西从仓库取出来, 否则它会卡在「既不在仓库也不在背包」。
    const peek = town.storage.find((s) => s.uid === uid);
    if (!peek) return false;
    const probe = addToContainer(backpack, [peek], getItemDef, RULES.burden.backpackSlots);
    if (probe.overflow.length) return false;

    if (!town.withdraw(uid)) return false;
    set({ backpack: probe.next });
    return true;
  },

  putBack: (uid) => {
    const { backpack, bought } = get();
    const stack = backpack.find((s) => s.uid === uid);
    if (!stack) return;
    set(refundStack(stack, backpack, bought));
  },

  // 取消出击 = 把背包里每一堆都退回来源, 状态完全回到进准备页之前。
  cancel: () => {
    let { backpack, bought } = get();
    // ⚠ 用 while 而不是 for...of: refundStack 每次返回**新的**数组, 边遍历边改原数组会漏。
    while (backpack.length) {
      const result = refundStack(backpack[0], backpack, bought);
      backpack = result.backpack;
      bought = result.bought;
    }
    set({ ...EMPTY });
  },

  clear: () => set({ ...EMPTY }),
}));
