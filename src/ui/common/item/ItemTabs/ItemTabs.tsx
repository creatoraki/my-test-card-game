// 分类 tab 条 —— 背包面板与仓库设施共用。
// 两级: 一级按类别; 选中「装备」时下面再展开武器/防具/饰品的二级 tab。
// tab 定义与过滤规则都在 common/item/itemFilters.ts, 本组件只负责画。

import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import {
  EQUIP_TABS,
  ITEM_TABS,
  tabCounts,
  type EquipTab,
  type ItemTab,
} from "@/ui/common/item/itemFilters";
import s from "./ItemTabs.module.css";

interface Props {
  stacks: ItemStack[]; // 用来给 tab 挂计数
  tab: ItemTab;
  equipTab: EquipTab;
  onTab: (t: ItemTab) => void;
  onEquipTab: (t: EquipTab) => void;
  /** 调用方的布局类(tab 条在自己的面板里怎么占位)。外观一律由本组件持有。 */
  className?: string;
}

export default function ItemTabs({
  stacks,
  tab,
  equipTab,
  onTab,
  onEquipTab,
  className,
}: Props) {
  const counts = tabCounts(stacks);

  return (
    <div className={cx(s["item-tabs"], className)}>
      <div className={s["item-tab-row"]}>
        {ITEM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx(s["item-tab"], tab === t.id && s["is-on"])}
            onClick={() => onTab(t.id)}
          >
            {t.label}
            <span className={s["item-tab-count"]}>{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* 二级 tab 只在「装备」下出现 —— 别的类别没有槽位可分 */}
      {tab === "equipment" && (
        <div className={cx(s["item-tab-row"], s["is-sub"])}>
          {EQUIP_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cx(s["item-tab"], s["is-sub"], equipTab === t.id && s["is-on"])}
              onClick={() => onEquipTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
