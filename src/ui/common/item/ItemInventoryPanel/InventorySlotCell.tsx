// 物品栏面板的单个有物格 —— 格子本体 + 可点击提示 + 分区标记 + 交互模式(格内遮罩 / 详情浮层内操作区)。
// 空格很简单, 仍留在 ItemInventoryPanel 里直接画。

import type { FocusEvent, PointerEvent } from "react";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { ItemActionMask, type SlotAction } from "@/ui/common/item/ItemActionMask";
import { ItemSectionMark } from "@/ui/common/item/ItemSectionMark";
import type { SectionMark } from "@/ui/common/item/shared/itemSections";
import { InteractiveHint } from "@/ui/common/tooltip/InteractiveHint";
import { cx } from "@/ui/common/shared/cx";
import g from "./ItemInventoryPanel.grid.module.css";

interface Props {
  stack: ItemStack;
  selected: boolean;
  pulse: boolean;
  slotHint: boolean;
  /** 分区标记; 不分区的面板不传。 */
  mark?: SectionMark;
  rowStart: boolean;
  /** 非空 = 本格正处于交互模式。mask 模式在格内盖遮罩显示这些按钮; tooltip 模式按钮由面板画进详情浮层, 本格只高亮。 */
  actions: readonly SlotAction[] | null;
  /** mask = 格内遮罩竖排按钮; tooltip = 详情浮层底部展开操作区。 */
  actionStyle: "mask" | "tooltip";
  onClick: () => void;
  onDismiss: () => void;
  onEnter: (element: HTMLDivElement) => void;
  onLeave: () => void;
}

export function InventorySlotCell({
  stack,
  selected,
  pulse,
  slotHint,
  mark,
  rowStart,
  actions,
  actionStyle,
  onClick,
  onDismiss,
  onEnter,
  onLeave,
}: Props) {
  const inTooltip = actionStyle === "tooltip";
  const highlighted = selected || (inTooltip && Boolean(actions));
  return (
    <div
      className={g["inventory-slot-anchor"]}
      data-inventory-uid={stack.uid}
      data-pulse={pulse ? "true" : undefined}
      data-active={actions ? "true" : undefined}
      {...(slotHint && !actions ? { "data-interactive-hint": "" } : null)}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => onEnter(event.currentTarget)}
      onPointerLeave={onLeave}
      onFocus={(event: FocusEvent<HTMLDivElement>) => onEnter(event.currentTarget)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        // 焦点只是在格内(格子 → 遮罩按钮), 或移进详情浮层的操作区时不算离开。
        const next = event.relatedTarget as Element | null;
        if (event.currentTarget.contains(next) || next?.closest("[data-item-action-tooltip]")) return;
        onLeave();
      }}
    >
      <ItemSlot
        stack={stack}
        selected={highlighted}
        showName={false}
        onClick={onClick}
        className={cx(g["inventory-slot"], highlighted && g["inventory-slot-selected"])}
      />
      {mark && <ItemSectionMark mark={mark} rowStart={rowStart} />}
      {slotHint && !actions && <InteractiveHint className={g["inventory-slot-hint"]} />}
      {actions && !inTooltip && <ItemActionMask actions={actions} onDismiss={onDismiss} />}
    </div>
  );
}
