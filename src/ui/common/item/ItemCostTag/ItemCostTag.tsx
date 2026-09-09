import { useState, type CSSProperties, type PointerEvent } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/itemArt";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { cx } from "@/ui/common/cx";
import s from "./ItemCostTag.module.css";

interface Props {
  itemId: string;
  count: number;
  owned?: number;
  size?: "sm" | "md" | "lg";
  showOwned?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ItemCostTag({
  itemId,
  count,
  owned,
  size = "md",
  showOwned = false,
  compact = false,
  className,
}: Props) {
  const [point, setPoint] = useState<TooltipPoint | null>(null);
  const def = getItemDef(itemId);
  const short = owned != null && owned < count;
  const stack: ItemStack = { uid: `cost-${itemId}`, itemId, count };
  const label = `${def.name} ×${count}${showOwned && owned != null ? `，持有 ${owned}，需 ${count}` : ""}`;

  const showTooltip = (event: PointerEvent<HTMLSpanElement>) => {
    setPoint(tooltipPointFromElement(event.currentTarget));
  };

  return (
    <span
      className={cx(s.tag, s[`size-${size}`], compact && s.compact, short && s.short, className)}
      data-short={short || undefined}
      aria-label={label}
      role="img"
      onPointerEnter={showTooltip}
      onPointerLeave={() => setPoint(null)}
    >
      <span className={s.icon} aria-hidden="true">{itemIcon(def)}</span>
      {compact ? (
        <span className={s.compactCount}>×{count}</span>
      ) : (
        <span className={s.copy}>
          <span className={s.name}>{def.name} ×{count}</span>
          {showOwned && owned != null && <span className={s.owned}>持有 {owned} / 需 {count}</span>}
        </span>
      )}
      {point && (
        <ItemTooltip
          stack={stack}
          point={point}
          themeStyle={{ "--event-accent": "var(--event-accent)" } as CSSProperties}
        />
      )}
    </span>
  );
}
