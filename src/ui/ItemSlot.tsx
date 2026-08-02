// 物品格 —— 背包(24 格网格)与仓库(流式网格)共用的**同一个**格子。
// 稀有度边框/角标/图标/数量全在这里, 两边不各画一遍。
// 稀有度配色读 styles/tokens.css 的 --rarity-* 令牌, 组件里不硬编码颜色。

import type { ItemStack } from "../items/types";
import { getBondDef, getItemDef } from "../data";
import { itemIcon } from "./itemArt";
import "./ItemSlot.css";

interface Props {
  stack: ItemStack;
  selected?: boolean;
  iconOnly?: boolean;
  // 分类 tab 未命中。★ 压暗而不隐藏 —— 24 格是「物理容器」的隐喻,
  //   抽掉格子会让玩家失去空间感, 也看不出还剩多少地方。
  dimmed?: boolean;
  onClick?: () => void;
}

export default function ItemSlot({ stack, selected, iconOnly, dimmed, onClick }: Props) {
  const def = getItemDef(stack.itemId);
  // 羁绊词条角标 —— 装备调配页要在一堆候选里挑"缺的那一条羁绊",
  // 每件都点开看详情太慢, 所以在格子上直接露出词条的 emoji。
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const cls = [
    "item-slot",
    `r-${def.rarity}`,
    selected ? "is-selected" : "",
    iconOnly ? "is-icon-only" : "",
    dimmed ? "is-dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      title={bond ? `${def.name}（${bond.name} 羁绊）` : def.name}
    >
      <span className="item-slot-icon">{itemIcon(def)}</span>
      <span className="item-slot-name">{def.name}</span>
      {stack.count > 1 && <span className="item-slot-count">{stack.count}</span>}
      {bond && <span className="item-slot-bond">{bond.emoji}</span>}
    </button>
  );
}

// 空格。放在同一个文件里, 是因为它的几何必须与 ItemSlot 逐 px 一致。
export function EmptySlot() {
  return <span className="item-slot is-empty" aria-hidden />;
}
