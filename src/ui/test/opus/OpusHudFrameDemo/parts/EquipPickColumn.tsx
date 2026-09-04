// 左列: 装备选择。二级筛选页签 + 可滚动的装备格网格。
// 行为参照正式面板的 EquipTargetList, 但测试目录各自独立, 这里自持一份轻量版。

import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab } from "@/ui/common/item/itemFilters";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import type { DemoEquip } from "../demoData";
import s from "./EquipPickColumn.module.css";

interface Props {
  equips: DemoEquip[];
  equipTab: EquipTab;
  onEquipTab: (tab: EquipTab) => void;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack) => void;
  onHideTooltip: () => void;
}

export function EquipPickColumn({
  equips,
  equipTab,
  onEquipTab,
  selectedUid,
  onSelect,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const shown = equips.filter((entry) => matchTab(entry.stack, "equipment", equipTab));

  return (
    <section className={s.column} aria-label="装备选择">
      <header className={s.heading}>
        <span className={s.kicker}>装备选择</span>
        <span className={s.count}>{equips.length} 件</span>
      </header>

      <ItemTabs
        stacks={equips.map((entry) => entry.stack)}
        tab="equipment"
        equipTab={equipTab}
        visibleTabs={["equipment"]}
        onTab={() => onEquipTab("all")}
        onEquipTab={onEquipTab}
        className={s.tabs}
      />

      {shown.length ? (
        <div className={s.grid}>
          {shown.map((entry) => {
            const def = getItemDef(entry.stack.itemId);
            const on = selectedUid === entry.stack.uid;
            return (
              <div
                key={entry.stack.uid}
                className={cx(s.cell, on && s.on)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, entry.stack)}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, entry.stack)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    onHideTooltip();
                  }
                }}
              >
                <ItemSlot
                  stack={entry.stack}
                  showName={false}
                  selected={on}
                  onClick={() => onSelect(entry.stack.uid)}
                  aria-label={`${def.name}${entry.ownerName ? `，${entry.ownerName}已穿戴` : "，仓库"}`}
                />
                {entry.ownerName && <span className={s.owner}>{entry.ownerName}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>没有符合筛选条件的装备。</p>
      )}
    </section>
  );
}
