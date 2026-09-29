// 物品栏面板的单个有物格 —— 格子本体 + 可点击提示 + 分区标记 + 交互模式遮罩。
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
  /** 非空 = 本格正处于交互模式, 盖遮罩并显示这些按钮。 */
  actions: readonly SlotAction[] | null;
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
  onClick,
  onDismiss,
  onEnter,
  onLeave,
}: Props) {
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
        // 焦点只是在格内(格子 → 遮罩按钮)移动时不算离开。
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onLeave();
      }}
    >
      <ItemSlot
        stack={stack}
        selected={selected}
        showName={false}
        onClick={onClick}
        className={cx(g["inventory-slot"], selected && g["inventory-slot-selected"])}
      />
      {mark && <ItemSectionMark mark={mark} rowStart={rowStart} />}
      {slotHint && !actions && <InteractiveHint className={g["inventory-slot-hint"]} />}
      {actions && <ItemActionMask actions={actions} onDismiss={onDismiss} />}
    </div>
  );
}
