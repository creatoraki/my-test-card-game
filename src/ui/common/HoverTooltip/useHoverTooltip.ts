import { useState, type FocusEvent, type PointerEvent } from "react";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";

export interface HoverTooltipBindings {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
}

export function useHoverTooltip(): {
  point: TooltipPoint | null;
  bind: HoverTooltipBindings;
} {
  const [point, setPoint] = useState<TooltipPoint | null>(null);

  const bind: HoverTooltipBindings = {
    onPointerEnter: (event) => setPoint(tooltipPointFromElement(event.currentTarget)),
    onPointerLeave: () => setPoint(null),
    onFocus: (event) => setPoint(tooltipPointFromElement(event.currentTarget)),
    onBlur: () => setPoint(null),
  };

  return { point, bind };
}