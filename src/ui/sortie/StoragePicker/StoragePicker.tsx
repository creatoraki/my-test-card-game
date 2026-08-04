import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./StoragePicker.module.css";

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

export function StoragePicker() {
  const storage = useTownStore((state) => state.storage);
  const takeFromStorage = useSortieStore((state) => state.takeFromStorage);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ uid: string; rect: DOMRect } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      sortStacks(
        mergeStacksForDisplay(
          storage.filter((stack) => getItemDef(stack.itemId).category === "consumable"),
          getItemDef,
        ),
        getItemDef,
        rarityRank,
      ),
    [storage],
  );
  const selected = visible.find((stack) => stack.uid === selectedUid) ?? null;
  const tooltipStack = tooltip ? visible.find((stack) => stack.uid === tooltip.uid) ?? null : null;
  const cells = [...visible, ...Array.from({ length: Math.max(0, 12 - visible.length) }, () => null)];

  const hideTooltip = (uid: string) => {
    setTooltip((current) => (current?.uid === uid ? null : current));
  };

  return (
    <section className={s.panel} aria-labelledby="sortie-storage-title">
      <header className={s.header}>
        <div>
          <span className={s.kicker}>STORAGE / CONSUMABLES</span>
          <h2 id="sortie-storage-title">仓库</h2>
        </div>
        <span className={s.notice} role="status">{notice}</span>
      </header>
      <div className={s.grid}>
        {cells.map((stack, index) =>
          stack ? (
            <div
              key={stack.uid}
              className={s.slotAnchor}
              onPointerEnter={(event) =>
                setTooltip({ uid: stack.uid, rect: event.currentTarget.getBoundingClientRect() })
              }
              onPointerLeave={() => hideTooltip(stack.uid)}
              onFocus={(event) =>
                setTooltip({ uid: stack.uid, rect: event.currentTarget.getBoundingClientRect() })
              }
              onBlur={() => hideTooltip(stack.uid)}
            >
              <ItemSlot
                stack={stack}
                selected={stack.uid === selectedUid}
                className={s.slot}
                onClick={() => {
                  setSelectedUid(stack.uid);
                  if (!takeFromStorage(stack.uid)) setNotice("背包已满");
                }}
              />
            </div>
          ) : (
            <EmptySlot key={`empty-${index}`} className={s.empty} />
          ),
        )}
      </div>
      <p className={s.foot}>点击消耗品取入出击背包 · {visible.length} 堆可用</p>
      {tooltipStack && tooltip && <SortieTooltip stack={tooltipStack} anchor={tooltip.rect} />}
    </section>
  );
}
