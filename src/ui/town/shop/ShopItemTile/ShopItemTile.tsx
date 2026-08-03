// 商店货架格 —— **商店专属**, 与背包/仓库共用的 ItemSlot 无任何样式关系。
//
// ★ 为什么不复用 ItemSlot: 商店的格子只要图标(名称/数量/羁绊角标全不显示), 且去底色、
//   用四角粗边表达悬浮与选中 —— 这些以前是靠 ShopScene.css 远程改写 .item-slot 做到的,
//   一条 base.css 的按钮规则变动就会两边一起塌。现在结构与样式都长在商店自己这边。
//
// 复用的是**逻辑**不是样式: getItemDef / getBondDef / itemIcon 照旧,
// 图标仍靠 stroke="currentColor" 吃父级 color(= --sx-rr), 一套图标覆盖五档稀有度。

import { getBondDef, getItemDef } from "@/data";
import productTrayArt from "@/assets/道具/商品托盘.png";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./ShopItemTile.module.css";

interface Props {
  stack: ItemStack;
  selected?: boolean;
  hovered?: boolean;
  /** 已售出: 压暗 + 描边落到面板线色。★ 保留占位, 当日不补货是规则的一部分。 */
  sold?: boolean;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function ShopItemTile({
  stack,
  selected,
  hovered,
  sold,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}: Props) {
  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const cls = cx(
    s["sx-tile"],
    s[`sx-r-${def.rarity}`],
    selected && s["is-selected"],
    hovered && s["is-hovered"],
    sold && s["is-sold"],
  );

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      title={bond ? `${def.name}（${bond.name} 羁绊）` : def.name}
    >
      <img className={s["sx-tile-tray"]} src={productTrayArt} alt="" aria-hidden="true" />
      <span className={s["sx-tile-icon"]}>{itemIcon(def)}</span>
    </button>
  );
}
