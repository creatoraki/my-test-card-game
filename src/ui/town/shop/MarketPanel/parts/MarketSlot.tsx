// 统一商店货位。商品立牌只负责选中，价格牌按调用方决定是购买入口还是展示态。
// 形状/描边/选中发光/售罄蒙层全部交给 MarketSlotFrame，这里只做内容组装。

import type { CSSProperties, ReactNode } from "react";
import type { ShopSlot } from "@/data/shop/shop";
import { MarketCardTile } from "./MarketCardTile";
import { MarketItemTile } from "./MarketItemTile";
import { MarketPriceTag } from "./MarketPriceTag";
import { MarketSlotFrame } from "./MarketSlotFrame";

interface Props {
  slot: ShopSlot;
  selected: boolean;
  className?: string;
  style?: CSSProperties;
  onSelect: (key: string) => void;
  getBuyReason: (slot: ShopSlot) => string | null;
  onBuy?: (key: string) => void;
  priceIcon?: (slot: ShopSlot) => ReactNode;
  priceText?: (slot: ShopSlot) => string;
}

export function MarketSlot({
  slot,
  selected,
  className,
  style,
  onSelect,
  getBuyReason,
  onBuy,
  priceIcon,
  priceText,
}: Props) {
  const buyReason = getBuyReason(slot);
  const slotPriceText = priceText?.(slot);

  return (
    <MarketSlotFrame selected={selected} sold={slot.sold} className={className} style={style}>
      {slot.kind === "card" ? (
        <MarketCardTile slot={slot} selected={selected} priceText={slotPriceText} onSelect={onSelect} />
      ) : (
        <MarketItemTile slot={slot} selected={selected} sold={slot.sold} priceText={slotPriceText} onSelect={onSelect} />
      )}
      <MarketPriceTag
        price={slot.price}
        sold={slot.sold}
        disabledReason={buyReason ?? undefined}
        icon={priceIcon?.(slot)}
        ariaText={slotPriceText}
        onBuy={onBuy ? () => onBuy(slot.key) : undefined}
      />
    </MarketSlotFrame>
  );
}
