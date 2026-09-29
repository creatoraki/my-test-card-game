// 物品栏面板的单个有物格 —— 格子本体 + 可点击提示 + 分区标记 + 交互模式(格内遮罩 / 上方操作卡)。
// 空格很简单, 仍留在 ItemInventoryPanel 里直接画。

import { useRef, type FocusEvent, type PointerEvent } from "react";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { ItemActionMask, type SlotAction } from "@/ui/common/item/ItemActionMask";
import { ItemActionCard } from "@/ui/common/item/ItemActionCard";
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
  /** 非空 = 本格正处于交互模式, 盖遮罩(或浮出操作卡)并显示这些按钮。 */
  actions: readonly SlotAction[] | null;
  /** mask = 格内遮罩竖排按钮; card = 格子上方浮出操作卡。 */
  actionStyle: "mask" | "card";
  onClick: () => void;
  onDismiss: () => void;
  onEnter: (element: HTMLDivElement) => void;
  onLeave: () => void;
  /** 操作卡模式: 指针进 / 出操作卡(由 useSlotActionMode 做离开宽限)。 */
  onCardEnter?: () => void;
  onCardLeave?: () => void;
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
  onCardEnter,
  onCardLeave,
}: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const asCard = actionStyle === "card";
  return (
    <div
      ref={anchorRef}
      className={g["inventory-slot-anchor"]}
      data-inventory-uid={stack.uid}
      data-pulse={pulse ? "true" : undefined}
      data-active={actions ? "true" : undefined}
      {...(slotHint && !actions ? { "data-interactive-hint": "" } : null)}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => onEnter(event.currentTarget)}
      onPointerLeave={onLeave}
      onFocus={(event: FocusEvent<HTMLDivElement>) => onEnter(event.currentTarget)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        // 焦点只是在格内(格子 → 遮罩按钮), 或移进本格的操作卡时不算离开。
        const next = event.relatedTarget as Element | null;
        if (event.currentTarget.contains(next) || next?.closest("[data-item-action-card]")) return;
        onLeave();
      }}
    >
      <ItemSlot
        stack={stack}
        selected={selected || (asCard && Boolean(actions))}
        showName={false}
        onClick={onClick}
        className={cx(g["inventory-slot"], (selected || (asCard && actions)) && g["inventory-slot-selected"])}
      />
      {mark && <ItemSectionMark mark={mark} rowStart={rowStart} />}
      {slotHint && !actions && <InteractiveHint className={g["inventory-slot-hint"]} />}
      {actions && !asCard && <ItemActionMask actions={actions} onDismiss={onDismiss} />}
      {actions && asCard && (
        <ItemActionCard
          stack={stack}
          actions={actions}
          anchorRef={anchorRef}
          onDismiss={onDismiss}
          onPointerEnter={onCardEnter}
          onPointerLeave={onCardLeave}
        />
      )}
    </div>
  );
}
