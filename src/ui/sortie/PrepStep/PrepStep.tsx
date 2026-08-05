import { SORTIE_STOCK_IDS } from "@/data";
import { useTownStore } from "@/store/townStore";
import { useCountUp } from "@/ui/hooks/useCountUp";
import { StockPanel } from "@/ui/sortie/StockPanel";
import { StoragePicker } from "@/ui/sortie/StoragePicker";
import { SortieBackpack } from "@/ui/sortie/SortieBackpack";
import s from "./PrepStep.module.css";

export function PrepStep() {
  const loot = useTownStore((state) => state.loot);
  const credits = useCountUp(loot, 120, 460);

  return (
    <section className={s.step}>
      {/* 左侧 640px 留给 SortieBackdrop 的目标层信息 —— 那块 HUD 在本步骤仍然可见, 标题不能压上去。 */}
      <header className={s.header}>
        <div className={s.heading}>
          <span className={s.kicker}>SORTIE LOADOUT / SUPPLY BAY</span>
          <h1 className={s.title}>出击物资准备</h1>
        </div>
        <div className={s.credits}>
          <span className={s.creditsLabel}>终端积分</span>
          <strong className={s.creditsValue}>{credits.toLocaleString()}</strong>
        </div>
      </header>

      {/* 三块面板只从这里拿「占哪块格 + 第几个入场」, 外观一律归各自的 module.css(样式铁律 3)。 */}
      <div className={s.layout}>
        <StoragePicker className={s.areaStorage} />
        <StockPanel itemIds={SORTIE_STOCK_IDS} className={s.areaStock} />
        <SortieBackpack className={s.areaBackpack} />
      </div>
    </section>
  );
}
