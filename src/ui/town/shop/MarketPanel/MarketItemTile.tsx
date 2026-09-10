// 物品货位的展示立牌。它只响应选中，不包含价格或购买动作。

import { useCallback } from "react";
import { getItemDef } from "@/data";
import type { ShopItemSlot } from "@/data/shop";
import { itemIcon } from "@/ui/art/itemArt";
import { PRODUCT_TRAY_ART } from "@/ui/art/sceneArt";
import { cx } from "@/ui/common/cx";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
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
    <div
      className={cx(s.tile, s[`rarity-${def.rarity}`], selected && s["is-selected"], sold && s["is-sold"])}
      data-interactive-hint
    >
      <button
        type="button"
        className={s.button}
        aria-label={sold ? `${def.name}，已售出` : def.name}
        aria-pressed={selected}
        onClick={handleClick}
      >
        <img className={s.tray} src={PRODUCT_TRAY_ART} alt="" aria-hidden="true" />
        <span className={s.icon}>{itemIcon(def)}</span>
      </button>
      <InteractiveHint className={s.hint} active={selected} />
    </div>
  );
}
