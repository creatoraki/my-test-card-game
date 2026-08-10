import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import s from "./ItemTooltip.module.css";

const TOOLTIP_WIDTH = 260;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const TOOLTIP_GAP = 18;

export type TooltipPoint = {
  x: number;
  y: number;
};

export function tooltipPointFromRect(rect: DOMRect): TooltipPoint {
  return {
    x: rect.right,
    y: rect.top + rect.height / 2,
  };
}

export default function ItemTooltip({
  stack,
  point,
  themeStyle = {},
}: {
  stack: ItemStack;
  point: TooltipPoint;
  themeStyle?: CSSProperties;
}) {
  if (typeof document === "undefined") return null;

  const right = point.x + TOOLTIP_GAP;
  const left =
    right + TOOLTIP_WIDTH <= window.innerWidth - 12
      ? right
      : Math.max(12, point.x - TOOLTIP_WIDTH - TOOLTIP_GAP);
  const top = Math.min(
    Math.max(12, point.y - TOOLTIP_ESTIMATED_HEIGHT / 2),
    Math.max(12, window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - 12),
  );

  return createPortal(
    <div
      className={s["item-tooltip"]}
      style={{ ...themeStyle, left: `${left}px`, top: `${top}px` }}
      role="tooltip"
    >
      <ItemDetail stack={stack} className={s["item-tooltip-detail"]} />
    </div>,
    document.body,
  );
}