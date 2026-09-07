import { useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER, type ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import {
  tooltipPointFromElement,
  tooltipStyle,
  useTooltipPlacement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { cx } from "@/ui/common/cx";
import s from "./WarehousePanel.module.css";

const CELL_SIZE = 88;
const GRID_GAP = 10;
const GRID_HOVER_BLEED = 4;
const TOOLTIP_TOP_OFFSET = 44;

export interface WarehousePanelProps {
  rows?: number;
  columns?: number;
  leaving?: boolean;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

const positiveInteger = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback;

export default function WarehousePanel({
  rows = 4,
  columns = 5,
  leaving = false,
}: WarehousePanelProps) {
  const storage = useTownStore((state) => state.storage);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState<TooltipPoint | null>(null);

  const safeRows = positiveInteger(rows, 4);
  const safeColumns = positiveInteger(columns, 5);
  const gridHeight = safeRows * CELL_SIZE + (safeRows - 1) * GRID_GAP + GRID_HOVER_BLEED;
  const sorted = useMemo(
    () => sortStacks(mergeStacksForDisplay(storage, getItemDef), getItemDef, rarityRank),
    [storage],
  );
  const visibleStacks = useMemo(
    () => sorted.filter((stack) => matchTab(stack, tab, equipTab)),
    [equipTab, sorted, tab],
  );
  const cells = useMemo(
    () => [
      ...visibleStacks,
      ...Array.from({ length: Math.max(0, safeRows * safeColumns - visibleStacks.length) }, () => null),
    ],
    [safeColumns, safeRows, visibleStacks],
  );
  const hoveredStack = visibleStacks.find((stack) => stack.uid === hoveredUid) ?? null;

  useEffect(() => {
    if (hoveredUid && !visibleStacks.some((stack) => stack.uid === hoveredUid)) {
      setHoveredUid(null);
      setTooltipPoint(null);
    }
  }, [hoveredUid, visibleStacks]);

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
    setHoveredUid(stack.uid);
    setTooltipPoint(point);
  };

  const handleFocus = (stack: ItemStack, event: FocusEvent<HTMLDivElement>) => {
    showTooltip(stack, tooltipPointFromElement(event.currentTarget));
  };

  return (
    <div className={s["warehouse-content"]}>
      <ItemTabs
        className={s["warehouse-tabs"]}
        stacks={sorted}
        tab={tab}
        equipTab={equipTab}
        onTab={setTab}
        onEquipTab={setEquipTab}
      />

      <div
        className={s["warehouse-grid"]}
        style={{
          "--warehouse-columns": safeColumns,
          "--warehouse-grid-height": `${gridHeight}px`,
          "--warehouse-grid-bleed": `${GRID_HOVER_BLEED}px`,
        } as CSSProperties}
        aria-label="仓库物品格"
      >
        {cells.map((stack, index) =>
          stack ? (
            <div
              className={s["warehouse-cell"]}
              key={stack.uid}
              onPointerEnter={(event) => showTooltip(stack, tooltipPointFromElement(event.currentTarget))}
              onPointerLeave={() => {
                setHoveredUid((current) => (current === stack.uid ? null : current));
                setTooltipPoint(null);
              }}
              onFocus={(event) => handleFocus(stack, event)}
              onBlur={() => {
                setHoveredUid((current) => (current === stack.uid ? null : current));
                setTooltipPoint(null);
              }}
            >
              <ItemSlot
                stack={stack}
                selected={hoveredUid === stack.uid}
                className={cx(s["warehouse-slot"], hoveredUid === stack.uid && s["is-hovered"])}
              />
            </div>
          ) : (
            <EmptySlot key={`empty-${index}`} className={s["warehouse-empty"]} />
          ),
        )}
      </div>

      <footer className={s["warehouse-foot"]}>
        <span>库存 {storage.length} 件</span>
        <span>{visibleStacks.length} 件匹配</span>
      </footer>

      {hoveredStack && tooltipPoint && (
        <WarehouseTooltip stack={hoveredStack} point={tooltipPoint} leaving={leaving} />
      )}
    </div>
  );
}

function WarehouseTooltip({
  stack,
  point,
  leaving,
}: {
  stack: ItemStack;
  point: TooltipPoint;
  leaving: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref, TOOLTIP_TOP_OFFSET);

  return createPortal(
    <div
      className={cx(s["warehouse-tooltip"], leaving && s["is-leaving"])}
      ref={ref}
      style={tooltipStyle(placement)}
      role="tooltip"
    >
      <ItemDetail
        stack={stack}
        className={s["warehouse-tooltip-detail"]}
        placeholder="选择一件物品查看详情"
      />
    </div>,
    point.host,
  );
}
