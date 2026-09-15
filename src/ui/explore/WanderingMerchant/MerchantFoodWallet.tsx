import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import { countByItemId } from "@/items/inventory";
import { MerchantFoodIcon } from "./MerchantFoodIcon";
import s from "./MerchantFoodWallet.module.css";

export function MerchantFoodWallet({ foods, backpack }: { foods: [string, string]; backpack: ItemStack[] }) {
  return (
    <div className={s.wallet} aria-label="货商接受的临期食品">
      {foods.map((itemId) => (
        <div className={s.food} key={itemId} aria-label={`${getItemDef(itemId).name}，持有 ${countByItemId(backpack, itemId)}`}>
          <MerchantFoodIcon itemId={itemId} />
          <span className={s.name}>{getItemDef(itemId).name}</span>
          <strong className={s.count}>{countByItemId(backpack, itemId)}</strong>
        </div>
      ))}
    </div>
  );
}
