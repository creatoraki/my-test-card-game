import { useEffect, useState } from "react";
import { type ShopSlot } from "@/data/shop";
import { EventPanelButton, EventPanelFoot } from "@/ui/common/EventPanel";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import ShelfGrid from "@/ui/town/shop/ShopScene/ShelfGrid";
import { useHoverKey } from "./useHoverKey";
import { useSlotStacks } from "./shopStacks";
import s from "./ShopScene.module.css";

interface Props {
  shop: { slots: ShopSlot[]; refreshes: number };
  loot: number;
  day: number;
  refreshCost: number;
  onBuy: (key: string) => void;
  onRefresh: () => void;
}

export function ShopPanel({
  shop,
  loot,
  day,
  refreshCost,
  onBuy,
  onRefresh,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const stacks = useSlotStacks(shop.slots);
  const { hovered, onHoverStart, onHoverEnd, reset } = useHoverKey();
  const displayedStack = (hovered ? stacks.get(hovered) : null) ?? (selected ? stacks.get(selected) : null) ?? null;

  useEffect(() => {
    setSelected(null);
    reset();
  }, [day, reset, shop.refreshes]);

  return (
    <div className={s["sx-event-stage"]}>
      <div className={s["sx-body"]}>
        <div className={s["sx-main"]}>
          <ShelfGrid
            slots={shop.slots}
            loot={loot}
            selected={selected}
            onSelect={setSelected}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            onBuy={onBuy}
          />
        </div>
        <ShopItemCard
          stack={displayedStack}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        />
      </div>
      <EventPanelFoot note="出击返回据点即推进一日，货架会自动换新。">
        <EventPanelButton
          tone="primary"
          className={s["sx-refresh"]}
          disabled={loot < refreshCost}
          onClick={onRefresh}
          aria-label={`刷新货架，花费 ${refreshCost} 居民积分`}
        >
          <span className={s["sx-refresh-icon"]} aria-hidden="true">
            ↻
          </span>
          <span className={s["sx-refresh-label"]}>刷新货架</span>
          <span className={s["sx-refresh-cost"]}>{refreshCost}</span>
        </EventPanelButton>
      </EventPanelFoot>
    </div>
  );
}
