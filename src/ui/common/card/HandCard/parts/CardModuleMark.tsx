import type { Card } from "@/engine";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/items/itemArt";
import s from "./CardModuleMark.module.css";

// 卡面右上角的「已装模组」标识。直接复用物品图标派发，优先使用已登记的模组美术。
export function CardModuleMark({ card }: { card: Card }) {
  if (!card.cardModule) return null;
  const def = getItemDef(card.cardModule.itemId);
  return (
    <span className={s.mark} aria-label={`已装配${def.name}`}>
      {itemIcon(def)}
    </span>
  );
}
