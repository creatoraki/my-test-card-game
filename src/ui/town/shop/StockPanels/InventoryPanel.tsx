// 浮层: 库存清单 —— 全部在库物资 + 丢弃。
// 原属物资中转仓; 该设施拆散后, 物资相关(库存/回收/仓库)统一收进商店场景。

import { useEffect, useMemo, useState } from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemTabs from "@/ui/common/item/ItemTabs";
import type { EquipTab, ItemTab } from "@/ui/common/item/itemFilters";
import { cx } from "@/ui/common/cx";
import { ItemGrid } from "./ItemGrid";
import s from "./StockPanels.module.css";

export interface InventoryPanelProps {
  stacks: ItemStack[];
  onDiscard: (uid: string) => void;
}

export function InventoryPanel({ stacks, onDiscard }: InventoryPanelProps) {
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const displayStacks = useMemo(() => mergeStacksForDisplay(stacks, getItemDef), [stacks]);

  // 换选中项时清掉确认态 —— 否则「确认丢弃」会挂在另一件东西上。
  useEffect(() => setConfirming(null), [selected]);

  const sel = displayStacks.find((stack) => stack.uid === selected) ?? null;

  // 材料/消耗品在界面上是合并显示的一摞, 丢弃要把同类同羁绊的原始堆一并丢掉。
  const discardSelection = (stack: ItemStack) => {
    const def = getItemDef(stack.itemId);
    if (def.category !== "material" && def.category !== "consumable") {
      onDiscard(stack.uid);
      return;
    }
    for (const source of stacks) {
      if (source.itemId === stack.itemId && source.affinity === stack.affinity) {
        onDiscard(source.uid);
      }
    }
  };

  return (
    <div className={s.body}>
      <div className={s.main}>
        <ItemTabs
          stacks={displayStacks}
          tab={tab}
          equipTab={equipTab}
          onTab={setTab}
          onEquipTab={setEquipTab}
          className={s.tabs}
        />
        <ItemGrid
          stacks={displayStacks}
          tab={tab}
          equipTab={equipTab}
          isSelected={(stack) => selected === stack.uid}
          onSelect={setSelected}
          empty="仓库是空的 —— 从远征活着回来才会有东西进来。"
        />
      </div>
      <ItemDetail stack={sel} placeholder="仓库不设上限，带回来多少放多少。" className={s.detail}>
        {sel &&
          (confirming === sel.uid ? (
            <>
              <button
                className={cx(s.btn, s["is-danger"])}
                type="button"
                onClick={() => {
                  discardSelection(sel);
                  setSelected(null);
                }}
              >
                确认丢弃
              </button>
              <button className={s.btn} type="button" onClick={() => setConfirming(null)}>
                取消
              </button>
            </>
          ) : (
            <button className={s.btn} type="button" onClick={() => setConfirming(sel.uid)}>
              丢弃
            </button>
          ))}
      </ItemDetail>
    </div>
  );
}
