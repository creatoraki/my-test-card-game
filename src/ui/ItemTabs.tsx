// 分类 tab 条 —— 背包面板与仓库设施共用。
// 两级: 一级按类别; 选中「装备」时下面再展开武器/防具/饰品的二级 tab。
// tab 定义与过滤规则都在 ui/itemFilters.ts, 本组件只负责画。

import type { ItemStack } from "../items/types";
import { EQUIP_TABS, ITEM_TABS, tabCounts, type EquipTab, type ItemTab } from "./itemFilters";
import "./ItemTabs.css";

interface Props {
  stacks: ItemStack[]; // 用来给 tab 挂计数
  tab: ItemTab;
  equipTab: EquipTab;
  onTab: (t: ItemTab) => void;
  onEquipTab: (t: EquipTab) => void;
}

export default function ItemTabs({ stacks, tab, equipTab, onTab, onEquipTab }: Props) {
  const counts = tabCounts(stacks);

  return (
    <div className="item-tabs">
      <div className="item-tab-row">
        {ITEM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`item-tab${tab === t.id ? " is-on" : ""}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
            <span className="item-tab-count">{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* 二级 tab 只在「装备」下出现 —— 别的类别没有槽位可分 */}
      {tab === "equipment" && (
        <div className="item-tab-row is-sub">
          {EQUIP_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`item-tab is-sub${equipTab === t.id ? " is-on" : ""}`}
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
