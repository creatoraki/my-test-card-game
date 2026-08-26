import { useMemo, useState } from "react";
import { burdenHitPenalty, burdenInitiativePenalty, RULES } from "@/engine";
import { layoutBackpack } from "@/items/inventory";
import { useSortieStore, sortieUsedSlots } from "@/store/sortieStore";
import { cx } from "@/ui/common/cx";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./SortieBackpack.module.css";

interface Props {
  /** 调用方的布局类。面板自身的外观一律由本组件持有。 */
  className?: string;
}

// 负重读数的三档。★ 阈值是显示口径, 不是规则 —— 负重惩罚本身是线性的(RULES.burden),
// 这里只是把「快满了」提前告诉玩家。
const WARN_AT = 0.8;

export function SortieBackpack({ className }: Props) {
  const backpack = useSortieStore((state) => state.backpack);
  const putBack = useSortieStore((state) => state.putBack);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const total = RULES.burden.backpackSlots;
  const cells = layoutBackpack(backpack, total);
  const used = sortieUsedSlots(backpack);
  const hitPenalty = burdenHitPenalty(used);
  const initiativePenalty = burdenInitiativePenalty(used);
  const fill = total > 0 ? used / total : 0;
  const level = fill >= 1 ? "full" : fill >= WARN_AT ? "warn" : "ok";
  const usedShown = useCountUp(used, 0, 260);
  const tooltipStack = tooltip ? backpack.find((stack) => stack.uid === tooltip.uid) ?? null : null;
  // 新进来的物品是一次真挂载, 由 CSS 的 slotPop 负责; 这里认的是「同一堆数量变了」。
  const pulsed = useChangePulse(
    useMemo(() => Object.fromEntries(backpack.map((stack) => [stack.uid, stack.count])), [backpack]),
  );

  const hideTooltip = (uid: string) => {
    setTooltip((current) => (current?.uid === uid ? null : current));
  };

  return (
    <section className={cx(s.panel, className)} aria-labelledby="sortie-backpack-title">
      <div className={cx(s.bar, s[`level-${level}`])}>
        <span id="sortie-backpack-title" className={s.label}>背包</span>
        <span key={used} className={s.readout}>
          {usedShown} / {total} · 命中 −{hitPenalty}% · 先手 −{initiativePenalty}
        </span>
      </div>
      <div className={s.grid}>
        {cells.map((cell, index) =>
          cell.kind === "item" ? (
            <div
              key={cell.stack.uid}
              className={cx(s.slotAnchor, pulsed.has(cell.stack.uid) && s.pulse)}
              onPointerEnter={(event) =>
                setTooltip({ uid: cell.stack.uid, point: tooltipPointFromElement(event.currentTarget) })
              }
              onPointerLeave={() => hideTooltip(cell.stack.uid)}
              onFocus={(event) =>
                setTooltip({ uid: cell.stack.uid, point: tooltipPointFromElement(event.currentTarget) })
              }
              onBlur={() => hideTooltip(cell.stack.uid)}
            >
              <ItemSlot
                stack={cell.stack}
                selected={cell.stack.uid === selectedUid}
                className={cx(s.slot, cell.stack.uid === selectedUid && s.slotOn)}
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
      {tooltipStack && tooltip && <SortieTooltip stack={tooltipStack} point={tooltip.point} />}
    </section>
  );
}
