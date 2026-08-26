import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./StoragePicker.module.css";

interface Props {
  /** 调用方的布局类。面板自身的外观一律由本组件持有。 */
  className?: string;
}

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

// 6 列 x 2 行 —— 与 PrepStep 中部左栏的 620x372 对齐。
const CELLS = 12;

export function StoragePicker({ className }: Props) {
  const storage = useTownStore((state) => state.storage);
  const takeFromStorage = useSortieStore((state) => state.takeFromStorage);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ uid: string; point: TooltipPoint } | null>(null);
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
  const tooltipStack = tooltip ? visible.find((stack) => stack.uid === tooltip.uid) ?? null : null;
  const cells = [...visible, ...Array.from({ length: Math.max(0, CELLS - visible.length) }, () => null)];
  // 取物是按 uid 整堆移出 ⇒ 那个格子直接卸载; 但显示层做过 mergeStacksForDisplay,
  // 同款的另几堆会合并到一起显示, 于是「拿走一堆、合并格的数字变小」这种原地改数
  // 不会重挂 DOM —— 靠这里认出来闪一下。
  const pulsed = useChangePulse(
    useMemo(() => Object.fromEntries(visible.map((stack) => [stack.uid, stack.count])), [visible]),
  );

  const hideTooltip = (uid: string) => {
    setTooltip((current) => (current?.uid === uid ? null : current));
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1500);
  };

  return (
    <section className={cx(s.panel, className)} aria-labelledby="sortie-storage-title">
      <div className={s.bar}>
        <span id="sortie-storage-title" className={s.label}>仓库</span>
        <span className={s.notice} role="status">{notice}</span>
      </div>
      <div className={s.grid}>
        {cells.map((stack, index) =>
          stack ? (
            <div
              key={stack.uid}
              className={cx(s.slotAnchor, pulsed.has(stack.uid) && s.pulse)}
              onPointerEnter={(event) =>
                setTooltip({ uid: stack.uid, point: tooltipPointFromElement(event.currentTarget) })
              }
              onPointerLeave={() => hideTooltip(stack.uid)}
              onFocus={(event) =>
                setTooltip({ uid: stack.uid, point: tooltipPointFromElement(event.currentTarget) })
              }
              onBlur={() => hideTooltip(stack.uid)}
            >
              <ItemSlot
                stack={stack}
                selected={stack.uid === selectedUid}
                className={cx(s.slot, stack.uid === selectedUid && s.slotOn)}
                onClick={() => {
                  setSelectedUid(stack.uid);
                  if (!takeFromStorage(stack.uid)) showNotice("背包已满");
                }}
              />
            </div>
          ) : (
            <EmptySlot key={`empty-${index}`} className={s.empty} />
          ),
        )}
      </div>
      {tooltipStack && tooltip && <SortieTooltip stack={tooltipStack} point={tooltip.point} />}
    </section>
  );
}
