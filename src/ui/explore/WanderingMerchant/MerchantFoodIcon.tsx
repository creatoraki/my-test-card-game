import type { CSSProperties } from "react";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/items/itemArt";
import s from "./MerchantFoodIcon.module.css";

export function MerchantFoodIcon({ itemId, size = 34 }: { itemId: string; size?: number }) {
  return (
    <span className={s.icon} style={{ "--food-icon-size": `${size}px` } as CSSProperties} aria-hidden="true">
      {itemIcon(getItemDef(itemId))}
    </span>
  );
}
