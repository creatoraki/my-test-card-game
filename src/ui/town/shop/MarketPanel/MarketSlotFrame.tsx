// 货架货位外壳：按原型尺寸排版，边框直接取自参考图，售罄蒙层独立覆盖。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { MarketFrameArtwork } from "./MarketFrameArtwork";
import s from "./MarketSlotFrame.module.css";

interface Props {
  selected: boolean;
  sold: boolean;
  children: ReactNode;
}

export function MarketSlotFrame({ selected, sold, children }: Props) {
  return (
    <div
      className={cx(s.slot, sold && s["is-sold"])}
      data-market-selected={selected ? "" : undefined}
      data-market-sold={sold ? "" : undefined}
    >
      <div className={s.inner}>
        {children}
        {sold && <span className={s.sold}>已售出</span>}
      </div>
      <MarketFrameArtwork />
    </div>
  );
}
