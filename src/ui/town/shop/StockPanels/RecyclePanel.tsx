// 浮层: 回收台 —— 把废料与装备换成居民积分。
// 设计文档 §6.1: 探索层不产出货币, **可回收物资必须带回据点出售**才换成居民积分。
// 原属物资中转仓; 该设施拆散后, 出售与采购同在商店场景, 一进一出读在一起。

import { useEffect, useState } from "react";
import { getItemDef, sellPriceOf, type TechTreeState } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemTabs from "@/ui/common/item/ItemTabs";
import type { EquipTab, ItemTab } from "@/ui/common/item/itemFilters";
import { cx } from "@/ui/common/cx";
import { ItemGrid } from "./ItemGrid";
import s from "./StockPanels.module.css";

export interface RecyclePanelProps {
  stacks: ItemStack[];
  loot: number;
  levels: TechTreeState["levels"];
  onSell: (uid: string) => void;
}

export function RecyclePanel({ stacks, loot, levels, onSell }: RecyclePanelProps) {
  const sellable = stacks.filter((stack) => sellPriceOf(getItemDef(stack.itemId), levels) > 0);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [picked, setPicked] = useState<string[]>([]);

  // 卖掉的东西会从 stacks 里消失, 勾选表得跟着收敛, 否则「已选 3 件」会一直挂着卖不掉的幽灵。
  useEffect(() => {
    setPicked((current) => current.filter((uid) => sellable.some((stack) => stack.uid === uid)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stacks]);

  const total = picked.reduce((sum, uid) => {
    const stack = sellable.find((item) => item.uid === uid);
    if (!stack) return sum;
    return sum + sellPriceOf(getItemDef(stack.itemId), levels) * stack.count;
  }, 0);

  const toggle = (uid: string) =>
    setPicked((current) =>
      current.includes(uid) ? current.filter((item) => item !== uid) : [...current, uid],
    );

  return (
    <div className={s.recycle}>
      <div className={cx(s.body, s.recycleBody)}>
        {sellable.length ? (
          <>
            <p className={s.note}>
              废料与装备在这里换成居民积分——这是探索层产出变成城镇通货的唯一途径。
            </p>
            <ItemTabs
              className={s.tabs}
              stacks={sellable}
              tab={tab}
              equipTab={equipTab}
              onTab={setTab}
              onEquipTab={setEquipTab}
            />
            <ItemGrid
              stacks={sellable}
              tab={tab}
              equipTab={equipTab}
              isSelected={(stack) => picked.includes(stack.uid)}
              onSelect={toggle}
              empty="该分类没有可回收物资。"
            />
          </>
        ) : (
          <p className={s.empty}>没有可回收的物资。请从远征里带回废料或装备。</p>
        )}
      </div>
      <div className={s.foot}>
        <p className={s.note}>
          当前余额 {loot.toLocaleString()} · 已选 {picked.length} 件，可换 {total} 积分
        </p>
        <button
          className={s.primary}
          type="button"
          disabled={!picked.length}
          onClick={() => {
            for (const uid of picked) onSell(uid);
            setPicked([]);
          }}
        >
          出售
        </button>
      </div>
    </div>
  );
}
