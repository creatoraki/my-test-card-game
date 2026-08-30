// 商店六格混合货架。购买入口是每格底部的价格牌，详情栏只负责展示。

import { useMemo } from "react";
import type { ShopSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";
import { cx } from "@/ui/common/cx";
import ShopItemTile from "@/ui/town/shop/ShopItemTile";
import s from "./ShelfGrid.module.css";

interface Props {
  slots: ShopSlot[];
  loot: number;
  selected: string | null;
  onSelect: (key: string) => void;
  onHoverStart: (key: string) => void;
  onHoverEnd: (key: string) => void;
  onBuy: (key: string) => void;
  onIconRef: (key: string, element: HTMLSpanElement | null) => void;
}

export default function ShelfGrid({
  slots,
  loot,
  selected,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onBuy,
  onIconRef,
}: Props) {
  const stacks = useMemo(
    () => new Map(slots.map((slot) => [slot.key, asStack(slot)])),
    [slots],
  );

  return slots.length ? (
    <div className={cx(s["sx-grid"], s["is-entering"])} aria-label="商店货架">
      {slots.map((slot) => (
        <div key={slot.key} className={cx(s["sx-cell"], slot.sold && s["is-sold"])}>
          <ShopItemTile
            slotKey={slot.key}
            stack={stacks.get(slot.key)!}
            selected={selected === slot.key}
            sold={slot.sold}
            onIconRef={onIconRef}
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

function ShelfPriceTag({
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

  return (
    <button
      className={cx(s["sx-price"], s[`is-${state}`])}
      type="button"
      disabled={slot.sold || !affordable}
      onClick={() => onBuy(slot.key)}
      aria-label={`${label}，售价 ${slot.price} 居民积分`}
    >
      {slot.sold ? <span className={s["sx-price-sold"]}>已售出</span> : <strong>{slot.price}</strong>}
    </button>
  );
}

const asStack = (slot: ShopSlot): ItemStack => ({
  uid: slot.key,
  itemId: slot.itemId,
  count: 1,
  affinity: slot.affinity,
  roll: slot.roll,
});