// 货位底部的购买价格行。外观是设计图里的"金币 + 数字"，但它仍是唯一的付款入口。

import { cx } from "@/ui/common/cx";
import { MarketPriceArtwork } from "./MarketPriceArtwork";
import s from "./MarketPriceTag.module.css";

interface Props {
  price: number;
  sold: boolean;
  disabledReason?: string;
  onBuy: () => void;
}

export function MarketPriceTag({ price, sold, disabledReason, onBuy }: Props) {
  const canBuy = !sold && !disabledReason;
  const state = sold ? "sold" : canBuy ? "ready" : "poor";
  const ariaLabel = sold
    ? "已售出"
    : canBuy
      ? `点击价格牌购买，售价 ${price} 居民积分`
      : disabledReason;

  return (
    <button
      className={cx(s.tag, s[`is-${state}`])}
      type="button"
      disabled={!canBuy}
      aria-label={ariaLabel}
      onClick={onBuy}
    >
      <MarketPriceArtwork />
      <strong className={s.price}>{price}</strong>
    </button>
  );
}
