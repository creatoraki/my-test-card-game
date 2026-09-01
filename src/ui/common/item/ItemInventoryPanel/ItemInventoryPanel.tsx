import {
  useEffect,
  useMemo,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { getItemDef } from "@/data";
import { occupiedSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemContextMenu, { type ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { cx } from "@/ui/common/cx";
import { inventoryThemeVars, type InventoryColorMap } from "@/ui/common/item/inventoryTheme";
import s from "./ItemInventoryPanel.module.css";

export type { InventoryColorMap } from "@/ui/common/item/inventoryTheme";

export type SelectedInfoRenderer = (stack: ItemStack | null) => ReactNode;

export interface ItemInventoryPanelProps {
  stacks: readonly ItemStack[];
  rows: number;
  columns: number;
  kicker?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  compact?: boolean;
  credits?: number | string;
  creditsLabel?: ReactNode;
  capacity?: number;
  occupied?: number;
  capacityLabel?: ReactNode;
  gridLabel?: string;
  selectedUid?: string | null;
  defaultSelectedUid?: string | null;
  onSelect?: (stack: ItemStack | null) => void;
  renderSelectedInfo?: SelectedInfoRenderer;
  /** 传了才启用左键拖动排序。fromIndex/toIndex 是 stacks 数组下标。 */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** 传了才启用右键菜单。返回空数组 = 这一格不弹菜单。 */
  contextMenuItems?: (stack: ItemStack) => ContextMenuItem[];
  footer?: ReactNode;
  panelId?: string;
  colorMap?: InventoryColorMap;
  /** 由容器传入需要短暂高亮的物品 uid, 例如飞入背包后的落点反馈。 */
  pulseUids?: ReadonlySet<string>;
  /** 开启后, 悬浮到**有物品**的格子时在格外浮出统一的「可点击」四角提示; 空格不给提示。 */
  slotHint?: boolean;
  className?: string;
}

const positiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

const nonNegativeInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

interface HoveredItem {
  uid: string;
  point: TooltipPoint;
}

export default function ItemInventoryPanel({
  stacks,
  rows,
  columns,
  kicker = "SECTOR-03 // INVENTORY TERMINAL",
  title = "物品终端",
  subtitle,
  compact = false,
  credits,
  creditsLabel = "pts",
  capacity,
  occupied,
  capacityLabel = "CAPACITY",
  gridLabel = "物品栏格位",
  selectedUid,
  defaultSelectedUid = null,
  onSelect,
  renderSelectedInfo,
  onReorder,
  contextMenuItems,
  footer,
  panelId = "item-inventory-panel",
  colorMap,
  pulseUids,
  slotHint = false,
  className,
}: ItemInventoryPanelProps) {
  const safeRows = positiveInteger(rows, 1);
  const safeColumns = positiveInteger(columns, 1);
  const cellCount = safeRows * safeColumns;
  const isControlled = selectedUid !== undefined;
  const [internalSelectedUid, setInternalSelectedUid] = useState<string | null>(
    defaultSelectedUid,
  );
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const activeSelectedUid = isControlled ? selectedUid : internalSelectedUid;
  const selectedStack =
    stacks.find((stack) => stack.uid === activeSelectedUid) ?? null;
  const hoveredStack = hoveredItem
    ? stacks.find((stack) => stack.uid === hoveredItem.uid) ?? null
    : null;

  useEffect(() => {
    if (!isControlled || !activeSelectedUid) return;
    if (!stacks.some((stack) => stack.uid === activeSelectedUid)) {
      setInternalSelectedUid(null);
    }
  }, [activeSelectedUid, isControlled, stacks]);

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
  const derivedOccupied = useMemo(
    () => occupiedSlots(Array.from(stacks), getItemDef),
    [stacks],
  );
  const displayedOccupied =
    occupied == null ? derivedOccupied : nonNegativeInteger(occupied, derivedOccupied);
  const displayedCapacity =
    capacity == null ? cellCount : nonNegativeInteger(capacity, cellCount);
  const style = inventoryThemeVars(colorMap, safeColumns);

  const handleSelect = (stack: ItemStack) => {
    const nextStack = activeSelectedUid === stack.uid ? null : stack;
    const nextUid = nextStack?.uid ?? null;
    if (!isControlled) setInternalSelectedUid(nextUid);
    onSelect?.(nextStack);
  };

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
    if (dragIndex != null) return;
    setHoveredItem({ uid: stack.uid, point });
  };

  const hideTooltip = (uid: string) => {
    setHoveredItem((current) => (current?.uid === uid ? null : current));
  };

  const selectedInfo = renderSelectedInfo ? (
    renderSelectedInfo(selectedStack)
  ) : (
    <DefaultSelectedInfo stack={selectedStack} />
  );

  return (
    <section
      id={panelId}
      className={cx(s["inventory-panel"], className)}
      style={style}
      data-compact={compact ? "true" : undefined}
      aria-labelledby={`${panelId}-title`}
    >
      <span className={s["inventory-tech-border"]} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-top"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-bottom"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-left"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-right"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-tl"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-tr"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-bl"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-br"])} aria-hidden="true" />

      <div className={s["inventory-content"]}>
        <header className={s["inventory-header"]}>
          <div className={s["inventory-heading"]}>
            {!compact && <span className={s["inventory-kicker"]}>{kicker}</span>}
            <h2 id={`${panelId}-title`} className={s["inventory-title"]}>
              {title}
            </h2>
            {!compact && (
              <p className={s["inventory-subtitle"]}>
                {subtitle ?? (
                  <>
                    ROUTE: <span className={s["inventory-subtitle-active"]}>ACTIVE</span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className={s["inventory-readout"]}>
            {!compact && credits != null && (
              <div className={s["inventory-credits"]}>
                <span>
                  {typeof credits === "number" ? credits.toLocaleString("en-US") : credits}
                </span>
                <small>{creditsLabel}</small>
              </div>
            )}
            <div className={s["inventory-capacity"]}>
              {!compact && <span>{capacityLabel}</span>}
              <strong>{displayedOccupied}</strong>
              <em>/ {displayedCapacity}</em>
            </div>
          </div>
        </header>

        <div className={s["inventory-tray"]}>
          <div className={s["inventory-grid"]} role="group" aria-label={gridLabel}>
            {cells.map((stack, index) =>
              stack ? (
                <div
                  key={stack.uid}
                  className={s["inventory-slot-anchor"]}
                  draggable={onReorder ? true : undefined}
                  data-dragging={dragIndex === index ? "true" : undefined}
                  data-drop={dropIndex === index ? "true" : undefined}
                  data-inventory-uid={stack.uid}
                  data-pulse={pulseUids?.has(stack.uid) ? "true" : undefined}
                  {...(slotHint ? { "data-interactive-hint": "" } : null)}
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
                    selected={activeSelectedUid === stack.uid}
                    showName={false}
                    onClick={() => handleSelect(stack)}
                    className={cx(
                      s["inventory-slot"],
                      activeSelectedUid === stack.uid && s["inventory-slot-selected"],
                    )}
                  />
                  {slotHint && <InteractiveHint className={s["inventory-slot-hint"]} />}
                </div>
              ) : (
                <div
                  key={`empty-${index}`}
                  className={cx(s["inventory-slot-anchor"], s["inventory-empty-anchor"])}
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
                  <EmptySlot className={s["inventory-empty"]} />
                </div>
              ),
            )}
          </div>
        </div>

        {!compact && (
          <footer className={s["inventory-footer"]}>
            <div className={s["inventory-selected"]} aria-live="polite">
              {selectedInfo}
            </div>
            {footer && <div className={s["inventory-actions"]}>{footer}</div>}
          </footer>
        )}
      </div>
      {hoveredStack && hoveredItem && (
        <ItemTooltip stack={hoveredStack} point={hoveredItem.point} themeStyle={style} />
      )}
      {menu && <ItemContextMenu {...menu} themeStyle={style} onClose={() => setMenu(null)} />}
    </section>
  );
}

function DefaultSelectedInfo({ stack }: { stack: ItemStack | null }) {
  if (!stack) {
    return (
      <>
        <span className={s["inventory-selected-label"]}>NO ITEM SELECTED</span>
        <span className={s["inventory-selected-empty"]}>选择一件物品查看详情</span>
      </>
    );
  }

  const def = getItemDef(stack.itemId);
  return (
    <>
      <span className={s["inventory-selected-label"]}>ITEM // {def.id.toUpperCase()}</span>
      <strong className={s["inventory-selected-name"]}>{def.name}</strong>
      <span className={s["inventory-selected-meta"]}>
        {stack.count > 1 && `数量 ${stack.count} · `}
        {def.sellValue != null ? `单价 ${def.sellValue} pts` : "待处理物品"}
      </span>
    </>
  );
}