import { createPortal } from "react-dom";
import { useRef } from "react";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { tooltipStyle, useTooltipPlacement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import s from "./SortieTooltip.module.css";

interface Props {
  stack: ItemStack;
  /** 由 tooltipPointFromElement() 从触发元素算出 —— 设计 px + 所属画布。 */
  point: TooltipPoint;
}

/** 出击背包的物品浮卡。定位与 ItemTooltip 共用同一套实现, 只有配色不同。 */
export function SortieTooltip({ stack, point }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);

  return createPortal(
    <div className={cx(s.tooltip)} ref={ref} style={tooltipStyle(placement)} role="tooltip">
      <ItemDetail stack={stack} className={s.detail} />
    </div>,
    point.host,
  );
}
