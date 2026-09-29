// 探索手牌背包的操作按钮 —— 点击一张物品卡后, 操作卡(ItemActionCard)上列出哪些按钮。
//   模组给「装载」、模组箱给「拆箱」、其余有 use 效果的给「使用」(阶段不允许时置灰并写明理由),
//   可丢的给「丢弃」(原地二次确认)。

import { useCallback } from "react";
import { getItemDef } from "@/data";
import { canOpenBackpack, canUseItem } from "@/explore/session";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import { useBackpackModules } from "@/ui/explore/BackpackModules";

export function useBackpackSlotActions(onUseItem?: (stack: ItemStack) => void) {
  // 只订阅两个布尔值: 行走中的暗雷检定 / 扣粒子等提交不会重绘手牌。
  const editable = useExploreStore((state) => Boolean(state.session && canOpenBackpack(state.session)));
  const useAllowed = useExploreStore((state) => Boolean(state.session && canUseItem(state.session)));
  const discardItem = useExploreStore((state) => state.discardItem);
  const modules = useBackpackModules();
  const { isModule, isCrate, install, openCrate } = modules;

  const slotActions = useCallback((stack: ItemStack): SlotAction[] => {
    const def = getItemDef(stack.itemId);
    const actions: SlotAction[] = [];
    if (isModule(stack)) {
      actions.push({
        key: "install",
        label: "装载",
        tone: "module",
        icon: "install",
        onSelect: () => install(stack),
      });
    } else if (isCrate(stack)) {
      actions.push({
        key: "open",
        label: "拆箱",
        tone: "module",
        icon: "open",
        disabled: !useAllowed,
        hint: "本阶段不能拆箱",
        onSelect: () => openCrate(stack),
      });
    } else if (def.use) {
      actions.push({
        key: "use",
        label: "使用",
        tone: "primary",
        icon: "use",
        disabled: !useAllowed,
        hint: "本阶段不能使用消耗品",
        onSelect: () => onUseItem?.(stack),
      });
    }
    if (!def.undroppable) {
      actions.push({
        key: "discard",
        label: "丢弃",
        tone: "default",
        icon: "discard",
        confirmLabel: "确认丢弃",
        onSelect: () => discardItem(stack.uid),
      });
    }
    return actions;
  }, [discardItem, install, isCrate, isModule, onUseItem, openCrate, useAllowed]);

  return { editable, slotActions, overlay: modules.overlay };
}
