// 随身遗物条 —— 挂在左上「背包负重」那一行, 与负重图标同一套几何。
//
// ★ 这里刻意不画框、不写名字: 负重 svg 是这一行的第一枚图标, 遗物顺着往右排,
//   整行读起来就是「我这趟身上带着什么」。具体效果一律靠悬浮浮卡, 不占版面。
import { useEffect, useState } from "react";
import type { ItemStack } from "@/items/types";
import { getItemDef } from "@/data";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { itemIcon } from "@/ui/art/itemArt";
import s from "./RelicRail.module.css";

export function RelicRail({ stacks }: { stacks: ItemStack[] }) {
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);

  useEffect(() => {
    if (hovered && !stacks.some((stack) => stack.uid === hovered.uid)) setHovered(null);
  }, [hovered, stacks]);

  if (!stacks.length) return null;

  const hoveredStack = hovered ? stacks.find((stack) => stack.uid === hovered.uid) ?? null : null;

  return (
    <div className={s.rail} aria-label="随身遗物" onClick={(event) => event.stopPropagation()}>
      {stacks.map((stack) => {
        const def = getItemDef(stack.itemId);
        return (
          <button
            className={s.item}
            key={stack.uid}
            type="button"
            aria-label={`随身遗物 ${def.name}`}
            onPointerEnter={(event) =>
              setHovered({ uid: stack.uid, point: tooltipPointFromElement(event.currentTarget, "vertical") })
            }
            onPointerLeave={() => setHovered((current) => (current?.uid === stack.uid ? null : current))}
            onFocus={(event) =>
              setHovered({ uid: stack.uid, point: tooltipPointFromElement(event.currentTarget, "vertical") })
            }
            onBlur={() => setHovered((current) => (current?.uid === stack.uid ? null : current))}
          >
            <span className={s.icon}>{itemIcon(def)}</span>
          </button>
        );
      })}
      {hoveredStack && hovered && (
        <ItemTooltip stack={hoveredStack} point={hovered.point} className={s.tooltip} />
      )}
    </div>
  );
}
