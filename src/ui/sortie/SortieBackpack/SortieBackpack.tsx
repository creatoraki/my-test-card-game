import { useState } from "react";
import { RULES } from "@/engine";
import { layoutBackpack } from "@/items/inventory";
import { useSortieStore, sortieUsedSlots } from "@/store/sortieStore";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./SortieBackpack.module.css";

export function SortieBackpack() {
  const backpack = useSortieStore((state) => state.backpack);
  const putBack = useSortieStore((state) => state.putBack);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ uid: string; rect: DOMRect } | null>(null);
  const cells = layoutBackpack(backpack, RULES.burden.backpackSlots);
  const used = sortieUsedSlots(backpack);
  const penalty = used * RULES.burden.penaltyPerSlot;
  const selected = backpack.find((stack) => stack.uid === selectedUid) ?? null;
  const tooltipStack = tooltip ? backpack.find((stack) => stack.uid === tooltip.uid) ?? null : null;

  const hideTooltip = (uid: string) => {
    setTooltip((current) => (current?.uid === uid ? null : current));
  };

  return (
    <section className={s.panel} aria-labelledby="sortie-backpack-title">
      <header className={s.header}>
        <div>
          <span className={s.kicker}>LOADOUT / 24 SLOTS</span>
          <h2 id="sortie-backpack-title">背包</h2>
        </div>
        <div className={s.loadReadout}>
          <strong>{used} / {RULES.burden.backpackSlots}</strong>
          <span>命中 · 闪避 · 暴击 -{penalty}%</span>
        </div>
      </header>
      <div className={s.grid}>
        {cells.map((cell, index) =>
          cell.kind === "item" ? (
            <div
              key={cell.stack.uid}
              className={s.slotAnchor}
              onPointerEnter={(event) =>
                setTooltip({ uid: cell.stack.uid, rect: event.currentTarget.getBoundingClientRect() })
              }
              onPointerLeave={() => hideTooltip(cell.stack.uid)}
              onFocus={(event) =>
                setTooltip({ uid: cell.stack.uid, rect: event.currentTarget.getBoundingClientRect() })
              }
              onBlur={() => hideTooltip(cell.stack.uid)}
            >
              <ItemSlot
                stack={cell.stack}
                selected={cell.stack.uid === selectedUid}
                className={s.slot}
                onClick={() => {
                  setSelectedUid(cell.stack.uid);
                  putBack(cell.stack.uid);
                }}
              />
            </div>
          ) : (
            <EmptySlot key={`empty-${index}`} className={s.empty} />
          ),
        )}
      </div>
      <p className={s.foot}>点击物品退回来源 · 货柜购买的物品会在取消出击时退款</p>
      {tooltipStack && tooltip && <SortieTooltip stack={tooltipStack} anchor={tooltip.rect} />}
    </section>
  );
}
