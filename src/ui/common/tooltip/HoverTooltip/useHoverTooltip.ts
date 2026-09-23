import { useState, type FocusEvent, type PointerEvent } from "react";
import {
  tooltipPointFromElement,
  type TooltipDirection,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";

export interface HoverTooltipBindings {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
}

/** direction: 浮层弹出方向, 默认在宿主右侧; 贴右缘的宿主(如右上角读数卡)传 "left"。 */
export function useHoverTooltip(direction: TooltipDirection = "right"): {
  point: TooltipPoint | null;
  bind: HoverTooltipBindings;
} {
  const [point, setPoint] = useState<TooltipPoint | null>(null);

  const bind: HoverTooltipBindings = {
    onPointerEnter: (event) => setPoint(tooltipPointFromElement(event.currentTarget, direction)),
    onPointerLeave: () => setPoint(null),
    onFocus: (event) => setPoint(tooltipPointFromElement(event.currentTarget, direction)),
    onBlur: () => setPoint(null),
  };

  return { point, bind };
}
