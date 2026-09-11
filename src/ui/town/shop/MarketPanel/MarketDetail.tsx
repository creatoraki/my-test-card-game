// 统一商店详情栏：根据货位类型路由纯展示内容，购买入口位于货架价格牌。

import type { ShopSlot } from "@/data/shop";
import { MarketCardDetail } from "./MarketCardDetail";
import { MarketItemDetail } from "./MarketItemDetail";
import s from "./MarketDetail.module.css";

interface Props {
  slot: ShopSlot | null;
}

export function MarketDetail({ slot }: Props) {
  if (!slot) {
    return (
      <aside className={s.detail}>
        <p className={s.empty}>选择货架上的商品查看详情</p>
      </aside>
    );
  }

  return (
    <aside className={s.detail}>
      <div className={s.content}>
        {slot.kind === "card" ? <MarketCardDetail slot={slot} /> : <MarketItemDetail slot={slot} />}
      </div>
    </aside>
  );
}
