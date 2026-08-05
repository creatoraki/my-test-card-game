import { useState } from "react";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { StockBand } from "@/ui/sortie/StockBand";
import { StoragePicker } from "@/ui/sortie/StoragePicker";
import { SortieBackpack } from "@/ui/sortie/SortieBackpack";
import s from "./PrepStep.module.css";

export function PrepStep({ active, entering }: { active: boolean; entering: boolean }) {
  const loot = useTownStore((state) => state.loot);
  const backpack = useSortieStore((state) => state.backpack);
  const credits = useCountUp(loot, 120, 460);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section className={s.step} data-active={active} aria-hidden={!active}>
      <div className={s.status} aria-live="polite">
        <span className={s.statusLabel}>终端积分</span>
        <strong className={s.statusValue}>{credits.toLocaleString()}</strong>
        <span className={s.statusNotice} role="status">{notice}</span>
        <span className={s.statusCapacity}>已装 {backpack.length} 堆</span>
      </div>
      <StockBand
        active={active}
        className={s.areaStock}
        entering={entering}
        onNoticeChange={setNotice}
      />
      <div className={s.side}>
        <StoragePicker className={s.areaStorage} />
        <SortieBackpack className={s.areaBackpack} />
      </div>
    </section>
  );
}
