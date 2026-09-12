// 统一商店货位。商品立牌只负责选中，价格牌是唯一购买入口。
// 形状/描边/选中发光/售罄蒙层全部交给 MarketSlotFrame，这里只做内容组装。

import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import { MarketCardTile } from "./MarketCardTile";
import { MarketItemTile } from "./MarketItemTile";
import { MarketPriceTag } from "./MarketPriceTag";
import { MarketSlotFrame } from "./MarketSlotFrame";
import { marketBuyReason } from "./marketBuyReason";

interface Props {
  slot: ShopSlot;
  characters: Record<string, CharacterState>;
  loot: number;
  selected: boolean;
  onSelect: (key: string) => void;
  onBuy: (key: string) => void;
}

export function MarketSlot({ slot, characters, loot, selected, onSelect, onBuy }: Props) {
  const buyReason = marketBuyReason(slot, characters, loot);

  return (
    <MarketSlotFrame selected={selected} sold={slot.sold}>
      {slot.kind === "card" ? (
        <MarketCardTile slot={slot} selected={selected} onSelect={onSelect} />
      ) : (
        <MarketItemTile slot={slot} selected={selected} sold={slot.sold} onSelect={onSelect} />
      )}
      <MarketPriceTag
        price={slot.price}
        sold={slot.sold}
        disabledReason={buyReason ?? undefined}
        onBuy={() => onBuy(slot.key)}
      />
    </MarketSlotFrame>
  );
}
