// 物品卡底部稀有度条: 三道倾斜色条「///」+ 英文稀有度代号。
import type { ItemRarity } from "@/items/types";
import { RARITY_CODE } from "./rarityCode";
import s from "./ItemTileBand.module.css";

export function ItemTileBand({ rarity }: { rarity: ItemRarity }) {
  return (
    <span className={s.band} aria-hidden="true">
      <span className={s.stripes}>
        <i />
        <i />
        <i />
      </span>
      <span className={s.code}>{RARITY_CODE[rarity]}</span>
    </span>
  );
}
