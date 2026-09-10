import { getItemDef } from "@/data";
import { SANCTUARY_RULES } from "@/data/sanctuary";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { useTownStore } from "@/store/townStore";
import kit from "../styles/cryoKit.module.css";
import { useSanctuaryPurify } from "./useSanctuaryPurify";
import s from "./SanctuaryPanel.module.css";

interface Props {
  onPurify: (relicId: string) => boolean;
}

export function SanctuaryPanel({ onPurify }: Props) {
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const sanctuary = useTownStore((state) => state.sanctuary);
  const purify = useSanctuaryPurify({ storage, loot, sanctuary, purifyRelic: onPurify });

  return (
    <div className={kit.shell}>
      <div className={s.body}>
        <div className={s.columns}>
          <section className={s.column}>
            <h4 className={s.heading}>待净化诅咒</h4>
            <div className={s.slotGrid}>
              {purify.curses.length ? purify.curses.map((stack) => (
                <ItemSlot
                  key={stack.uid}
                  stack={stack}
                  selected={stack.uid === purify.selected?.uid}
                  onClick={() => purify.select(stack.uid)}
                />
              )) : <p className={s.empty}>仓库里暂无诅咒遗物</p>}
            </div>
          </section>

          <section className={s.column}>
            <h4 className={s.heading}>遗物详情</h4>
            <div className={s.detail}>
              <ItemDetail stack={purify.selected} placeholder="选择一件诅咒遗物查看净化费用" />
            </div>
            {purify.selected && purify.materials && purify.selectedDef && purify.lootCost !== null && (
              <div className={s.costBox}>
                <span>净化耗时 {SANCTUARY_RULES.days} 天</span>
                <span>居民积分 −{purify.lootCost}</span>
                <span>材料：{purify.materialText(purify.materials)}</span>
              </div>
            )}
          </section>

          <section className={s.column}>
            <h4 className={s.heading}>净化进度</h4>
            <div className={s.progressList}>
              {purify.sanctuary.purifying.length ? purify.sanctuary.purifying.map((entry, index) => (
                <div className={s.progress} key={`${entry.relicId}-${index}`}>
                  <strong>{getItemDef(entry.relicId).name}</strong>
                  <span>还需 {entry.daysLeft} 天</span>
                </div>
              )) : <p className={s.empty}>净化池当前空闲</p>}
            </div>
            <h4 className={s.heading}>祝福收藏</h4>
            <div className={s.collection}>
              {purify.blessings.length ? purify.blessings.map((stack) => (
                <ItemSlot key={stack.uid} stack={stack} />
              )) : <p className={s.empty}>尚未收藏祝福遗物</p>}
            </div>
          </section>
        </div>

        <div className={kit.panelFoot}>
          <p className={kit.note}>{purify.note}</p>
          <button className={kit.primary} type="button" disabled={!purify.canStart} onClick={purify.confirm}>
            投入圣水池
          </button>
        </div>
      </div>
    </div>
  );
}
