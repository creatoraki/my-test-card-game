import type { ItemStack } from "@/items/types";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import { ShopDetailAside } from "@/ui/town/shop/ShopDetailAside";

export function WarehouseDetail({ stack }: { stack: ItemStack | null }) {
  return (
    <ShopDetailAside heading="物品详情" empty="选择仓库中的物品查看详情">
      {stack && <ShopItemCard stack={stack} />}
    </ShopDetailAside>
  );
}
