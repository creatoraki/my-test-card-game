// 商店货架通用立牌外壳。卡牌与物品只负责提供立牌内部内容。
// 外框与售罄蒙层归 MarketSlotFrame，这里只保留"点一下选中"的按钮语义。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./MarketTile.module.css";

interface Props {
  selected: boolean;
  sold: boolean;
  ariaLabel: string;
  rarityClass?: string;
  onSelect: () => void;
  children: ReactNode;
}

export function MarketTile({
  selected,
  sold,
  ariaLabel,
  rarityClass,
  onSelect,
  children,
}: Props) {
  return (
    <div
      className={cx(s.tile, rarityClass, sold && s["is-sold"])}
      data-market-tile
      data-sold={sold ? "" : undefined}
    >
      <button
        className={s.button}
        type="button"
        disabled={sold}
        aria-label={ariaLabel}
        aria-pressed={selected}
        onClick={onSelect}
      >
        {children}
      </button>
    </div>
  );
}
