// 统一商店左栏: 说明条 + 四列混合货架，不再按角色筛选。

import type { ShopSlot } from "@/data/shop";
import { MarketSlot } from "./MarketSlot";
import s from "./MarketShelf.module.css";

interface Props {
  slots: ShopSlot[];
  loot: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function MarketShelf({ slots, loot, selectedKey, onSelect }: Props) {
  return (
    <section className={s.shelf}>
      <div className={s.notice}>
        <strong>居民积分采购物资</strong>
        <span>货架随机陈列卡牌、装备、材料与祝福遗物，选中货位后在右侧查看详情并购买。</span>
      </div>

      <div className={s.grid} aria-label="统一商店货架">
        {slots.length ? slots.map((slot) => (
          <MarketSlot
            key={slot.key}
            slot={slot}
            loot={loot}
            selected={selectedKey === slot.key}
            onSelect={onSelect}
          />
        )) : <p className={s.empty}>今天没有进货。</p>}
      </div>
    </section>
  );
}
