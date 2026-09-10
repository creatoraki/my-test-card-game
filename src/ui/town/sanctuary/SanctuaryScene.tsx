import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { SANCTUARY_RULES } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { useTownStore } from "@/store/townStore";
import s from "./SanctuaryScene.module.css";

interface Props {
  leaving?: boolean;
}

export function SanctuaryScene({ leaving = false }: Props) {
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const day = useTownStore((state) => state.day);
  const sanctuary = useTownStore((state) => state.sanctuary);
  const purifyRelic = useTownStore((state) => state.purifyRelic);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const curses = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).relic?.polarity === "curse"),
    [storage],
  );
  const blessings = useMemo(
    () => storage.filter((stack) => getItemDef(stack.itemId).relic?.polarity === "blessing"),
    [storage],
  );
  const selected = curses.find((stack) => stack.uid === selectedUid) ?? null;
  const selectedDef = selected ? getItemDef(selected.itemId) : null;
  const materials = selectedDef
    ? SANCTUARY_RULES.crystalCostByRarity[selectedDef.rarity]
    : null;
  const enoughMaterials = Boolean(
    materials && Object.entries(materials).every(([itemId, count]) =>
      storage.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0) >= count,
    ),
  );
  const canStart = Boolean(
    selected && selectedDef && materials && enoughMaterials &&
      sanctuary.purifying.length < SANCTUARY_RULES.capacity &&
      loot >= SANCTUARY_RULES.lootByRarity[selectedDef.rarity],
  );

  return (
    <div className={`${s.scene}${leaving ? ` ${s.leaving}` : ""}`}>
      <header className={s.header}>
        <span className={s.kicker}>据点净化设施</span>
        <h2>圣水池</h2>
        <p>把诅咒遗物转化为可长期收藏的祝福遗物。</p>
      </header>

      <div className={s.readout}>
        <span>第 {day} 日</span>
        <span>居民积分 {loot.toLocaleString()}</span>
        <span>净化席位 {sanctuary.purifying.length}/{SANCTUARY_RULES.capacity}</span>
      </div>

      <main className={s.content}>
        <section className={s.column}>
          <h3>待净化诅咒</h3>
          <div className={s.grid}>
            {curses.length ? curses.map((stack) => (
              <ItemSlot
                key={stack.uid}
                stack={stack}
                selected={stack.uid === selectedUid}
                onClick={() => setSelectedUid(stack.uid)}
              />
            )) : <p className={s.empty}>仓库里暂无诅咒遗物</p>}
          </div>
          <div className={s.detail}>
            <ItemDetail stack={selected} placeholder="选择一件诅咒遗物查看净化费用" />
            {selected && materials && selectedDef && (
              <div className={s.costBox}>
                <span>净化耗时 {SANCTUARY_RULES.days} 天</span>
                <span>居民积分 −{SANCTUARY_RULES.lootByRarity[selectedDef.rarity]}</span>
                <span>材料：{materialText(materials, storage)}</span>
                <button type="button" disabled={!canStart} onClick={() => {
                  if (purifyRelic(selected.itemId)) setSelectedUid(null);
                }}>
                  投入圣水池
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={s.column}>
          <h3>净化进度</h3>
          <div className={s.progressList}>
            {sanctuary.purifying.length ? sanctuary.purifying.map((entry) => (
              <div className={s.progress} key={`${entry.relicId}-${entry.daysLeft}`}>
                <strong>{getItemDef(entry.relicId).name}</strong>
                <span>还需 {entry.daysLeft} 天</span>
              </div>
            )) : <p className={s.empty}>净化池当前空闲</p>}
          </div>
          <h3>祝福收藏</h3>
          <div className={s.collection}>
            {blessings.length ? blessings.map((stack) => <ItemSlot key={stack.uid} stack={stack} />) : <p className={s.empty}>尚未收藏祝福遗物</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function materialText(cost: Readonly<Record<string, number>>, storage: ItemStack[]): string {
  return Object.entries(cost).map(([itemId, count]) => {
    const owned = storage.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0);
    return `${getItemDef(itemId).name} ${owned}/${count}`;
  }).join(" · ");
}
