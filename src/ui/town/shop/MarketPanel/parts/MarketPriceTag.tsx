// 货位底部的价格行：据点商店可作为购买入口，货商复用时切为食品价格展示态。

import { cx } from "@/ui/common/shared/cx";
import type { ReactNode } from "react";
import { MarketPriceArtwork } from "./MarketPriceArtwork";
import s from "./MarketPriceTag.module.css";

interface Props {
  price: number;
  sold: boolean;
  disabledReason?: string;
  icon?: ReactNode;
  ariaText?: string;
  onBuy?: () => void;
}

export function MarketPriceTag({ price, sold, disabledReason, icon, ariaText, onBuy }: Props) {
  const canBuy = !sold && !disabledReason;
  const state = sold ? "sold" : canBuy ? "ready" : "poor";
  const label = ariaText ?? `${price} 居民积分`;
  const ariaLabel = sold ? "已售出" : canBuy ? label : disabledReason;
  const content = <>
    {icon !== undefined ? <span className={s.icon} aria-hidden="true">{icon}</span> : <MarketPriceArtwork />}
    <strong className={s.price}>{price}</strong>
  </>;

  if (!onBuy) {
    return <span className={cx(s.tag, s[`is-${state}`])} role="img" aria-label={ariaLabel}>{content}</span>;
  }

  return (
    <button
      className={cx(s.tag, s[`is-${state}`])}
      type="button"
      disabled={!canBuy}
      aria-label={ariaLabel}
      onClick={onBuy}
    >{content}</button>
  );
}
