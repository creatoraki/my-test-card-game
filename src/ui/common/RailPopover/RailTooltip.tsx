import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { tooltipPointFromElement, tooltipStyle, useTooltipPlacement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import s from "./RailTooltip.module.css";

/** 状态详情挂到设计画布，避开角色、相机与 HUD 的局部层叠上下文。 */
export function RailTooltip({ side, children }: { side: string; children: ReactNode }) {
  const marker = useRef<HTMLSpanElement>(null);
  const [point, setPoint] = useState<TooltipPoint | null>(null);
  useEffect(() => {
    const anchor = marker.current?.closest<HTMLElement>("[data-rail-item]");
    if (!anchor) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      const active = anchor.matches(":hover") || anchor.contains(document.activeElement);
      if (!active || anchor.closest("[data-popover-mute]")) {
        setPoint(null);
      } else {
        const direction = side === "left" ? "left" : side === "right" ? "right" : side.startsWith("top") ? "top" : "vertical";
        const next = tooltipPointFromElement(anchor, direction);
        setPoint((previous) => previous?.host === next.host && previous.x === next.x
          && previous.y === next.y && previous.direction === next.direction ? previous : next);
      }
      // 运镜开始后即时隐藏，缩放与角色位移时重新定位。
      if (active) frame = requestAnimationFrame(update);
    };
    const events = ["pointerenter", "pointerleave", "focusin", "focusout"] as const;
    events.forEach((event) => anchor.addEventListener(event, update));
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((event) => anchor.removeEventListener(event, update));
    };
  }, [side]);
  return <><span ref={marker} hidden />{point && <TooltipLayer point={point}>{children}</TooltipLayer>}</>;
}

function TooltipLayer({ point, children }: { point: TooltipPoint; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const placement = useTooltipPlacement(point, ref);
  return createPortal(<div ref={ref} role="tooltip" className={s.tooltip} style={tooltipStyle(placement)}>
    {children}
  </div>, point.host);
}
