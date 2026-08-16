import { RULES } from "@/engine";
import { getItemDef } from "@/data";
import { backpackSlots, canOpenBackpack, canUseItem } from "@/explore/session";
import { useExploreStore } from "@/store/exploreStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import type { ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import type { ItemStack } from "@/items/types";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./BackpackBar.module.css";

const COLS = 8;
const ROWS = 3;

export default function BackpackBar({
  onUseItem,
}: {
  // 「使用」入口: 由 ExploreScreen 接手(目标类消耗品进入头像选择流程, 其余立即生效)。
  onUseItem?: (stack: ItemStack) => void;
}) {
  const session = useExploreStore((state) => state.session);
  const discardItem = useExploreStore((state) => state.discardItem);
  const reorder = useExploreStore((state) => state.reorderBackpack);

  if (!session) return null;

  const backpack = session.backpack;
  const editable = canOpenBackpack(session);
  const useAllowed = canUseItem(session);

  const contextMenuItems = (stack: ItemStack): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    // 只有带 use 效果的消耗品才给出「使用」入口; 阶段不允许时保留入口但置灰。
    if (getItemDef(stack.itemId).use) {
      items.push({
        key: "use",
        label: "使用",
        disabled: !useAllowed,
        onSelect: () => onUseItem?.(stack),
      });
    }
    items.push({
      key: "discard",
      label: "丢弃",
      danger: true,
      onSelect: () => discardItem(stack.uid),
    });
    return items;
  };

  return (
    <ItemInventoryPanel
      className={s.bar}
      stacks={backpack}
      rows={ROWS}
      columns={COLS}
      compact
      title="背包"
      capacity={RULES.burden.backpackSlots}
      occupied={backpackSlots(session)}
      gridLabel="随身背包格位"
      panelId="explore-backpack-bar"
      colorMap={EXPLORE_BACKPACK_COLORS}
      selectedUid={null}
      onReorder={
        editable
          ? (from, to) => {
              const stack = backpack[from];
              if (stack) reorder(stack.uid, to);
            }
          : undefined
      }
      contextMenuItems={editable ? contextMenuItems : undefined}
    />
  );
}
