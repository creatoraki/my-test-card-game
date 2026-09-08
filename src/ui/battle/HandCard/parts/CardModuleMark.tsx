import type { Card } from "@/engine";
import { getItemDef } from "@/data";
import { itemIcon } from "@/ui/art/itemArt";
import s from "./CardModuleMark.module.css";

// 卡面右上角的「已装模组」标识。图形直接复用物品图标派发:
// 登记了专属徽记的走 ModuleGlyph, 未登记的落到通用 ModuleIcon。
export function CardModuleMark({ card }: { card: Card }) {
  if (!card.cardModule) return null;
  const def = getItemDef(card.cardModule.itemId);
  return (
    <span className={s.mark} aria-label={`已装配${def.name}`}>
      {itemIcon(def)}
    </span>
  );
}
