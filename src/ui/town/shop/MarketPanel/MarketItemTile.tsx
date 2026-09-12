// 物品货位的展示立牌。它只响应选中，不包含价格或购买动作。

import { useCallback } from "react";
import { getItemDef } from "@/data";
import type { ShopItemSlot } from "@/data/shop";
import { itemIcon } from "@/ui/art/itemArt";
import { CATEGORY_LABEL, RARITY_LABEL } from "@/items/types";
import { MarketTile } from "./MarketTile";
import s from "./MarketItemTile.module.css";

interface Props {
  slot: ShopItemSlot;
  selected: boolean;
  sold: boolean;
  onSelect: (key: string) => void;
}

export function MarketItemTile({ slot, selected, sold, onSelect }: Props) {
  const def = getItemDef(slot.itemId);
  const handleClick = useCallback(() => onSelect(slot.key), [onSelect, slot.key]);
  return (
    <MarketTile
      selected={selected}
      sold={sold}
      rarityClass={s[`rarity-${def.rarity}`]}
      ariaLabel={sold ? `${def.name}，已售出` : `${def.name}，售价 ${slot.price} 居民积分`}
      onSelect={handleClick}
    >
      <span className={s.stage}>
        <span className={s.icon}>{itemIcon(def)}</span>
      </span>
      <span className={s.copy}>
        <strong className={s.name}>{def.name}</strong>
        <span className={s.tags}><span>{CATEGORY_LABEL[def.category]}</span><span>{RARITY_LABEL[def.rarity]}</span></span>
        <span className={s.description}>{def.desc}</span>
      </span>
    </MarketTile>
  );
}
