// 商品与等待补货共用同一个外壳，统一布局盒、可见边框和原型比例。

import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { MarketFrameArtwork } from "./MarketFrameArtwork";
import s from "./MarketSlotFrame.module.css";

interface Props {
  selected: boolean;
  sold: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MarketSlotFrame({ selected, sold, children, className, style }: Props) {
  return (
    <div
      className={cx(s.slot, className, sold && s["is-sold"])}
      style={style}
      data-market-selected={selected ? "" : undefined}
      data-market-sold={sold ? "" : undefined}
    >
      <div className={s.inner}>
        {children}
        {sold && <span className={s.sold}>已售出</span>}
      </div>
      <MarketFrameArtwork selected={selected} />
    </div>
  );
}
