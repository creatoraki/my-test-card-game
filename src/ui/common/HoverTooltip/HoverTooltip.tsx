import { createPortal } from "react-dom";
import { useRef, type CSSProperties, type ReactNode } from "react";
import {
  tooltipStyle,
  useTooltipPlacement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import s from "./HoverTooltip.module.css";

interface Props {
  point: TooltipPoint;
  themeStyle?: CSSProperties;
  children: ReactNode;
}

export function HoverTooltip({ point, themeStyle = {}, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);

  return createPortal(
    <div
      className={s["hover-tooltip"]}
      ref={ref}
      style={{ ...themeStyle, ...tooltipStyle(placement) }}
      role="tooltip"
    >
      {children}
    </div>,
    point.host,
  );
}