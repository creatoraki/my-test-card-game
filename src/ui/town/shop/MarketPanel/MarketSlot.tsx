// 统一商店货位。货位本身只负责选中，不承担购买；购买入口集中在右侧详情栏。

import { useMemo } from "react";
import { makeCard } from "@/data";
import type { ShopSlot } from "@/data/shop";
import { cx } from "@/ui/common/cx";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { DeckCard } from "@/ui/character/DeckCard";
import { MarketItemTile } from "./MarketItemTile";
import { MarketPriceTag } from "./MarketPriceTag";
import s from "./MarketSlot.module.css";

interface Props {
  slot: ShopSlot;
  index: number;
  loot: number;
  selected: boolean;
  onSelect: (key: string) => void;
}

export function MarketSlot({ slot, index, loot, selected, onSelect }: Props) {
  const card = useMemo(
    () => slot.kind === "card" ? { ...makeCard(slot.cardDefId), ownerCharId: slot.charId } : null,
    [slot],
  );

  return (
    <div className={cx(s.slot, slot.sold && s["is-sold"])}>
      <div className={s.frame} data-interactive-hint>
        {slot.kind === "card" && card ? (
          <>
            <DeckCard
              card={card}
              index={index}
              selected={selected}
              className={s.card}
              hintClassName={s.hint}
              focusStyle="zoom"
              aria-label={slot.sold ? `${card.name}，已售出` : `${card.name}，售价 ${slot.price} 居民积分`}
              onClick={() => onSelect(slot.key)}
            />
            <InteractiveHint className={s.hint} />
            {slot.sold && <span className={s.soldMask}>已售出</span>}
          </>
        ) : slot.kind === "item" ? (
          <MarketItemTile slot={slot} selected={selected} sold={slot.sold} onSelect={onSelect} />
        ) : null}
      </div>
      <MarketPriceTag price={slot.price} sold={slot.sold} affordable={loot >= slot.price} />
    </div>
  );
}
