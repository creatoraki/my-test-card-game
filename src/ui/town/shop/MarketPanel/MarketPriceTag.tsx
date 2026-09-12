// 货位下方的购买价格牌。商品立牌负责查看，价格牌负责付款。

import { cx } from "@/ui/common/cx";
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
      {sold ? <span className={s.sold}>已售出</span> : <><span className={s.coin} aria-hidden="true">◈</span><strong>{price}</strong></>}
    </button>
  );
}
