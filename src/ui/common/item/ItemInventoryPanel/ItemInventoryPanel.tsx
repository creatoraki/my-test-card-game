import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { getItemDef } from "@/data";
import { occupiedSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemContextMenu, { type ContextMenuItem } from "@/ui/common/item/ItemContextMenu";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import s from "./ItemInventoryPanel.module.css";

export interface InventoryColorMap {
  panel?: string;
  panelDeep?: string;
  panelGlow?: string;
  panelLine?: string;
  frame?: string;
  frameHot?: string;
  accent?: string;
  accentAlt?: string;
  text?: string;
  muted?: string;
  tray?: string;
  trayBorder?: string;
  slot?: string;
  slotBorder?: string;
  slotHover?: string;
  selected?: string;
  selectedGlow?: string;
  emptySlot?: string;
}

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
  className?: string;
}

const DEFAULT_COLORS: Required<InventoryColorMap> = {
  panel: "#050a15e6",
  panelDeep: "#020712e6",
  panelGlow: "#00f3ff10",
  panelLine: "#00f3ff2b",
  frame: "#00f3ff",
  frameHot: "#8cffff",
  accent: "#00f3ff",
  accentAlt: "#ff0080",
  text: "#ffffff",
  muted: "#7a8fa6",
  tray: "#0000004d",
  trayBorder: "#00f3ff1a",
  slot: "#001432cc",
  slotBorder: "#00f3ff1f",
  slotHover: "#00325099",
  selected: "#ff0080",
  selectedGlow: "#ff008066",
  emptySlot: "#00f3ff0d",
};

const positiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

const nonNegativeInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

const TOOLTIP_WIDTH = 260;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const TOOLTIP_GAP = 18;

interface TooltipPoint {
  x: number;
  y: number;
}

interface HoveredItem {
  uid: string;
  point: TooltipPoint;
}

function tooltipPointFromRect(rect: DOMRect): TooltipPoint {
  return {
    x: rect.right,
    y: rect.top + rect.height / 2,
  };
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
  const colors = { ...DEFAULT_COLORS, ...colorMap };
  const style = {
    "--inventory-columns": String(safeColumns),
    "--inventory-panel": colors.panel,
    "--inventory-panel-deep": colors.panelDeep,
    "--inventory-panel-glow": colors.panelGlow,
    "--inventory-panel-line": colors.panelLine,
    "--inventory-frame": colors.frame,
    "--inventory-frame-hot": colors.frameHot,
    "--inventory-accent": colors.accent,
    "--inventory-accent-alt": colors.accentAlt,
    "--inventory-text": colors.text,
    "--inventory-muted": colors.muted,
    "--inventory-tray": colors.tray,
    "--inventory-tray-border": colors.trayBorder,
    "--inventory-slot": colors.slot,
    "--inventory-slot-border": colors.slotBorder,
    "--inventory-slot-hover": colors.slotHover,
    "--inventory-selected": colors.selected,
    "--inventory-selected-glow": colors.selectedGlow,
    "--inventory-empty-slot": colors.emptySlot,
  } as CSSProperties;

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
                    showTooltip(stack, tooltipPointFromRect(event.currentTarget.getBoundingClientRect()))
                  }
                  onPointerLeave={() => hideTooltip(stack.uid)}
                  onFocus={(event: FocusEvent<HTMLDivElement>) =>
                    showTooltip(stack, tooltipPointFromRect(event.currentTarget.getBoundingClientRect()))
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
        <InventoryTooltip stack={hoveredStack} point={hoveredItem.point} themeStyle={style} />
      )}
      {menu && <ItemContextMenu {...menu} themeStyle={style} onClose={() => setMenu(null)} />}
    </section>
  );
}

function InventoryTooltip({
  stack,
  point,
  themeStyle,
}: {
  stack: ItemStack;
  point: TooltipPoint;
  themeStyle: CSSProperties;
}) {
  if (typeof document === "undefined") return null;

  const right = point.x + TOOLTIP_GAP;
  const left =
    right + TOOLTIP_WIDTH <= window.innerWidth - 12
      ? right
      : Math.max(12, point.x - TOOLTIP_WIDTH - TOOLTIP_GAP);
  const top = Math.min(
    Math.max(12, point.y - TOOLTIP_ESTIMATED_HEIGHT / 2),
    Math.max(12, window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - 12),
  );

  return createPortal(
    <div
      className={s["inventory-tooltip"]}
      style={{ ...themeStyle, left: `${left}px`, top: `${top}px` }}
      role="tooltip"
    >
      <ItemDetail stack={stack} className={s["inventory-tooltip-detail"]} />
    </div>,
    document.body,
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