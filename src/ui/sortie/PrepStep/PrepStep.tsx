import { MAPS, SORTIE_STOCK_IDS } from "@/data";
import { useRunStore } from "@/store/runStore";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { StockPanel } from "@/ui/sortie/StockPanel";
import { StoragePicker } from "@/ui/sortie/StoragePicker";
import { SortieBackpack } from "@/ui/sortie/SortieBackpack";
import s from "./PrepStep.module.css";

export function PrepStep() {
  const mapId = useSortieStore((state) => state.mapId);
  const backpack = useSortieStore((state) => state.backpack);
  const backToMap = useSortieStore((state) => state.backToMap);
  const clear = useSortieStore((state) => state.clear);
  const loot = useTownStore((state) => state.loot);
  const startExpedition = useRunStore((state) => state.startExpedition);
  const map = MAPS.find((candidate) => candidate.id === mapId) ?? MAPS[0];

  const startRun = () => {
    if (!mapId) return;
    startExpedition(mapId, backpack);
    clear();
  };

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
          <section className={s.mapCard}>
            <div className={s.panelHead}>
              <span className={s.panelLabel}>TARGET SECTOR</span>
            </div>
            {map && (
              <>
                <strong className={s.mapName}>{map.name}</strong>
                <div className={s.mapLine}>
                  <span>{"★".repeat(map.difficulty)}{"☆".repeat(5 - map.difficulty)}</span>
                  <span>{map.roundCount} 轮</span>
                  <span>粒子 {map.startingEnergy}</span>
                </div>
                <p>{map.desc}</p>
              </>
            )}
          </section>
          <StoragePicker />
        </aside>

        <div className={s.rightColumn}>
          <StockPanel itemIds={SORTIE_STOCK_IDS} />
          <SortieBackpack />
        </div>
      </div>

      <footer className={s.footer}>
        <button className={s.secondary} type="button" onClick={backToMap}>
          返回选择目标层
        </button>
        <button className={s.primary} type="button" onClick={startRun} disabled={!mapId}>
          出击 <span aria-hidden>▸</span>
        </button>
      </footer>
    </section>
  );
}
