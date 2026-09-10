import { useState } from "react";
import type { ItemStack } from "@/items/types";
import { getItemDef } from "@/data";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { itemIcon } from "@/ui/art/itemArt";
import s from "./RelicRail.module.css";

export function RelicRail({ stacks }: { stacks: ItemStack[] }) {
  const [hovered, setHovered] = useState<{ stack: ItemStack; point: TooltipPoint } | null>(null);
  if (!stacks.length) return null;

  return (
    <div className={s.rail} aria-label="随身遗物" onClick={(event) => event.stopPropagation()}>
      <span className={s.label}>随身遗物</span>
      <div className={s.items}>
        {stacks.map((stack) => {
          const def = getItemDef(stack.itemId);
          return (
            <button
              className={s.item}
              key={stack.uid}
              type="button"
              aria-label={def.name}
              onPointerEnter={(event) => setHovered({ stack, point: tooltipPointFromElement(event.currentTarget, "left") })}
              onPointerLeave={() => setHovered((current) => current?.stack.uid === stack.uid ? null : current)}
              onFocus={(event) => setHovered({ stack, point: tooltipPointFromElement(event.currentTarget, "left") })}
              onBlur={() => setHovered((current) => current?.stack.uid === stack.uid ? null : current)}
            >
              <span className={s.icon}>{itemIcon(def)}</span>
              <span className={s.name}>{def.name}</span>
            </button>
          );
        })}
      </div>
      {hovered && <ItemTooltip stack={hovered.stack} point={hovered.point} className={s.tooltip} />}
    </div>
  );
}
