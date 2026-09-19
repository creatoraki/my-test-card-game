import { useState } from "react";
import type { EquipTab, ItemTab } from "@/ui/common/item/itemFilters";
import { matchTab } from "@/ui/common/item/itemFilters";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";
import ItemTile from "@/ui/common/item/ItemTile";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { useTownStore } from "@/store/townStore";
import { ITEM_CATALOG, ITEM_CATALOG_STACKS, itemStackFor } from "../codexCatalog";
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
            return (
              <div key={def.id} className={s["slot-anchor"]} data-interactive-hint="">
                <ItemTile
                  variant="compact"
                  stack={itemStackFor(def.id)}
                  locked={!isRecorded}
                  selected={selectedId === def.id}
                  aria-label={isRecorded ? `查看${def.name}详情` : `未收录物品：${def.name}`}
                  className={s["item-slot"]}
                  onClick={() => setSelectedId(def.id)}
                />
                <InteractiveHint className={s["slot-hint"]} />
              </div>
            );
          })}
        </div>
      </section>
      <ShopDetailAside heading="物品详情" empty="选择已收录物品查看详情">
        {selected && <ShopItemCard stack={selected} />}
      </ShopDetailAside>
    </div>
  );
}
