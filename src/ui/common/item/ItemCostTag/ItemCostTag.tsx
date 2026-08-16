import { useState, type PointerEvent } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import ItemTooltip, { tooltipPointFromRect, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import s from "./ItemCostTag.module.css";

interface Props {
  itemId: string;
  count: number;
  owned?: number;
  size?: "sm" | "md";
  showOwned?: boolean;
  className?: string;
}

export default function ItemCostTag({
  itemId,
  count,
  owned,
  size = "md",
  showOwned = false,
  className,
}: Props) {
  const [point, setPoint] = useState<TooltipPoint | null>(null);
  const def = getItemDef(itemId);
  const short = owned != null && owned < count;
  const stack: ItemStack = { uid: `cost-${itemId}`, itemId, count };
  const label = `${def.name} ×${count}${showOwned && owned != null ? `，持有 ${owned}` : ""}`;

  const showTooltip = (event: PointerEvent<HTMLSpanElement>) => {
    setPoint(tooltipPointFromRect(event.currentTarget.getBoundingClientRect()));
  };

  return (
    <span
      className={cx(s.tag, s[`size-${size}`], short && s.short, className)}
      data-short={short || undefined}
      aria-label={label}
      role="img"
      onPointerEnter={showTooltip}
      onPointerLeave={() => setPoint(null)}
    >
      <span className={s.icon} aria-hidden="true">{itemIcon(def)}</span>
      <span className={s.count}>×{count}</span>
      {showOwned && owned != null && <span className={s.owned}>{owned}/{count}</span>}
      {point && <ItemTooltip stack={stack} point={point} themeStyle={{ "--event-accent": "var(--event-accent)" }} />}
    </span>
  );
}
