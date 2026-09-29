// 卡牌模组 —— 装配 / 顶替 / 卸下、仓库拆模组箱与装配舱制造。
//
// ★ 装配校验的唯一真相点是 replaceModuleStack: 仓库装配、远征途中从背包或待拾取框装载
//   都走它, 差别只在调用方把新模组从哪个容器扣掉、被顶下来的旧模组放回哪个容器。

import {
  canEquipModule,
  craftCheck,
  getItemDef,
  getModuleRecipe,
  makeItemStack,
  pickModuleFromCrate,
  recomputeCardModule,
} from "@/data";
import { removeByUid } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import type { TownGet, TownSet, TownStore } from "../town/townTypes";

export type CardModuleSlice = Pick<
  TownStore,
  | "equipCardModule"
  | "installModuleStack"
  | "replaceModuleStack"
  | "installStoredModule"
  | "unequipCardModule"
  | "openStoredCrate"
  | "craftModule"
>;

const randomIndex = (length: number) => Math.min(length - 1, Math.floor(Math.random() * length));

export function createCardModuleSlice(set: TownSet, get: TownGet): CardModuleSlice {
  return {
    equipCardModule: (charId, cardUid, moduleUid) => {
      const moduleStack = get().storage.find((stack) => stack.uid === moduleUid);
      if (!moduleStack) return;
      // ★ 先装、装成了才扣仓库 —— 校验全在 installModuleStack 里, 这里不重复一遍。
      if (get().installModuleStack(charId, cardUid, moduleStack))
        set({ storage: removeByUid(get().storage, moduleUid) });
    },

    // 只装空槽的薄封装: 卡上已有模组直接拒绝(装配舱的「装配 / 卸下」按钮是分开的)。
    installModuleStack: (charId, cardUid, moduleStack) => {
      const card = get().characters[charId]?.deck.find((entry) => entry.uid === cardUid);
      if (!card || card.cardModule) return false;
      return get().replaceModuleStack(charId, cardUid, moduleStack) !== null;
    },

    // 装配核心: 允许顶替。成功返回 { replaced }(被顶下来的旧模组, 空槽则为 null), 失败返回 null。
    // ⚠ 旧模组只交出、不决定去向 —— 背包 / 待拾取框 / 仓库由调用方各自处理。
    replaceModuleStack: (charId, cardUid, moduleStack) => {
      const { characters } = get();
      const cs = characters[charId];
      const card = cs?.deck.find((entry) => entry.uid === cardUid);
      if (!cs || !card) return null;
      if (getItemDef(moduleStack.itemId).category !== "module") return null;
      if (!canEquipModule(card, moduleStack.itemId)) return null;

      const replaced: ItemStack | null = card.cardModule
        ? { uid: card.cardModule.uid, itemId: card.cardModule.itemId, count: 1 }
        : null;
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
      return { replaced };
    },

    // 仓库里的「装载」: 新模组出仓, 顶下来的旧模组回仓。
    installStoredModule: (charId, cardUid, uid) => {
      const moduleStack = get().storage.find((stack) => stack.uid === uid);
      if (!moduleStack) return false;
      const result = get().replaceModuleStack(charId, cardUid, moduleStack);
      if (!result) return false;
      const rest = removeByUid(get().storage, uid);
      set({ storage: result.replaced ? [...rest, result.replaced] : rest });
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

    // 仓库拆模组箱: 箱子出仓、开出的模组入仓, 返回开出的那件给 UI 做开箱演出。
    // ★ 据点不走探索的种子 rng, 直接 Math.random; 开箱池与探索共用 data/cardModules/crates。
    openStoredCrate: (uid) => {
      const { storage } = get();
      const crate = storage.find((stack) => stack.uid === uid);
      const use = crate ? getItemDef(crate.itemId).use : undefined;
      if (!crate || use?.kind !== "openModuleCrate") return null;
      const itemId = pickModuleFromCrate(use.tier, randomIndex);
      if (!itemId) return null;

      const opened = makeItemStack(itemId);
      const rest = crate.count > 1
        ? storage.map((stack) => (stack.uid === uid ? { ...stack, count: stack.count - 1 } : stack))
        : removeByUid(storage, uid);
      set({ storage: [...rest, opened] });
      return opened;
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
