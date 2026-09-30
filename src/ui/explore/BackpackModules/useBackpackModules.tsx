// 探索背包里的模组 / 模组箱操作接线 —— 底部物品栏与大背包面板各接一次。
//   · 模组  → 「装载」: 拉起远征装配弹窗(来源 = 背包, 顶替下来的旧模组原位回格)。
//   · 模组箱 → 「拆箱」: 原地开箱(箱子那一格直接变成模组) → 开箱演出 → 可「立即装载」。
// 开箱与装配的结算都在 store/explore/moduleActions, 这里只管弹窗与演出的开关。

import { useCallback, useState, type ReactNode } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { openBackpackCrate } from "@/store/explore/moduleActions";
import { ExploreModuleInstall } from "@/ui/common/item/ModuleInstall";
import { ModuleCrateReveal } from "@/ui/common/item/ModuleCrateReveal";

interface Reveal {
  crateItemId: string;
  opened: ItemStack;
}

export interface BackpackModuleFlow {
  isModule: (stack: ItemStack) => boolean;
  isCrate: (stack: ItemStack) => boolean;
  install: (stack: ItemStack) => void;
  /** 拆箱; 阶段不允许或开不出东西时返回 false(物品不消耗)。 */
  openCrate: (stack: ItemStack) => boolean;
  /** 装配弹窗与开箱演出的挂载点(内部走 portal, 放在组件树任意位置即可)。 */
  overlay: ReactNode;
}

export function useBackpackModules(): BackpackModuleFlow {
  const [installing, setInstalling] = useState<ItemStack | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const isModule = useCallback((stack: ItemStack) => getItemDef(stack.itemId).category === "module", []);
  const isCrate = useCallback((stack: ItemStack) => getItemDef(stack.itemId).use?.kind === "openModuleCrate", []);

  const openCrate = useCallback((stack: ItemStack) => {
    const result = openBackpackCrate(stack.uid);
    if (!result) return false;
    setReveal({ crateItemId: stack.itemId, opened: result.opened });
    return true;
  }, []);

  const closeReveal = useCallback(() => setReveal(null), []);

  const overlay = (
    <>
      {reveal && (
        <ModuleCrateReveal
          crateItemId={reveal.crateItemId}
          opened={reveal.opened}
          placeNote="已放进背包，占用原来箱子的那一格"
          onInstall={() => {
            setInstalling(reveal.opened);
            setReveal(null);
          }}
          onClose={closeReveal}
        />
      )}
      {installing && (
        <ExploreModuleInstall stack={installing} onClose={() => setInstalling(null)} />
      )}
    </>
  );

  return { isModule, isCrate, install: setInstalling, openCrate, overlay };
}
