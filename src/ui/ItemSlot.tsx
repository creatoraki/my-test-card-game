// 物品格 —— 背包(32 格网格)与仓库(流式网格)共用的**同一个**格子。
// 稀有度边框/角标/图标/数量/跨格全在这里, 两边不各画一遍。
// 稀有度配色读 styles/tokens.css 的 --rarity-* 令牌, 组件里不硬编码颜色。

import type { ItemStack } from "../items/types";
import { getItemDef } from "../data";
import { itemIcon } from "./itemArt";
import "./ItemSlot.css";

interface Props {
  stack: ItemStack;
  // 占几格。2 = 装备, 用 grid-column: span 2 真的横跨两格, 而不是画个"占 2 格"的标。
  span?: number;
  selected?: boolean;
  // 分类 tab 未命中。★ 压暗而不隐藏 —— 32 格是「物理容器」的隐喻,
  //   抽掉格子会让玩家失去空间感, 也看不出还剩多少地方。
  dimmed?: boolean;
  onClick?: () => void;
}

export default function ItemSlot({ stack, span = 1, selected, dimmed, onClick }: Props) {
  const def = getItemDef(stack.itemId);
  const cls = [
    "item-slot",
    `r-${def.rarity}`,
    selected ? "is-selected" : "",
    dimmed ? "is-dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      style={{ gridColumn: `span ${span}` }}
      onClick={onClick}
      title={`${def.name}（${def.slots} 格）`}
    >
      <span className="item-slot-icon">{itemIcon(def)}</span>
      <span className="item-slot-name">{def.name}</span>
      {stack.count > 1 && <span className="item-slot-count">{stack.count}</span>}
    </button>
  );
}

// 空格与被让出的死格。放在同一个文件里, 是因为它们的几何必须与 ItemSlot 逐 px 一致。
export function EmptySlot({ dead }: { dead?: boolean }) {
  return <span className={`item-slot is-empty${dead ? " is-dead" : ""}`} aria-hidden />;
}
