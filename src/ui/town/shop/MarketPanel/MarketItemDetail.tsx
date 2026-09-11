// 物品详情内容：复用纯展示的 ShopItemCard，不在此处添加任何购买控件。

import type { ShopItemSlot } from "@/data/shop";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import { asStack } from "./marketStacks";

export function MarketItemDetail({ slot }: { slot: ShopItemSlot }) {
  return <ShopItemCard stack={asStack(slot)} placeholder="选择一件商品查看详情。" />;
}
