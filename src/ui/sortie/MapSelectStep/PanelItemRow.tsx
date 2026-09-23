import { useState, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { itemIcon } from "@/ui/art/items/itemArt";
import { SortieFrame } from "@/ui/sortie/SortieFrame";
import { SortieGlyph } from "@/ui/sortie/SortieGlyph";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import s from "./PanelItemRow.module.css";

interface Props {
  title: string;
  kind: "aid" | "daily";
  stacks: ItemStack[];
  active: boolean;
}

const AID_WIDTH = 424;
// 通关奖励：左右内边距 + 2~4 个 128px 格子 + 18px 间距，容器宽度随物品种数自适应。
const DAILY_PADDING = 52;
const DAILY_CELL = 128;
const DAILY_GAP = 18;

function dailyWidth(count: number): number {
  const slots = Math.min(4, Math.max(2, count));
  return DAILY_PADDING + slots * DAILY_CELL + (slots - 1) * DAILY_GAP;
}

export function PanelItemRow({ title, kind, stacks, active }: Props) {
  const [itemTooltip, setItemTooltip] = useState<{
    stack: ItemStack;
    point: TooltipPoint;
  } | null>(null);
  const width = kind === "aid" ? AID_WIDTH : dailyWidth(stacks.length);

  return (
    <section
      className={s.rewardSection}
      data-kind={kind}
      aria-label={title}
      style={{ "--row-width": `${width}px` } as CSSProperties}
    >
      <div className={s.surface} />
      <SortieFrame width={width} height={184} />
      <h2 className={s.rewardHeading}><SortieGlyph name={kind === "aid" ? "gift" : "box"} className={s.headingIcon} />{title}<span className={s.headingNote}>{kind === "aid" ? "配发" : "奖励 ›"}</span></h2>
      <div className={s.rewardRow}>
        {stacks.map((stack) => {
          const item = getItemDef(stack.itemId);
          return (
            <button
              type="button"
              key={stack.uid}
              className={s.rewardCell}
              disabled={!active}
              aria-label={`${item.name} ×${stack.count}`}
              onPointerEnter={(event) =>
                setItemTooltip({ stack, point: tooltipPointFromElement(event.currentTarget, "top") })
              }
              onPointerLeave={() => setItemTooltip(null)}
              onFocus={(event) =>
                setItemTooltip({ stack, point: tooltipPointFromElement(event.currentTarget, "top") })
              }
              onBlur={() => setItemTooltip(null)}
            >
              <span className={s.cellSurface} />
              <SortieFrame width={kind === "aid" ? 116 : 128} height={102} notch={9} metal={false} />
              <span className={s.itemArt}>{itemIcon(item)}</span>
              <span className={s.count}>×{stack.count}</span>
            </button>
          );
        })}
        {stacks.length === 0 && <p className={s.empty}>今日奖励已领取</p>}
      </div>
      {active && itemTooltip && <ItemTooltip stack={itemTooltip.stack} point={itemTooltip.point} />}
    </section>
  );
}
