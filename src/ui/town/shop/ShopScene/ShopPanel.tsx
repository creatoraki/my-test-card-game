import { useCallback, useEffect, useMemo, useState } from "react";
import { type ShopSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";
import { EventPanelButton, EventPanelFoot } from "@/ui/common/EventPanel";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import ShelfGrid from "@/ui/town/shop/ShopScene/ShelfGrid";
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
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedSlot = shop.slots.find((slot) => slot.key === selected) ?? null;
  const hoveredSlot = shop.slots.find((slot) => slot.key === hovered) ?? null;
  const displayedSlot = hoveredSlot ?? selectedSlot;
  const displayedStack = useMemo<ItemStack | null>(
    () => (displayedSlot ? asStack(displayedSlot) : null),
    [displayedSlot],
  );

  useEffect(() => {
    setSelected(null);
    setHovered(null);
  }, [day, shop.refreshes]);

  const handleHoverEnd = useCallback((key: string) => {
    setHovered((current) => (current === key ? null : current));
  }, []);

  return (
    <div className={s["sx-event-stage"]}>
      <div className={s["sx-body"]}>
        <div className={s["sx-main"]}>
          <ShelfGrid
            slots={shop.slots}
            loot={loot}
            selected={selected}
            onSelect={setSelected}
            onHoverStart={setHovered}
            onHoverEnd={handleHoverEnd}
            onBuy={onBuy}
          />
        </div>
        <ShopItemCard
          key={`${day}-${shop.refreshes}`}
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

const asStack = (slot: ShopSlot): ItemStack => ({
  uid: slot.key,
  itemId: slot.itemId,
  count: 1,
  affinity: slot.affinity,
  roll: slot.roll,
});
