// 统一商店货位。货位本身只负责选中，不承担购买；购买入口集中在右侧详情栏。

import type { ShopSlot } from "@/data/shop";
import { cx } from "@/ui/common/cx";
import { MarketCardTile } from "./MarketCardTile";
import { MarketItemTile } from "./MarketItemTile";
import { MarketPriceTag } from "./MarketPriceTag";
import s from "./MarketSlot.module.css";

interface Props {
  slot: ShopSlot;
  loot: number;
  selected: boolean;
  onSelect: (key: string) => void;
}

export function MarketSlot({ slot, loot, selected, onSelect }: Props) {
  return (
    <div className={cx(s.slot, slot.sold && s["is-sold"])}>
      <div className={s.frame}>
        {slot.kind === "card" ? (
          <MarketCardTile slot={slot} selected={selected} onSelect={onSelect} />
        ) : (
          <MarketItemTile slot={slot} selected={selected} sold={slot.sold} onSelect={onSelect} />
        )}
      </div>
      <MarketPriceTag price={slot.price} sold={slot.sold} affordable={loot >= slot.price} />
    </div>
  );
}
