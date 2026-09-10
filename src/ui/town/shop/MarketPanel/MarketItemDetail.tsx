// 物品详情内容：复用纯展示的 ShopItemCard，不在此处添加任何购买控件。

import type { ShopItemSlot } from "@/data/shop";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import { asStack } from "./marketStacks";
import s from "./MarketDetail.module.css";

export function MarketItemDetail({ slot }: { slot: ShopItemSlot }) {
  return (
    <div className={s.itemContent}>
      <ShopItemCard stack={asStack(slot)} placeholder="选择一件商品查看详情。" />
      <p className={s.itemPrice}>售价 {slot.price} 居民积分</p>
    </div>
  );
}
