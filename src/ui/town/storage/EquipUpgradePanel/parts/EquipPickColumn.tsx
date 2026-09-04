// 左列: 装备选择。槽位筛选 + 单列滚动的装备格。

import ItemSlot from "@/ui/common/item/ItemSlot";
import { EQUIP_TABS, matchTab, type EquipTab } from "@/ui/common/item/itemFilters";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import type { TooltipDirection } from "@/ui/common/item/ItemTooltip";
import s from "./EquipPickColumn.module.css";

export interface PickEntry {
  key: string;
  stack: ItemStack;
  ownerName?: string;
}

interface Props {
  entries: PickEntry[];
  equipTab: EquipTab;
  onEquipTab: (tab: EquipTab) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => void;
  onHideTooltip: () => void;
}

export function EquipPickColumn({
  entries,
  equipTab,
  onEquipTab,
  selectedKey,
  onSelect,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const shown = entries.filter((entry) => matchTab(entry.stack, "equipment", equipTab));

  return (
    <section className={s.column} aria-label="装备选择">
      <nav className={s.tabs} aria-label="装备槽位">
        {EQUIP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cx(s.tab, equipTab === tab.id && s.tabOn)}
            aria-pressed={equipTab === tab.id}
            onClick={() => onEquipTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {shown.length ? (
        <div className={s.grid}>
          {shown.map((entry) => {
            const def = getItemDef(entry.stack.itemId);
            const on = selectedKey === entry.key;
            return (
              <div
                key={entry.key}
                className={cx(s.cell, on && s.on)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, entry.stack, "vertical")}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, entry.stack, "vertical")}
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
                  onClick={() => onSelect(entry.key)}
                  className={s.slot}
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
