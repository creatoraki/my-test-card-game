// 物品格 —— 背包(24 格网格)与仓库(流式网格)共用的**同一个**格子。
// 稀有度边框/角标/图标/数量全在这里, 两边不各画一遍。
// 稀有度配色读 styles/tokens.css 的 --rarity-* 令牌, 组件里不硬编码颜色。

import type { ItemStack } from "../items/types";
import { getItemDef } from "../data";
import { itemIcon } from "./itemArt";
import "./ItemSlot.css";

interface Props {
  stack: ItemStack;
  selected?: boolean;
  // 分类 tab 未命中。★ 压暗而不隐藏 —— 24 格是「物理容器」的隐喻,
  //   抽掉格子会让玩家失去空间感, 也看不出还剩多少地方。
  dimmed?: boolean;
  onClick?: () => void;
}

export default function ItemSlot({ stack, selected, dimmed, onClick }: Props) {
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
    <button type="button" className={cls} onClick={onClick} title={def.name}>
      <span className="item-slot-icon">{itemIcon(def)}</span>
      <span className="item-slot-name">{def.name}</span>
      {stack.count > 1 && <span className="item-slot-count">{stack.count}</span>}
    </button>
  );
}

// 空格。放在同一个文件里, 是因为它的几何必须与 ItemSlot 逐 px 一致。
export function EmptySlot() {
  return <span className="item-slot is-empty" aria-hidden />;
}
