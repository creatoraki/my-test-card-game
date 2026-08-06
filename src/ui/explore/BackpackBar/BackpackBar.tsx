import { RULES } from "@/engine";
import { backpackSlots, canOpenBackpack } from "@/explore/session";
import { useExploreStore } from "@/store/exploreStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./BackpackBar.module.css";

const COLS = 8;
const ROWS = 3;

export default function BackpackBar() {
  const session = useExploreStore((state) => state.session);
  const discardItem = useExploreStore((state) => state.discardItem);
  const reorder = useExploreStore((state) => state.reorderBackpack);

  if (!session) return null;

  const backpack = session.backpack;
  const editable = canOpenBackpack(session);

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
      contextMenuItems={
        editable
          ? (stack) => [
              {
                key: "discard",
                label: "丢弃",
                danger: true,
                onSelect: () => discardItem(stack.uid),
              },
            ]
          : undefined
      }
    />
  );
}
