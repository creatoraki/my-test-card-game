import { memo } from "react";
import { RULES } from "@/engine";
import { getItemDef } from "@/data";
import { backpackSlots, canOpenBackpack, canUseItem } from "@/explore/session";
import { useExploreStore } from "@/store/explore/exploreStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import type { SlotAction } from "@/ui/common/item/ItemActionMask";
import type { ItemStack } from "@/items/types";
import { useBackpackModules } from "@/ui/explore/BackpackModules";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./BackpackBar.module.css";

const COLS = 12;
const ROWS = 2;

// memo + 只订阅背包本身与两个布尔值: 行走中的暗雷检定 / 扣粒子等提交不会重绘这 24 格。
export default memo(function BackpackBar({
  onUseItem,
}: {
  // 「使用」入口: 由 ExploreScreen 接手(目标类消耗品进入头像选择流程, 其余立即生效)。
  onUseItem?: (stack: ItemStack) => void;
}) {
  const backpack = useExploreStore((state) => state.session?.backpack);
  const editable = useExploreStore((state) => Boolean(state.session && canOpenBackpack(state.session)));
  const useAllowed = useExploreStore((state) => Boolean(state.session && canUseItem(state.session)));
  const occupied = useExploreStore((state) => state.session ? backpackSlots(state.session) : 0);
  const discardItem = useExploreStore((state) => state.discardItem);
  const modules = useBackpackModules();

  if (!backpack) return null;

  // 操作卡按钮: 模组给「装载」、模组箱给「拆箱」、其余有 use 效果的给「使用」(阶段不允许时置灰并写明理由),
  // 可丢的给「丢弃」(原地二次确认)。
  const slotActions = (stack: ItemStack): SlotAction[] => {
    const def = getItemDef(stack.itemId);
    const actions: SlotAction[] = [];
    if (modules.isModule(stack)) {
      actions.push({
        key: "install",
        label: "装载",
        tone: "module",
        icon: "install",
        onSelect: () => modules.install(stack),
      });
    } else if (modules.isCrate(stack)) {
      actions.push({
        key: "open",
        label: "拆箱",
        tone: "module",
        icon: "open",
        disabled: !useAllowed,
        hint: "本阶段不能拆箱",
        onSelect: () => modules.openCrate(stack),
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
  };

  return (
    <>
      <ItemInventoryPanel
        className={s.bar}
        stacks={backpack}
        rows={ROWS}
        columns={COLS}
        compact
        sectioned
        title="背包"
        capacity={RULES.burden.backpackSlots}
        occupied={occupied}
        gridLabel="随身背包格位"
        panelId="explore-backpack-bar"
        colorMap={EXPLORE_BACKPACK_COLORS}
        selectedUid={null}
        // 阶段不允许动背包时不给「可点击」提示、也不进交互模式 —— 亮了却点不动比不亮更糟。
        slotHint={editable}
        slotActions={editable ? slotActions : undefined}
        actionStyle="card"
      />
      {modules.overlay}
    </>
  );
});
