import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getItemDef, sellPriceOf } from "@/data";
import { occupiedSlots } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipDirection,
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
  /**
   * 无框形态: 不画外壳/表头/托盘/底栏, 网格横向铺满父容器(格子仍 1:1)。
   * 给已经自带容器的宿主用(探索底栏)。容量读数由宿主自行在别处展示。
   */
  bare?: boolean;
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
  /**
   * 交互模式的呈现: mask = 格内遮罩(默认);
   * tooltip = 悬浮详情浮层不换, 底部动画长出操作区(探索底部物品栏), 退出交互即连浮层一起收起。
   */
  actionStyle?: "mask" | "tooltip";
  footer?: ReactNode;
  panelId?: string;
  colorMap?: InventoryColorMap;
  /** 由容器传入需要短暂高亮的物品 uid, 例如飞入背包后的落点反馈。 */
  pulseUids?: ReadonlySet<string>;
  /** 开启后, 悬浮到**有物品**的格子时在格外浮出统一的「可点击」四角提示; 空格不给提示。 */
  slotHint?: boolean;
  /** 悬浮详情的弹出方向, 默认 right(格子右侧); 贴底的物品栏传 top。 */
  tooltipDirection?: TooltipDirection;
  className?: string;
}

const positiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

const nonNegativeInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

interface HoveredItem {
  uid: string;
  point: TooltipPoint;
  /** 格子包裹层 —— 交互态浮层用它判断「点外部」。 */
  element: HTMLElement;
}

export default function ItemInventoryPanel({
  stacks,
  rows,
  columns,
  kicker = "SECTOR-03 // INVENTORY TERMINAL",
  title = "物品终端",
  subtitle,
  compact = false,
  bare = false,
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
  actionStyle = "mask",
  footer,
  panelId = "item-inventory-panel",
  colorMap,
  pulseUids,
  slotHint = false,
  tooltipDirection = "right",
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
  // tooltip 交互模式: 点击时把当时的浮层位置钉住, 交互期间悬浮别的格子也不挪动这张浮层。
  const [pinnedItem, setPinnedItem] = useState<HoveredItem | null>(null);
  const inTooltip = actionStyle === "tooltip";
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
  const pinned = inTooltip && pinnedItem && pinnedItem.uid === actionMode.activeUid ? pinnedItem : null;
  const tooltipItem = pinned ?? hoveredItem;
  const tooltipStack = tooltipItem
    ? stacks.find((stack) => stack.uid === tooltipItem.uid) ?? null
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

  // tooltip 模式退出交互(Esc / 点外部 / 执行完动作)时浮层直接消失: 指针还停在格上也一并清掉悬浮,
  // 要重新移入格子才再出详情。
  const prevActiveUid = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevActiveUid.current;
    prevActiveUid.current = actionMode.activeUid;
    if (!inTooltip || !prev || actionMode.activeUid) return;
    setPinnedItem(null);
    setHoveredItem((current) => (current?.uid === prev ? null : current));
  }, [actionMode.activeUid, inTooltip]);

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
    if (!slotActions(stack).length) return;
    actionMode.open(stack.uid);
    if (inTooltip) setPinnedItem(hoveredItem?.uid === stack.uid ? hoveredItem : null);
  };

  const showTooltip = (stack: ItemStack, element: HTMLElement, point: TooltipPoint) => {
    setHoveredItem({ uid: stack.uid, point, element });
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
      data-bare={bare ? "true" : undefined}
      aria-labelledby={bare ? undefined : `${panelId}-title`}
      aria-label={bare ? gridLabel : undefined}
    >
      {!bare && <>
      <span className={s["inventory-tech-border"]} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-top"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-bottom"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-left"])} aria-hidden="true" />
      <span className={cx(s["inventory-line"], s["inventory-line-right"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-tl"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-tr"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-bl"])} aria-hidden="true" />
      <span className={cx(s["inventory-corner"], s["inventory-corner-br"])} aria-hidden="true" />
      </>}

      <div className={s["inventory-content"]}>
        {!bare && <header className={s["inventory-header"]}>
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
        </header>}

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
                  actionStyle={actionStyle}
                  onClick={() => handleClick(stack)}
                  onDismiss={actionMode.close}
                  onEnter={(element) => {
                    if (actionMode.activeUid === stack.uid) actionMode.keepOpen();
                    showTooltip(stack, element, tooltipPointFromElement(element, tooltipDirection));
                  }}
                  onLeave={() => {
                    // tooltip 模式下交互中的浮层由 pinnedItem 撑着, 这里照常清悬浮即可。
                    hideTooltip(stack.uid);
                    if (inTooltip) actionMode.closeSoon(stack.uid);
                    else actionMode.closeIf(stack.uid);
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

        {!compact && !bare && (
          <footer className={g["inventory-footer"]}>
            <div className={g["inventory-selected"]} aria-live="polite">
              {selectedInfo}
            </div>
            {footer && <div className={g["inventory-actions"]}>{footer}</div>}
          </footer>
        )}
      </div>
      {tooltipStack && tooltipItem && (
        <ItemTooltip
          // 同一件物品从悬浮切到交互不换 key: 浮层不重挂, 只在底部长出操作区。
          key={tooltipItem.uid}
          stack={tooltipStack}
          point={tooltipItem.point}
          themeStyle={style}
          interaction={pinned ? {
            actions: activeActions,
            anchor: pinned.element,
            onDismiss: actionMode.close,
            onPointerEnter: actionMode.keepOpen,
            onPointerLeave: () => actionMode.closeSoon(pinned.uid),
          } : undefined}
        />
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
