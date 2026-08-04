import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { createPortal } from "react-dom";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER, type ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { cx } from "@/ui/common/cx";
import s from "./WarehousePanel.module.css";

const CELL_SIZE = 88;
const GRID_GAP = 10;
const GRID_HOVER_BLEED = 4;
const PANEL_HORIZONTAL_PADDING = 52;
const PANEL_FIXED_HEIGHT = 262;
const TOOLTIP_WIDTH = 260;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const TOOLTIP_GAP = 18;
export interface WarehousePanelPosition {
  side?: "left" | "right";
  top?: number;
  offset?: number;
}

export interface WarehousePanelRotation {
  x?: number;
  y?: number;
}

interface ResolvedWarehousePanelPosition {
  side: "left" | "right";
  top: number;
  offset: number;
}

export interface WarehousePanelProps {
  open: boolean;
  leaving?: boolean;
  onClose: () => void;
  rows?: number;
  columns?: number;
  position?: WarehousePanelPosition;
  rotation?: WarehousePanelRotation;
  panelId?: string;
}

const DEFAULT_POSITION: ResolvedWarehousePanelPosition = {
  side: "left",
  top: 150,
  offset: 56,
};

interface TooltipPoint {
  x: number;
  y: number;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

const positiveInteger = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback;

function tooltipPointFromRect(rect: DOMRect): TooltipPoint {
  return {
    x: rect.right,
    y: rect.top + rect.height / 2,
  };
}

export default function WarehousePanel({
  open,
  leaving = false,
  onClose,
  rows = 4,
  columns = 6,
  position,
  rotation,
  panelId = "warehouse-panel",
}: WarehousePanelProps) {
  const storage = useTownStore((state) => state.storage);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [hoveredUid, setHoveredUid] = useState<string | null>(null);
  const [tooltipPoint, setTooltipPoint] = useState<TooltipPoint | null>(null);

  const safeRows = positiveInteger(rows, 4);
  const safeColumns = positiveInteger(columns, 6);
  const safePosition = {
    side: position?.side ?? DEFAULT_POSITION.side,
    top: position?.top ?? DEFAULT_POSITION.top,
    offset: position?.offset ?? DEFAULT_POSITION.offset,
  };
  const gridHeight = safeRows * CELL_SIZE + (safeRows - 1) * GRID_GAP + GRID_HOVER_BLEED;
  const panelWidth = safeColumns * CELL_SIZE + (safeColumns - 1) * GRID_GAP + PANEL_HORIZONTAL_PADDING;
  const panelHeight = PANEL_FIXED_HEIGHT + gridHeight;

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
    if (!open) {
      setHoveredUid(null);
      setTooltipPoint(null);
      return;
    }
    setTab("all");
    setEquipTab("all");
    setHoveredUid(null);
    setTooltipPoint(null);
  }, [open]);

  useEffect(() => {
    if (hoveredUid && !visibleStacks.some((stack) => stack.uid === hoveredUid)) {
      setHoveredUid(null);
      setTooltipPoint(null);
    }
  }, [hoveredUid, visibleStacks]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const showTooltip = (stack: ItemStack, point: TooltipPoint) => {
    setHoveredUid(stack.uid);
    setTooltipPoint(point);
  };

  const handleFocus = (stack: ItemStack, event: FocusEvent<HTMLDivElement>) => {
    showTooltip(stack, tooltipPointFromRect(event.currentTarget.getBoundingClientRect()));
  };

  const style = {
    top: `${Math.max(0, safePosition.top ?? DEFAULT_POSITION.top)}px`,
    [safePosition.side === "right" ? "right" : "left"]: `${Math.max(
      0,
      safePosition.offset ?? DEFAULT_POSITION.offset,
    )}px`,
    width: `${panelWidth}px`,
    height: `${panelHeight}px`,
    "--warehouse-top": `${Math.max(0, safePosition.top ?? DEFAULT_POSITION.top)}px`,
    "--warehouse-columns": safeColumns,
    "--warehouse-grid-height": `${gridHeight}px`,
    "--warehouse-grid-bleed": `${GRID_HOVER_BLEED}px`,
    "--warehouse-rotation-x": `${rotation?.x ?? 0}deg`,
    "--warehouse-rotation-y": `${rotation?.y ?? 0}deg`,
  } as CSSProperties;

  return (
    <div
      className={cx(s["warehouse-layer"], safePosition.side === "right" && s["is-right"])}
    >
      <div className={s["warehouse-stage"]} style={style}>
        <span
          className={cx(
            s["warehouse-rim"],
            safePosition.side === "right" && s["is-right"],
            leaving && s["is-leaving"],
          )}
          aria-hidden="true"
        />
        <section
          id={panelId}
          className={cx(
            s["warehouse-panel"],
            safePosition.side === "right" && s["is-right"],
            leaving && s["is-leaving"],
          )}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
        >
        <header className={s["warehouse-head"]}>
          <div>
            <span className={s["warehouse-kicker"]}>STORAGE INDEX</span>
            <h3 id={`${panelId}-title`} className={s["warehouse-title"]}>
              仓库
            </h3>
          </div>
          <button className={s["warehouse-close"]} type="button" onClick={onClose} aria-label="关闭仓库">
            ×
          </button>
        </header>

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
          style={{ "--warehouse-columns": safeColumns } as CSSProperties}
          aria-label="仓库物品格"
        >
          {cells.map((stack, index) =>
            stack ? (
              <div
                className={s["warehouse-cell"]}
                key={stack.uid}
                onPointerEnter={(event) =>
                  showTooltip(stack, tooltipPointFromRect(event.currentTarget.getBoundingClientRect()))
                }
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
        </section>
      </div>

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
  if (typeof document === "undefined") return null;

  const right = point.x + TOOLTIP_GAP;
  const left =
    right + TOOLTIP_WIDTH <= window.innerWidth - 12
      ? right
      : Math.max(12, point.x - TOOLTIP_WIDTH - TOOLTIP_GAP);
  const top = Math.min(
    Math.max(12, point.y - 44),
    Math.max(12, window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - 12),
  );

  return createPortal(
    <div
      className={cx(s["warehouse-tooltip"], leaving && s["is-leaving"])}
      style={{ left: `${left}px`, top: `${top}px` }}
      role="tooltip"
    >
      <ItemDetail
        stack={stack}
        className={s["warehouse-tooltip-detail"]}
        placeholder="选择一件物品查看详情"
      />
    </div>,
    document.body,
  );
}
