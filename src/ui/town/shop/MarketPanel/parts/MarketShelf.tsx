// 统一商店左栏：三列大尺寸混合货架，补货占位复用商品外壳。

import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import type { ShopSlot } from "@/data/shop/shop";
import type { SwapPhase } from "@/ui/hooks/useSwapTransition";
import { MarketSlot } from "./MarketSlot";
import { MarketSlotFrame } from "./MarketSlotFrame";
import s from "./MarketShelf.module.css";

interface Props {
  slots: ShopSlot[];
  phase: SwapPhase;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  getBuyReason: (slot: ShopSlot) => string | null;
  onBuy?: (key: string) => void;
  priceIcon?: (slot: ShopSlot) => ReactNode;
  priceText?: (slot: ShopSlot) => string;
  minSlots?: number;
}

export function MarketShelf({
  slots,
  phase,
  selectedKey,
  onSelect,
  getBuyReason,
  onBuy,
  priceIcon,
  priceText,
  minSlots = 8,
}: Props) {
  return (
    <section className={s.shelf}>
      <div className={s.grid} data-shelf-phase={phase} aria-label="统一商店货架">
        {slots.length ? slots.map((slot, index) => (
          <MarketSlot
            key={slot.key}
            className={s.cell}
            style={{ "--shelf-index": index } as CSSProperties}
            slot={slot}
            selected={selectedKey === slot.key}
            onSelect={onSelect}
            getBuyReason={getBuyReason}
            onBuy={onBuy}
            priceIcon={priceIcon}
            priceText={priceText}
          />
        )) : <p className={s.empty}>今天没有进货。</p>}
        {Array.from({ length: Math.max(0, minSlots - slots.length) }, (_, index) => (
          <MarketSlotFrame
            selected={false}
            sold={false}
            key={`vacant-${index}`}
            className={s.cell}
            style={{ "--shelf-index": slots.length + index } as CSSProperties}
          >
            <div className={s.vacant}>
              <span aria-hidden="true">＋</span><strong>等待补货</strong>
            </div>
          </MarketSlotFrame>
        ))}
      </div>
    </section>
  );
}
