// 左列：装备选择。槽位筛选 + 双列装备格。

import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemTile from "@/ui/common/item/ItemTile";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab } from "@/ui/common/item/itemFilters";
import type { TooltipDirection } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
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
  disabled?: boolean;
}

export function EquipPickColumn({
  entries,
  equipTab,
  onEquipTab,
  selectedKey,
  onSelect,
  onShowTooltip,
  onHideTooltip,
  disabled = false,
}: Props) {
  const shown = entries.filter((entry) => matchTab(entry.stack, "equipment", equipTab));

  return (
    <section className={s.column} aria-label="装备选择">
      <ItemTabs equipmentOnly stacks={entries.map((entry) => entry.stack)} tab="equipment"
        equipTab={equipTab} onTab={() => {}} onEquipTab={onEquipTab} disabled={disabled} />

      {shown.length ? (
        <div className={s.grid} aria-disabled={disabled}>
          {shown.map((entry) => {
            const def = getItemDef(entry.stack.itemId);
            const on = selectedKey === entry.key;
            return (
              <div
                key={entry.key}
                className={cx(s.cell, on && s.on, disabled && s.locked)}
                onPointerEnter={(event) => onShowTooltip(event.currentTarget, entry.stack, "vertical")}
                onPointerLeave={onHideTooltip}
                onFocus={(event) => onShowTooltip(event.currentTarget, entry.stack, "vertical")}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHideTooltip();
                }}
              >
                <ItemTile
                  variant="compact"
                  stack={entry.stack}
                  selected={on}
                  disabled={disabled}
                  onClick={() => !disabled && onSelect(entry.key)}
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
