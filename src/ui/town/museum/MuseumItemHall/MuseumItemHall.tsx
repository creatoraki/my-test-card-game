import { useState } from "react";
import type { EquipTab, ItemTab } from "@/ui/common/item/itemFilters";
import { matchTab } from "@/ui/common/item/itemFilters";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { ITEM_CATALOG, ITEM_CATALOG_STACKS, itemStackFor } from "../codexCatalog";
import { MuseumLockedTile } from "../MuseumLockedTile";
import s from "./MuseumItemHall.module.css";

export function MuseumItemHall() {
  const recorded = useTownStore((state) => state.codex.items);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId && recorded.includes(selectedId) ? itemStackFor(selectedId) : null;
  const visibleItems = ITEM_CATALOG.filter((def) => matchTab(itemStackFor(def.id), tab, equipTab));

  return (
    <div className={s["hall"]}>
      <section className={s["catalog"]}>
        <div className={s["section-head"]}>
          <div>
            <span className={s["kicker"]}>物资档案</span>
            <h3>物品名录</h3>
          </div>
          <span className={s["count"]}>{recorded.length} / {ITEM_CATALOG.length}</span>
        </div>
        <ItemTabs
          stacks={ITEM_CATALOG_STACKS}
          tab={tab}
          equipTab={equipTab}
          onTab={setTab}
          onEquipTab={setEquipTab}
          className={s["tabs"]}
        />
        <div className={s["item-grid"]}>
          {visibleItems.map((def) => {
            const isRecorded = recorded.includes(def.id);
            return isRecorded ? (
              <ItemSlot
                key={def.id}
                stack={itemStackFor(def.id)}
                selected={selectedId === def.id}
                aria-label={`查看${def.name}详情`}
                className={s["item-slot"]}
                onClick={() => setSelectedId(def.id)}
              />
            ) : (
              <button
                key={def.id}
                type="button"
                className={cx(s["locked-button"], selectedId === def.id && s["is-selected"])}
                aria-label={`未收录物品：${def.name}`}
                onClick={() => setSelectedId(def.id)}
              >
                <MuseumLockedTile />
              </button>
            );
          })}
        </div>
      </section>
      <aside className={s["detail"]}>
        <ItemDetail stack={selected} placeholder="选择已收录物品查看详情" />
      </aside>
    </div>
  );
}
