// 统一商店详情栏：根据货位类型路由纯展示内容，购买入口位于货架价格牌。

import type { ShopSlot } from "@/data/shop";
import { useTownStore } from "@/store/townStore";
import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";
import { MarketCardDetail } from "./MarketCardDetail";
import { MarketItemDetail } from "./MarketItemDetail";

interface Props {
  slot: ShopSlot | null;
}

export function MarketDetail({ slot }: Props) {
  const owned = useTownStore((state) => slot?.kind === "item"
    ? state.storage.reduce((sum, stack) => sum + (stack.itemId === slot.itemId ? stack.count : 0), 0)
    : null);
  return (
    <ShopDetailAside heading="物品详情" empty="选择货架上的商品查看详情">
      {slot && (slot.kind === "card" ? <MarketCardDetail slot={slot} /> : <MarketItemDetail slot={slot} />)}
    </ShopDetailAside>
  );
}
