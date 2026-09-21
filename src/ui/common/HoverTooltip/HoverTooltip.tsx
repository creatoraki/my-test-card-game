// 手动触发的悬浮详情定位层(配合 useHoverTooltip): 只负责 portal 到设计画布与边界内放置。
// ★ 外观统一交给 TooltipCard, 调用方把 <TooltipCard …/> 作为 children 传进来。

import { createPortal } from "react-dom";
import { useRef, type ReactNode } from "react";
import {
  tooltipStyle,
  useTooltipPlacement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import s from "./HoverTooltip.module.css";

interface Props {
  point: TooltipPoint;
  children: ReactNode;
}

export function HoverTooltip({ point, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);

  return createPortal(
    <div className={s["hover-tooltip"]} ref={ref} style={tooltipStyle(placement)} role="tooltip">
      {children}
    </div>,
    point.host,
  );
}
