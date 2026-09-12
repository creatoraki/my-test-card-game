import { useMemo, useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { WarehouseDetail } from "./WarehouseDetail";
import s from "./WarehousePanel.module.css";

const CELL_SIZE = 124;
const GRID_GAP = 12;
const GRID_HOVER_BLEED = 4;

export interface WarehousePanelProps {
  rows?: number;
  columns?: number;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

const positiveInteger = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback;

export default function WarehousePanel({
  rows = 4,
  columns = 4,
}: WarehousePanelProps) {
  const storage = useTownStore((state) => state.storage);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const safeRows = positiveInteger(rows, 4);
  const safeColumns = positiveInteger(columns, 4);
  const gridHeight = safeRows * CELL_SIZE + (safeRows - 1) * GRID_GAP + GRID_HOVER_BLEED;
  const sorted = useMemo(
    () => sortStacks(mergeStacksForDisplay(storage, getItemDef), getItemDef, rarityRank),
    [storage],
  );
  const visibleStacks = useMemo(
    () => sorted.filter((stack) => matchTab(stack, tab, equipTab)),
    [equipTab, sorted, tab],
  );
  const selectedStack = visibleStacks.find((stack) => stack.uid === selectedUid)
    ?? visibleStacks[0]
    ?? null;
  const cells = useMemo(
    () => [
      ...visibleStacks,
      ...Array.from({ length: Math.max(0, safeRows * safeColumns - visibleStacks.length) }, () => null),
    ],
    [safeColumns, safeRows, visibleStacks],
  );

  return (
    <div className={s["warehouse-content"]}>
      <div className={s["warehouse-body"]}>
        <div className={s["warehouse-main"]}>
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
                <ItemSlot
                  key={stack.uid}
                  stack={stack}
                  selected={selectedStack?.uid === stack.uid}
                  onClick={() => setSelectedUid(stack.uid)}
                  className={s["warehouse-slot"]}
                />
              ) : (
                <EmptySlot key={`empty-${index}`} className={s["warehouse-empty"]} />
              ),
            )}
          </div>

          <footer className={s["warehouse-foot"]}>
            <span>库存 {storage.length} 件</span>
            <span>{visibleStacks.length} 件匹配</span>
          </footer>
        </div>

        <WarehouseDetail stack={selectedStack} />
      </div>
    </div>
  );
}
