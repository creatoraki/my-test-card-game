// 货位下方的纯展示售价牌。它不是按钮，也不承担任何点击或聚焦行为。

import { cx } from "@/ui/common/cx";
import s from "./MarketPriceTag.module.css";

interface Props {
  price: number;
  affordable: boolean;
  sold: boolean;
}

export function MarketPriceTag({ price, affordable, sold }: Props) {
  const state = sold ? "sold" : affordable ? "ready" : "poor";
  return (
    <span
      className={cx(s.tag, s[`is-${state}`])}
      aria-label={sold ? "已售出" : affordable ? `售价 ${price} 居民积分` : `售价 ${price}，积分不足`}
    >
      {sold ? <span className={s.sold}>已售出</span> : <strong>{price}</strong>}
    </span>
  );
}
