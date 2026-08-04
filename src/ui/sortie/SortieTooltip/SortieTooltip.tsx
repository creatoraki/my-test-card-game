import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { cx } from "@/ui/common/cx";
import s from "./SortieTooltip.module.css";

const TOOLTIP_WIDTH = 260;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const TOOLTIP_GAP = 18;

interface Props {
  stack: ItemStack;
  anchor: DOMRect;
}

export function SortieTooltip({ stack, anchor }: Props) {
  if (typeof document === "undefined") return null;

  const right = anchor.right + TOOLTIP_GAP;
  const left =
    right + TOOLTIP_WIDTH <= window.innerWidth - 12
      ? right
      : Math.max(12, anchor.left - TOOLTIP_WIDTH - TOOLTIP_GAP);
  const top = Math.min(
    Math.max(12, anchor.top + anchor.height / 2 - TOOLTIP_ESTIMATED_HEIGHT / 2),
    Math.max(12, window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - 12),
  );

  return createPortal(
    <div
      className={cx(s.tooltip)}
      style={{ left: `${left}px`, top: `${top}px` }}
      role="tooltip"
    >
      <ItemDetail stack={stack} className={s.detail} />
    </div>,
    document.body,
  );
}
