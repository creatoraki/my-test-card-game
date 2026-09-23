// 货架立牌上的类别标签。四角斜切需要两层上色, 故单独成件供卡牌/物品立牌共用。

import type { ReactNode } from "react";
import type { ItemCategory } from "@/items/types";
import s from "./MarketChip.module.css";

export type MarketCategory = ItemCategory | "card";

export function MarketChip({ children, category }: { children: ReactNode; category: MarketCategory }) {
  return <span className={s.chip} data-category={category}><span className={s.face}>{children}</span></span>;
}
