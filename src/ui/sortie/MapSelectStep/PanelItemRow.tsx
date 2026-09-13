import { useState } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot/ItemSlot";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import s from "./MapDifficultyPanel.module.css";

interface Props {
  title: string;
  stacks: ItemStack[];
  active: boolean;
}

export function PanelItemRow({ title, stacks, active }: Props) {
  const [itemTooltip, setItemTooltip] = useState<{
    stack: ItemStack;
    point: TooltipPoint;
  } | null>(null);

  return (
    <div className={s.rewardSection}>
      <div className={s.rewardHeading}>{title}</div>
      <div className={s.rewardRow}>
        {stacks.map((stack) => {
          const item = getItemDef(stack.itemId);
          return (
            <div
              key={stack.uid}
              className={s.rewardCell}
              onPointerEnter={(event) =>
                setItemTooltip({ stack, point: tooltipPointFromElement(event.currentTarget, "top") })
              }
              onPointerLeave={() => setItemTooltip(null)}
              onFocus={(event) =>
                setItemTooltip({ stack, point: tooltipPointFromElement(event.currentTarget, "top") })
              }
              onBlur={() => setItemTooltip(null)}
            >
              <ItemSlot
                stack={stack}
                className={s.rewardSlot}
                showName={false}
                showCount
                disabled={!active}
                aria-label={`${item.name} ×${stack.count}`}
              />
            </div>
          );
        })}
      </div>
      {itemTooltip && <SortieTooltip stack={itemTooltip.stack} point={itemTooltip.point} />}
    </div>
  );
}
