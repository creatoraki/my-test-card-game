// 卡牌货位的展示立牌。卡面直接复用 HandCard，避免 DeckCard 带来的嵌套按钮。

import { useCallback, useMemo } from "react";
import { makeCard } from "@/data";
import type { ShopCardSlot } from "@/data/shop";
import { HandCard } from "@/ui/battle/HandCard";
import { cx } from "@/ui/common/cx";
import { MarketTile } from "./MarketTile";
import s from "./MarketCardTile.module.css";

interface Props {
  slot: ShopCardSlot;
  selected: boolean;
  onSelect: (key: string) => void;
}

export function MarketCardTile({ slot, selected, onSelect }: Props) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );
  const handleSelect = useCallback(() => onSelect(slot.key), [onSelect, slot.key]);

  return (
    <MarketTile
      selected={selected}
      sold={slot.sold}
      ariaLabel={slot.sold ? `${card.name}，已售出` : `${card.name}，售价 ${slot.price} 居民积分`}
      onSelect={handleSelect}
    >
      <span className={cx(s.cardBox, slot.sold && s["is-sold"])} data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} />
      </span>
    </MarketTile>
  );
}
