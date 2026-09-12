// 统一商店详情栏：根据货位类型路由纯展示内容，购买入口位于货架价格牌。

import type { ShopSlot } from "@/data/shop";
import { useTownStore } from "@/store/townStore";
import { MarketCardDetail } from "./MarketCardDetail";
import { MarketItemDetail } from "./MarketItemDetail";
import s from "./MarketDetail.module.css";

interface Props {
  slot: ShopSlot | null;
}

export function MarketDetail({ slot }: Props) {
  const owned = useTownStore((state) => slot?.kind === "item"
    ? state.storage.reduce((sum, stack) => sum + (stack.itemId === slot.itemId ? stack.count : 0), 0)
    : null);
  if (!slot) {
    return (
      <aside className={s.detail}>
        <h3 className={s.heading}>物品详情</h3>
        <p className={s.empty}>选择货架上的商品查看详情</p>
      </aside>
    );
  }

  return (
    <aside className={s.detail}>
      <h3 className={s.heading}>物品详情{owned !== null && <span className={s.owned}>库存 <b>{owned}</b></span>}</h3>
      <div className={s.content}>
        {slot.kind === "card" ? <MarketCardDetail slot={slot} /> : <MarketItemDetail slot={slot} />}
      </div>
    </aside>
  );
}
