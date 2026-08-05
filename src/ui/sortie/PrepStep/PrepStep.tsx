import { SORTIE_STOCK_IDS } from "@/data";
import { useTownStore } from "@/store/townStore";
import { StockPanel } from "@/ui/sortie/StockPanel";
import { StoragePicker } from "@/ui/sortie/StoragePicker";
import { SortieBackpack } from "@/ui/sortie/SortieBackpack";
import s from "./PrepStep.module.css";

export function PrepStep() {
  const loot = useTownStore((state) => state.loot);

  return (
    <section className={s.step}>
      <header className={s.header}>
        <div>
          <span className={s.kicker}>SORTIE LOADOUT / SUPPLY BAY</span>
          <h1>出击物资准备</h1>
          <p>带走的每一件物资都会占用背包空间，并影响战斗中的负重惩罚。</p>
        </div>
        <div className={s.credits}>
          <span>终端积分</span>
          <strong>{loot.toLocaleString()}</strong>
        </div>
      </header>

      <div className={s.layout}>
        <aside className={s.leftColumn}>
          <StoragePicker />
        </aside>

        <div className={s.rightColumn}>
          <StockPanel itemIds={SORTIE_STOCK_IDS} />
          <SortieBackpack />
        </div>
      </div>
    </section>
  );
}
