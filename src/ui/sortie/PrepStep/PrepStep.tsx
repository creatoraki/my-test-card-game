import { useRef, useState } from "react";
import { RULES } from "@/engine";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import ItemInventoryPanel from "@/ui/common/item/ItemInventoryPanel";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { StockBand } from "@/ui/sortie/StockBand";
import { StorageInventory } from "@/ui/sortie/StorageInventory";
import { cx } from "@/ui/common/cx";
import s from "./PrepStep.module.css";

interface Props {
  active: boolean;
  entering: boolean;
  exiting: boolean;
}

export function PrepStep({ active, entering, exiting }: Props) {
  const stepRef = useRef<HTMLElement>(null);
  const loot = useTownStore((state) => state.loot);
  const backpack = useSortieStore((state) => state.backpack);
  const putBack = useSortieStore((state) => state.putBack);
  const credits = useCountUp(loot, 120, 460);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section ref={stepRef} className={s.step} data-active={active} aria-hidden={!active}>
      {!exiting && (
        <>
          <StockBand
            active={active}
            className={s.areaStock}
            entering={entering}
            onNoticeChange={setNotice}
            wheelTargetRef={stepRef}
          />
        </>
      )}
      <div
        className={cx(
          s.status,
          entering && s.statusEntering,
          exiting && s.statusExiting,
        )}
        aria-live="polite"
      >
        <span className={s.statusLabel}>终端积分</span>
        <strong className={s.statusValue}>{credits.toLocaleString()}</strong>
        <span className={s.statusNotice} role="status">{notice}</span>
        <span className={s.statusCapacity}>已装 {backpack.length} 堆</span>
      </div>
      <div className={cx(s.side, entering && s.sideEntering, exiting && s.sideExiting)}>
        <StorageInventory className={s.areaStorage} />
        <ItemInventoryPanel
          className={s.areaBackpack}
          stacks={backpack}
          rows={3}
          columns={8}
          capacity={RULES.burden.backpackSlots}
          title="背包"
          compact
          onSelect={(stack) => {
            if (stack) putBack(stack.uid);
          }}
        />
      </div>
    </section>
  );
}