import { useEffect, useMemo, useState, type CSSProperties, type FocusEvent } from "react";
import { getItemDef } from "@/data";
import { occupiedSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemContextMenu, { type ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import s from "./VictoryBackpack.module.css";

export interface VictoryBackpackProps {
  stacks: readonly ItemStack[];
  rows: number;
  columns: number;
  capacity: number;
  pulseUids?: ReadonlySet<string>;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  contextMenuItems?: (stack: ItemStack) => ContextMenuItem[];
}

const positiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

interface HoveredItem {
  uid: string;
  point: TooltipPoint;
}

export default function VictoryBackpack({
  stacks,
  rows,
  columns,
  capacity,
  pulseUids,
  onReorder,
  contextMenuItems,
}: VictoryBackpackProps) {
  const safeRows = positiveInteger(rows, 1);
  const safeColumns = positiveInteger(columns, 1);
  const cellCount = safeRows * safeColumns;
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  useEffect(() => {
    if (hoveredItem && !stacks.some((stack) => stack.uid === hoveredItem.uid)) {
      setHoveredItem(null);
    }
  }, [hoveredItem, stacks]);

  useEffect(() => {
    if (menu) setMenu(null);
  }, [stacks]);

  const cells = useMemo(
    () => [
      ...stacks,
      ...Array.from({ length: Math.max(0, cellCount - stacks.length) }, () => null),
    ],
    [cellCount, stacks],
  );
  const displayedOccupied = useMemo(
    () => occupiedSlots(Array.from(stacks), getItemDef),
    [stacks],
  );
  const displayedCapacity = Number.isFinite(capacity)
    ? Math.max(0, Math.floor(capacity))
    : cellCount;
  const themeStyle = inventoryThemeVars(VICTORY_INVENTORY_COLORS, safeColumns);
  const style = {
    ...themeStyle,
    "--victory-bp-columns": safeColumns,
  } as CSSProperties;
  const hoveredStack = hoveredItem
    ? stacks.find((stack) => stack.uid === hoveredItem.uid) ?? null
    : null;

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
    if (dragIndex != null) return;
    setHoveredItem({ uid: stack.uid, point });
  };

  const hideTooltip = (uid: string) => {
    setHoveredItem((current) => (current?.uid === uid ? null : current));
  };

  return (
    <section
      id="victory-backpack-panel"
      className={s.backpack}
      style={style}
      aria-labelledby="victory-backpack-title"
    >
      <header className={s.heading}>
        <h2 id="victory-backpack-title">回收背包</h2>
        <span className={s.readout}>
          <strong>{displayedOccupied}</strong>
          <em>/ {displayedCapacity}</em>
        </span>
      </header>

      <div className={s.grid} role="group" aria-label="回收背包格位">
        {cells.map((stack, index) =>
          stack ? (
            <div
              key={stack.uid}
              className={s.anchor}
              draggable={onReorder ? true : undefined}
              data-dragging={dragIndex === index ? "true" : undefined}
              data-drop={dropIndex === index ? "true" : undefined}
              data-inventory-uid={stack.uid}
              data-pulse={pulseUids?.has(stack.uid) ? "true" : undefined}
              onDragStart={(event) => {
                if (!onReorder) return;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", stack.uid);
                setDragIndex(index);
                hideTooltip(stack.uid);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDropIndex(null);
              }}
              onDragOver={(event) => {
                if (dragIndex == null || !onReorder) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropIndex(index);
              }}
              onDragLeave={() => setDropIndex((current) => (current === index ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex != null && dragIndex !== index) onReorder?.(dragIndex, index);
                setDragIndex(null);
                setDropIndex(null);
              }}
              onContextMenu={(event) => {
                const items = contextMenuItems?.(stack) ?? [];
                if (!items.length) return;
                event.preventDefault();
                event.stopPropagation();
                setMenu({ x: event.clientX, y: event.clientY, items });
              }}
              onPointerEnter={(event) =>
                showTooltip(stack, tooltipPointFromElement(event.currentTarget))
              }
              onPointerLeave={() => hideTooltip(stack.uid)}
              onFocus={(event: FocusEvent<HTMLDivElement>) =>
                showTooltip(stack, tooltipPointFromElement(event.currentTarget))
              }
              onBlur={() => hideTooltip(stack.uid)}
            >
              <ItemSlot
                stack={stack}
                showName={false}
                className={s.slot}
              />
            </div>
          ) : (
            <div
              key={`empty-${index}`}
              className={s.anchor}
              data-drop={dropIndex === index ? "true" : undefined}
              onDragOver={(event) => {
                if (dragIndex == null || !onReorder) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropIndex(index);
              }}
              onDragLeave={() => setDropIndex((current) => (current === index ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex != null && onReorder && stacks.length > 0) {
                  onReorder(dragIndex, stacks.length - 1);
                }
                setDragIndex(null);
                setDropIndex(null);
              }}
            >
              <EmptySlot className={s.empty} />
            </div>
          ),
        )}
      </div>

      {hoveredStack && hoveredItem && (
        <ItemTooltip stack={hoveredStack} point={hoveredItem.point} themeStyle={themeStyle} />
      )}
      {menu && <ItemContextMenu {...menu} themeStyle={themeStyle} onClose={() => setMenu(null)} />}
    </section>
  );
}

export { VictoryBackpack };