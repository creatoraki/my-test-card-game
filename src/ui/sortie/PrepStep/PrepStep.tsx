import { StockBand } from "@/ui/sortie/StockBand";
import { StoragePicker } from "@/ui/sortie/StoragePicker";
import { SortieBackpack } from "@/ui/sortie/SortieBackpack";
import s from "./PrepStep.module.css";

export function PrepStep({ active }: { active: boolean }) {
  return (
    <section className={s.step} data-active={active} aria-hidden={!active}>
      <StockBand active={active} className={s.areaStock} />
      <div className={s.side}>
        <StoragePicker className={s.areaStorage} />
        <SortieBackpack className={s.areaBackpack} />
      </div>
    </section>
  );
}
