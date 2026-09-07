// 库存清单与回收台共用的物品网格。
// ★ 与探索背包共用同一个 ItemSlot 与同一套 tab —— 这就是把格子抽成组件的全部意义。
//   区别只有一条: 这里**没有格数上限**, 用 auto-fill 的流式网格 + 滚动。

import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import s from "./StockPanels.module.css";

export interface ItemGridProps {
  stacks: ItemStack[];
  tab: ItemTab;
  equipTab: EquipTab;
  /** 选中判定: 库存清单是单选(uid 相等), 回收台是多选(在勾选表里)。 */
  isSelected: (stack: ItemStack) => boolean;
  onSelect: (uid: string) => void;
  empty: string;
}

export function ItemGrid({ stacks, tab, equipTab, isSelected, onSelect, empty }: ItemGridProps) {
  const shown = stacks.filter((stack) => matchTab(stack, tab, equipTab));
  if (!shown.length) return <p className={s.empty}>{empty}</p>;
  return (
    <div className={s.grid}>
      {shown.map((stack) => (
        <ItemSlot
          key={stack.uid}
          stack={stack}
          selected={isSelected(stack)}
          onClick={() => onSelect(stack.uid)}
        />
      ))}
    </div>
  );
}
