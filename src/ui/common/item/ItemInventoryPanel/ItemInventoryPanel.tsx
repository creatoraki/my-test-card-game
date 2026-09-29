import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getItemDef, sellPriceOf } from "@/data";
import { occupiedSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import { EmptySlot } from "@/ui/common/item/ItemSlot";
import { useSlotActionMode, type SlotAction } from "@/ui/common/item/ItemActionMask";
import { sectionMarks, sortBySection } from "@/ui/common/item/shared/itemSections";
import { cx } from "@/ui/common/shared/cx";
import { inventoryThemeVars, type InventoryColorMap } from "@/ui/common/item/shared/inventoryTheme";
import { techLevels, useTownStore } from "@/store/town/townStore";
import s from "./ItemInventoryPanel.module.css";
import g from "./ItemInventoryPanel.grid.module.css";
import { InventorySlotCell } from "./InventorySlotCell";

export type { InventoryColorMap } from "@/ui/common/item/shared/inventoryTheme";

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
  /** 开启后按分区自动排序(见 shared/itemSections), 并画分区分割线与标签。 */
  sectioned?: boolean;
  /**
   * 传了就启用「交互模式」: 点击物品 → 格子盖遮罩并竖排这些按钮, 鼠标移出格子即退出。
   * 返回空数组 = 这一格点了不进交互模式。启用后点击不再走选中逻辑。
   */
  slotActions?: (stack: ItemStack) => SlotAction[];
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
  sectioned = false,
  slotActions,
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
  const ordered = useMemo(
    () => (sectioned ? sortBySection(stacks) : stacks),
    [sectioned, stacks],
  );
  const marks = useMemo(() => (sectioned ? sectionMarks(ordered) : null), [sectioned, ordered]);
  const uids = useMemo(() => stacks.map((stack) => stack.uid), [stacks]);
  const actionMode = useSlotActionMode(uids);
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

  const cells = useMemo(
    () => [
      ...ordered,
      ...Array.from({ length: Math.max(0, cellCount - ordered.length) }, () => null),
    ],
    [cellCount, ordered],
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

  const activeStack = actionMode.activeUid
    ? stacks.find((stack) => stack.uid === actionMode.activeUid) ?? null
    : null;
  const activeList = activeStack && slotActions ? slotActions(activeStack) : null;
  const activeActions = activeList?.length ? activeList : null;

  const handleClick = (stack: ItemStack) => {
    if (!slotActions) return handleSelect(stack);
    if (slotActions(stack).length) actionMode.open(stack.uid);
  };

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
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

        <div className={g["inventory-tray"]}>
          <div className={g["inventory-grid"]} role="group" aria-label={gridLabel}>
            {cells.map((stack, index) =>
              stack ? (
                <InventorySlotCell
                  key={stack.uid}
                  stack={stack}
                  selected={activeSelectedUid === stack.uid}
                  pulse={Boolean(pulseUids?.has(stack.uid))}
                  slotHint={slotHint}
                  mark={marks?.[index]}
                  rowStart={index % safeColumns === 0}
                  actions={actionMode.activeUid === stack.uid ? activeActions : null}
                  onClick={() => handleClick(stack)}
                  onDismiss={actionMode.close}
                  onEnter={(element) => showTooltip(stack, tooltipPointFromElement(element))}
                  onLeave={() => {
                    hideTooltip(stack.uid);
                    actionMode.closeIf(stack.uid);
                  }}
                />
              ) : (
                <div
                  key={`empty-${index}`}
                  className={cx(g["inventory-slot-anchor"], g["inventory-empty-anchor"])}
                >
                  <EmptySlot className={g["inventory-empty"]} />
                </div>
              ),
            )}
          </div>
        </div>

        {!compact && (
          <footer className={g["inventory-footer"]}>
            <div className={g["inventory-selected"]} aria-live="polite">
              {selectedInfo}
            </div>
            {footer && <div className={g["inventory-actions"]}>{footer}</div>}
          </footer>
        )}
      </div>
      {hoveredStack && hoveredItem && (
        <ItemTooltip stack={hoveredStack} point={hoveredItem.point} themeStyle={style} />
      )}
    </section>
  );
}

function DefaultSelectedInfo({ stack }: { stack: ItemStack | null }) {
  const levels = useTownStore(techLevels);

  if (!stack) {
    return (
      <>
        <span className={g["inventory-selected-label"]}>未选择物品</span>
        <span className={g["inventory-selected-empty"]}>选择一件物品查看详情</span>
      </>
    );
  }

  const def = getItemDef(stack.itemId);
  const sellPrice = sellPriceOf(def, levels);
  return (
    <>
      <span className={g["inventory-selected-label"]}>物品详情</span>
      <strong className={g["inventory-selected-name"]}>{def.name}</strong>
      <span className={g["inventory-selected-meta"]}>
        {stack.count > 1 && `数量 ${stack.count} · `}
        {sellPrice > 0 ? `单价 ${sellPrice} 积分` : "待处理物品"}
      </span>
    </>
  );
}
