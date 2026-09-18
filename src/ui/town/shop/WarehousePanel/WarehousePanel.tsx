import { useMemo, useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemSlot from "@/ui/common/item/ItemSlot/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { WarehouseDetail } from "./WarehouseDetail";
import s from "./WarehousePanel.module.css";

const GRID_HOVER_BLEED = 4;

export interface WarehousePanelProps {
  columns?: number;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

const positiveInteger = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value as number)) : fallback;

export default function WarehousePanel({ columns = 6 }: WarehousePanelProps) {
  const storage = useTownStore((state) => state.storage);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const safeColumns = positiveInteger(columns, 6);
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
              "--warehouse-grid-bleed": `${GRID_HOVER_BLEED}px`,
            } as CSSProperties}
            aria-label="仓库物品格"
          >
            {visibleStacks.length ? (
              visibleStacks.map((stack) => (
                <ItemSlot
                  key={stack.uid}
                  stack={stack}
                  overlay
                  selected={selectedStack?.uid === stack.uid}
                  onClick={() => setSelectedUid(stack.uid)}
                  className={s["warehouse-slot"]}
                />
              ))
            ) : (
              <p className={s["warehouse-none"]}>该分类没有物资。</p>
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
