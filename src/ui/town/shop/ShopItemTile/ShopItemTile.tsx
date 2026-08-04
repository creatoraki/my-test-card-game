// 商店货架格 —— **商店专属**, 与背包/仓库共用的 ItemSlot 无任何样式关系。
//
// ★ 为什么不复用 ItemSlot: 商店的格子只要图标(名称/数量/羁绊角标全不显示), 且去底色、
//   用四角粗边表达悬浮与选中 —— 这些以前是靠 ShopScene.css 远程改写 .item-slot 做到的,
//   一条 base.css 的按钮规则变动就会两边一起塌。现在结构与样式都长在商店自己这边。
//
// 复用的是**逻辑**不是样式: getItemDef / getBondDef / itemIcon 照旧,
// 图标仍靠 stroke="currentColor" 吃父级 color(= --sx-rr), 一套图标覆盖五档稀有度。

// ★ 悬浮的**视觉**完全交给 CSS :hover —— 组件不再接收 hovered prop。
//   以前 hover 走一圈 React state 再回来打 .is-hovered 类, 视觉反馈要等一次 render+commit;
//   :hover 是同帧生效的。父级仍持有 hovered 状态, 但那只喂右侧详情栏。
//
// ★ 所有回调都回传 slotKey 而不是各自闭包 —— 父级因此能用**稳定**的回调,
//   memo 才不会被每渲染一次就新建的内联箭头函数击穿(见文件末尾)。

import { memo, useCallback } from "react";
import { getBondDef, getItemDef } from "@/data";
import { PRODUCT_TRAY_ART } from "@/ui/art/sceneArt";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./ShopItemTile.module.css";

interface Props {
  /** 货架格的 key —— 回调与 ref 注册一律回传它。 */
  slotKey: string;
  stack: ItemStack;
  selected?: boolean;
  /** 已售出: 压暗 + 描边落到面板线色。★ 保留占位, 当日不补货是规则的一部分。 */
  sold?: boolean;
  /** 购买飞行动画的起点 —— 把图标节点登记到 ShopScene 的 Map 里。 */
  onIconRef?: (key: string, element: HTMLSpanElement | null) => void;
  onSelect?: (key: string) => void;
  onHoverStart?: (key: string) => void;
  onHoverEnd?: (key: string) => void;
}

function ShopItemTile({
  slotKey,
  stack,
  selected,
  sold,
  onIconRef,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: Props) {
  const def = getItemDef(stack.itemId);
  const bond = getBondDef(stack.affinity ?? def.affinity ?? "");
  const cls = cx(s["sx-tile"], s[`sx-r-${def.rarity}`], selected && s["is-selected"], sold && s["is-sold"]);

  const handleClick = useCallback(() => onSelect?.(slotKey), [onSelect, slotKey]);
  const handleHoverStart = useCallback(() => onHoverStart?.(slotKey), [onHoverStart, slotKey]);
  const handleHoverEnd = useCallback(() => onHoverEnd?.(slotKey), [onHoverEnd, slotKey]);
  // ref 回调必须**稳定**: 内联写法每次渲染都会先以 null 再以节点各调一次, 白白 detach/attach。
  const handleIconRef = useCallback(
    (element: HTMLSpanElement | null) => onIconRef?.(slotKey, element),
    [onIconRef, slotKey],
  );

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      onPointerEnter={handleHoverStart}
      onPointerLeave={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
      title={bond ? `${def.name}（${bond.name} 羁绊）` : def.name}
    >
      <img className={s["sx-tile-tray"]} src={PRODUCT_TRAY_ART} alt="" aria-hidden="true" />
      <span ref={handleIconRef} className={s["sx-tile-icon"]}>
        {itemIcon(def)}
      </span>
    </button>
  );
}

// ★ memo 是**必要**的, 不是优化洁癖: 悬浮任一格都会让 ShelfPanel 重渲染(详情栏要跟着换),
//   没有 memo 的话一屏 6 个格子连同 itemIcon 会跟着白跑一遍。
//   生效前提是 props 稳定 —— 见 ShelfRow 里的 useMemo(stack) 与上游的 useCallback。
export default memo(ShopItemTile);
