// 物品图标框 —— 全站唯一的「1:1 边框包裹图标」实现。
//
// ★ 铁律: 框里**只有图标**, 一个字都不放。名称、数量、持有量、价格一律由调用方
//   排在框的外面。以前 ItemCostTag 把图标和「可乐 ×1 / 持有 0 / 需 1」裹进同一个
//   非 1:1 的描边盒里, 文字一长框就被撑歪、还会和相邻文案叠字 —— 那类问题的根因
//   就是「边框同时负责图标与文字」, 这里从结构上把它切开。
//
// 稀有度配色读 styles/tokens.css 的 --rarity-* 令牌; 图标靠 stroke="currentColor"
// 吃下面的 color: var(--rr), 一套图标覆盖五档稀有度(与 ItemSlot 同一套契约)。

import {
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import s from "./ItemIconFrame.module.css";

export type IconFrameSize = "sm" | "md" | "lg" | "xl";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  itemId: string;
  /** 框边长(设计 px): sm 44 / md 64 / lg 96 / xl 132。 */
  size?: IconFrameSize;
  selected?: boolean;
  /** 已成交 / 不可用: 压暗去饱和, 但保留格子。 */
  dimmed?: boolean;
  /** short = 货币不足, 描边转红; 默认按稀有度着色。 */
  tone?: "rarity" | "short";
  /** 悬浮出组件式物品详情浮卡(项目禁用原生 title)。 */
  tooltip?: boolean;
  /** 可点选时渲染成 button, 纯展示时渲染成 span。 */
  as?: "span" | "button";
  className?: string;
}

export default function ItemIconFrame({
  itemId,
  size = "md",
  selected,
  dimmed,
  tone = "rarity",
  tooltip = false,
  as = "span",
  className,
  onPointerEnter,
  onPointerLeave,
  disabled,
  ...rest
}: Props) {
  const [point, setPoint] = useState<TooltipPoint | null>(null);
  const def = getItemDef(itemId);
  const stack: ItemStack = { uid: `icon-frame-${itemId}`, itemId, count: 1 };

  const handleEnter = (event: PointerEvent<HTMLElement>) => {
    if (tooltip) setPoint(tooltipPointFromElement(event.currentTarget));
    onPointerEnter?.(event as PointerEvent<HTMLButtonElement>);
  };
  const handleLeave = (event: PointerEvent<HTMLElement>) => {
    if (tooltip) setPoint(null);
    onPointerLeave?.(event as PointerEvent<HTMLButtonElement>);
  };

  const cls = cx(
    s.frame,
    s[`size-${size}`],
    s[`r-${def.rarity}`],
    tone === "short" && s.short,
    selected && s.selected,
    dimmed && s.dimmed,
    className,
  );
  const inner = (
    <>
      <span className={s.icon} aria-hidden="true">{itemIcon(def)}</span>
      {tooltip && point && (
        <ItemTooltip
          stack={stack}
          point={point}
          themeStyle={{ "--event-accent": "var(--event-accent)" } as CSSProperties}
        />
      )}
    </>
  );

  if (as === "button") {
    return (
      <button
        type="button"
        className={cls}
        disabled={disabled}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        {...rest}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      className={cls}
      role={rest["aria-label"] ? "img" : undefined}
      aria-label={rest["aria-label"]}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      {inner}
    </span>
  );
}
