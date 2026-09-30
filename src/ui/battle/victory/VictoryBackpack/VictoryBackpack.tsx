import { useEffect, useMemo, useState, type CSSProperties, type FocusEvent } from "react";
import type { ItemStack } from "@/items/types";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import { ItemActionMask, useSlotActionMode, type SlotAction } from "@/ui/common/item/ItemActionMask";
import { ItemSectionMark } from "@/ui/common/item/ItemSectionMark";
import { sectionMarks, sortBySection } from "@/ui/common/item/shared/itemSections";
import { inventoryThemeVars } from "@/ui/common/item/shared/inventoryTheme";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import { VictoryPlaque } from "@/ui/battle/victory/VictoryPlaque";
import { cx } from "@/ui/common/shared/cx";
import victoryCell from "@/ui/battle/styles/victoryCell.module.css";
import s from "./VictoryBackpack.module.css";

export interface VictoryBackpackProps {
  stacks: readonly ItemStack[];
  rows: number;
  columns: number;
  pulseUids?: ReadonlySet<string>;
  /** 点击物品进入交互模式时的遮罩按钮; 返回空数组 = 这一格不进交互模式。 */
  slotActions?: (stack: ItemStack) => SlotAction[];
}

const positiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

interface HoveredItem {
  uid: string;
  point: TooltipPoint;
}

/** 胜利结算的回收背包: 与探索底部背包同一套分区排序与点击交互(见 shared/itemSections、ItemActionMask)。 */
export default function VictoryBackpack({
  stacks,
  rows,
  columns,
  pulseUids,
  slotActions,
}: VictoryBackpackProps) {
  const safeRows = positiveInteger(rows, 1);
  const safeColumns = positiveInteger(columns, 1);
  const cellCount = safeRows * safeColumns;
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const ordered = useMemo(() => sortBySection(stacks), [stacks]);
  const marks = useMemo(() => sectionMarks(ordered), [ordered]);
  const uids = useMemo(() => stacks.map((stack) => stack.uid), [stacks]);
  const actionMode = useSlotActionMode(uids);

  useEffect(() => {
    if (hoveredItem && !stacks.some((stack) => stack.uid === hoveredItem.uid)) {
      setHoveredItem(null);
    }
  }, [hoveredItem, stacks]);

  const cells = useMemo(
    () => [
      ...ordered,
      ...Array.from({ length: Math.max(0, cellCount - ordered.length) }, () => null),
    ],
    [cellCount, ordered],
  );
  const themeStyle = inventoryThemeVars(VICTORY_INVENTORY_COLORS, safeColumns);
  const style = {
    ...themeStyle,
    "--victory-cols": safeColumns,
  } as CSSProperties;
  const hoveredStack = hoveredItem
    ? stacks.find((stack) => stack.uid === hoveredItem.uid) ?? null
    : null;

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
    setHoveredItem({ uid: stack.uid, point });
  };

  const hideTooltip = (uid: string) => {
    setHoveredItem((current) => (current?.uid === uid ? null : current));
  };

  const actionsOf = (stack: ItemStack) => slotActions?.(stack) ?? [];

  return (
    <section
      id="victory-backpack-panel"
      className={s.backpack}
      style={style}
      aria-labelledby="victory-backpack-title"
    >
      <div className={s.row}>
        <VictoryPlaque
          label="回收背包"
          titleId="victory-backpack-title"
          variant="backpack"
        />
        <div className={cx(victoryCell.grid, s.grid)} role="group" aria-label="回收背包格位">
          {cells.map((stack, index) => {
            if (!stack) {
              return (
                <div key={`empty-${index}`} className={cx(victoryCell.cell, s.anchor)}>
                  <EmptySlot className={victoryCell.empty} />
                </div>
              );
            }
            const actions = actionMode.activeUid === stack.uid ? actionsOf(stack) : [];
            return (
              <div
                key={stack.uid}
                className={cx(victoryCell.cell, s.anchor)}
                data-inventory-uid={stack.uid}
                data-pulse={pulseUids?.has(stack.uid) ? "true" : undefined}
                data-active={actions.length ? "true" : undefined}
                onPointerEnter={(event) =>
                  showTooltip(stack, tooltipPointFromElement(event.currentTarget, "top"))
                }
                onPointerLeave={() => {
                  hideTooltip(stack.uid);
                  actionMode.closeIf(stack.uid);
                }}
                onFocus={(event: FocusEvent<HTMLDivElement>) =>
                  showTooltip(stack, tooltipPointFromElement(event.currentTarget, "top"))
                }
                onBlur={(event: FocusEvent<HTMLDivElement>) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                  hideTooltip(stack.uid);
                  actionMode.closeIf(stack.uid);
                }}
              >
                <ItemSlot
                  stack={stack}
                  showName={false}
                  className={s.slot}
                  onClick={() => {
                    if (actionsOf(stack).length) actionMode.open(stack.uid);
                  }}
                />
                <ItemSectionMark mark={marks[index]} rowStart={index % safeColumns === 0} />
                {actions.length > 0 && <ItemActionMask actions={actions} onDismiss={actionMode.close} />}
              </div>
            );
          })}
        </div>
      </div>

      {hoveredStack && hoveredItem && (
        <ItemTooltip stack={hoveredStack} point={hoveredItem.point} themeStyle={themeStyle} />
      )}
    </section>
  );
}

export { VictoryBackpack };
