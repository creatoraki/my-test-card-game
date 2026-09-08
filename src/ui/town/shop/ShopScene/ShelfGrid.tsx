// 商店六格混合货架。购买入口是每格底部的价格牌，详情栏只负责展示。

import { memo, useCallback } from "react";
import type { ShopSlot } from "@/data/shop";
import { cx } from "@/ui/common/cx";
import ShopItemTile from "@/ui/town/shop/ShopItemTile";
import { useSlotStacks } from "./shopStacks";
import s from "./ShelfGrid.module.css";

interface Props {
  slots: ShopSlot[];
  loot: number;
  selected: string | null;
  onSelect: (key: string) => void;
  onHoverStart: (key: string) => void;
  onHoverEnd: (key: string) => void;
  onBuy: (key: string) => void;
}

function ShelfGrid({
  slots,
  loot,
  selected,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onBuy,
}: Props) {
  const stacks = useSlotStacks(slots);

  return slots.length ? (
    <div className={cx(s["sx-grid"], s["is-entering"])} aria-label="商店货架">
      {slots.map((slot) => (
        <div key={slot.key} className={cx(s["sx-cell"], slot.sold && s["is-sold"])}>
          <ShopItemTile
            slotKey={slot.key}
            stack={stacks.get(slot.key)!}
            selected={selected === slot.key}
            sold={slot.sold}
            onSelect={onSelect}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
          />
          <ShelfPriceTag slot={slot} affordable={loot >= slot.price} onBuy={onBuy} />
        </div>
      ))}
    </div>
  ) : (
    <p className={s["sx-empty"]}>今天没有进货。</p>
  );
}

function ShelfPriceTagBase({
  slot,
  affordable,
  onBuy,
}: {
  slot: ShopSlot;
  affordable: boolean;
  onBuy: (key: string) => void;
}) {
  const state = slot.sold ? "sold" : affordable ? "ready" : "poor";
  const label = slot.sold ? "已售出" : affordable ? "买入" : "积分不足";
  const handleBuy = useCallback(() => onBuy(slot.key), [onBuy, slot.key]);

  return (
    <button
      className={cx(s["sx-price"], s[`is-${state}`])}
      type="button"
      disabled={slot.sold || !affordable}
      onClick={handleBuy}
      aria-label={`${label}，售价 ${slot.price} 居民积分`}
    >
      {slot.sold ? <span className={s["sx-price-sold"]}>已售出</span> : <strong>{slot.price}</strong>}
    </button>
  );
}

const ShelfPriceTag = memo(ShelfPriceTagBase);

export default memo(ShelfGrid);
