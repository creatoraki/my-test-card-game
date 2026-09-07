// 库存清单与回收台共用的物品网格。
// ★ 与探索背包共用同一个 ItemSlot 与同一套 tab —— 这就是把格子抽成组件的全部意义。
//   区别只有一条: 这里**没有格数上限**, 用 auto-fill 的流式网格 + 滚动。

import { useEffect, useState } from "react";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import s from "./StockPanels.module.css";
import { RECYCLE_TOOLTIP_THEME } from "./tooltipTheme";

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
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState<TooltipPoint | null>(null);
  const hoveredStack = shown.find((stack) => stack.uid === hoveredUid) ?? null;

  useEffect(() => {
    if (hoveredUid && !shown.some((stack) => stack.uid === hoveredUid)) {
      setHoveredUid(null);
      setTooltipPoint(null);
    }
  }, [hoveredUid, shown]);

  if (!shown.length) return <p className={s.empty}>{empty}</p>;

  return (
    <>
      <div className={s.grid}>
        {shown.map((stack) => (
          <div
            className={s.cell}
            key={stack.uid}
            onPointerEnter={(event) => {
              setHoveredUid(stack.uid);
              setTooltipPoint(tooltipPointFromElement(event.currentTarget));
            }}
            onPointerLeave={() => {
              setHoveredUid((current) => (current === stack.uid ? null : current));
              setTooltipPoint(null);
            }}
            onFocus={(event) => {
              setHoveredUid(stack.uid);
              setTooltipPoint(tooltipPointFromElement(event.currentTarget));
            }}
            onBlur={() => {
              setHoveredUid((current) => (current === stack.uid ? null : current));
              setTooltipPoint(null);
            }}
          >
            <ItemSlot
              stack={stack}
              selected={isSelected(stack)}
              onClick={() => onSelect(stack.uid)}
            />
          </div>
        ))}
      </div>
      {hoveredStack && tooltipPoint && (
        <ItemTooltip stack={hoveredStack} point={tooltipPoint} themeStyle={RECYCLE_TOOLTIP_THEME} />
      )}
    </>
  );
}
