import { useMemo, useState, type CSSProperties } from "react";
import { RULES } from "@/engine";
import { layoutBackpack } from "@/items/inventory";
import { useSortieStore, sortieUsedSlots } from "@/store/sortieStore";
import { cx } from "@/ui/common/cx";
import ItemSlot, { EmptySlot } from "@/ui/common/item/ItemSlot/ItemSlot";
import { useChangePulse } from "@/ui/hooks/useChangePulse";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./SortieBackpack.module.css";

interface Props {
  /** 调用方的布局类(占哪块格、第几个入场)。面板自身的外观一律由本组件持有。 */
  className?: string;
}

// 容量条的三档。★ 阈值是显示口径, 不是规则 —— 负重惩罚本身是线性的(RULES.burden),
// 这里只是把「快满了」提前告诉玩家。
const WARN_AT = 0.8;

export function SortieBackpack({ className }: Props) {
  const backpack = useSortieStore((state) => state.backpack);
  const putBack = useSortieStore((state) => state.putBack);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ uid: string; rect: DOMRect } | null>(null);
  const total = RULES.burden.backpackSlots;
  const cells = layoutBackpack(backpack, total);
  const used = sortieUsedSlots(backpack);
  const penalty = used * RULES.burden.penaltyPerSlot;
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
      <header className={s.header}>
        <div>
          <span className={s.kicker}>{`LOADOUT / ${total} SLOTS`}</span>
          <h2 id="sortie-backpack-title" className={s.title}>背包</h2>
        </div>
        <div className={cx(s.loadReadout, s[`level-${level}`])}>
          {/* key={used} 让读数每次变化都重挂一次 ⇒ 触发 CSS 的 bump, 不需要 JS 计时 */}
          <strong key={used} className={s.loadValue}>
            {usedShown} / {total}
          </strong>
          <span className={s.meter} aria-hidden>
            <span className={s.meterFill} style={{ "--fill": fill } as CSSProperties} />
          </span>
          <span className={s.penalty}>命中 · 闪避 · 暴击 -{penalty}%</span>
        </div>
        <p className={s.foot}>点击物品退回来源 · 货柜购买的物品会在取消出击时退款</p>
      </header>
      <div className={s.grid}>
        {cells.map((cell, index) =>
          cell.kind === "item" ? (
            <div
              key={cell.stack.uid}
              className={cx(s.slotAnchor, pulsed.has(cell.stack.uid) && s.pulse)}
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
      {tooltipStack && tooltip && <SortieTooltip stack={tooltipStack} anchor={tooltip.rect} />}
    </section>
  );
}
