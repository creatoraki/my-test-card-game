// 商店货架通用立牌外壳。卡牌与物品只负责提供立牌内部内容。

import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
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
      className={cx(s.tile, rarityClass, selected && s["is-selected"], sold && s["is-sold"])}
      data-interactive-hint
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
      <InteractiveHint className={s.hint} active={selected && !sold} />
      {sold && <span className={s.soldMask}>已售出</span>}
    </div>
  );
}
