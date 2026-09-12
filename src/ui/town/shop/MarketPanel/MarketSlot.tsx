// 统一商店货位。商品立牌只负责选中，价格牌是唯一购买入口。

import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { MarketCardTile } from "./MarketCardTile";
import { MarketItemTile } from "./MarketItemTile";
import { MarketPriceTag } from "./MarketPriceTag";
import { marketBuyReason } from "./marketBuyReason";
import s from "./MarketSlot.module.css";

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
    <div className={cx(s.slot, selected && s["is-selected"], slot.sold && s["is-sold"])}>
      <div className={s.frame}>
        {slot.kind === "card" ? (
          <MarketCardTile slot={slot} selected={selected} onSelect={onSelect} />
        ) : (
          <MarketItemTile slot={slot} selected={selected} sold={slot.sold} onSelect={onSelect} />
        )}
      </div>
      <MarketPriceTag
        price={slot.price}
        sold={slot.sold}
        disabledReason={buyReason ?? undefined}
        onBuy={() => onBuy(slot.key)}
      />
    </div>
  );
}
