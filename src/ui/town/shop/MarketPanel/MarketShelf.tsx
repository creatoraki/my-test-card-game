// 统一商店左栏：三列大尺寸混合货架，补货占位复用商品外壳。

import type { CSSProperties } from "react";
import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import type { SwapPhase } from "@/ui/hooks/useSwapTransition";
import { MarketSlot } from "./MarketSlot";
import { MarketSlotFrame } from "./MarketSlotFrame";
import s from "./MarketShelf.module.css";

interface Props {
  slots: ShopSlot[];
  phase: SwapPhase;
  characters: Record<string, CharacterState>;
  loot: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onBuy: (key: string) => void;
}

export function MarketShelf({
  slots,
  phase,
  characters,
  loot,
  selectedKey,
  onSelect,
  onBuy,
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
            characters={characters}
            loot={loot}
            selected={selectedKey === slot.key}
            onSelect={onSelect}
            onBuy={onBuy}
          />
        )) : <p className={s.empty}>今天没有进货。</p>}
        {Array.from({ length: Math.max(0, 8 - slots.length) }, (_, index) => (
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
