// 统一商店左栏: 说明条 + 四列混合货架，不再按角色筛选。

import type { ShopSlot } from "@/data/shop";
import type { CharacterState } from "@/store/townStore";
import { MarketSlot } from "./MarketSlot";
import s from "./MarketShelf.module.css";

interface Props {
  slots: ShopSlot[];
  characters: Record<string, CharacterState>;
  loot: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onBuy: (key: string) => void;
}

export function MarketShelf({
  slots,
  characters,
  loot,
  selectedKey,
  onSelect,
  onBuy,
}: Props) {
  return (
    <section className={s.shelf}>
      <div className={s.notice}>
        <strong>商品列表</strong>
        <span>选中商品查看详情，点击价格牌即可购买。</span>
      </div>

      <div className={s.grid} aria-label="统一商店货架">
        {slots.length ? slots.map((slot) => (
          <MarketSlot
            key={slot.key}
            slot={slot}
            characters={characters}
            loot={loot}
            selected={selectedKey === slot.key}
            onSelect={onSelect}
            onBuy={onBuy}
          />
        )) : <p className={s.empty}>今天没有进货。</p>}
        {Array.from({ length: Math.max(0, 8 - slots.length) }, (_, index) => (
          <div className={s.vacant} key={`vacant-${index}`}>
            <span aria-hidden="true">＋</span><strong>等待补货</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
