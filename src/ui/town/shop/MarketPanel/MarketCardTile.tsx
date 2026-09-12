// 卡牌商品与物品采用一致的插画立牌，完整效果在右侧详情展示。

import { useCallback, useMemo } from "react";
import { makeCard } from "@/data";
import type { ShopCardSlot } from "@/data/shop";
import { cardDisplayName } from "@/engine";
import { cardArt } from "@/ui/art/cardArt";
import { useCardText } from "@/ui/common/cardText";
import { CardTextRich } from "@/ui/common/CardTextRich";
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
  const text = useCardText(card);
  const rarityLabel = { basic: "基础", common: "普通", uncommon: "罕见", rare: "稀有" };

  return (
    <MarketTile
      selected={selected}
      sold={slot.sold}
      ariaLabel={slot.sold ? `${card.name}，已售出` : `${card.name}，售价 ${slot.price} 居民积分`}
      onSelect={handleSelect}
    >
      <span className={s.art}><img src={cardArt(card.id)} alt="" draggable={false} /></span>
      <span className={s.copy}>
        <strong className={s.name}>{cardDisplayName(card)}</strong>
        <span className={s.tags}><span>卡牌</span><span>{rarityLabel[slot.rarity]}</span></span>
        <span className={s.description}><CardTextRich text={text} /></span>
      </span>
    </MarketTile>
  );
}
