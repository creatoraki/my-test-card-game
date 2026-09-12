// 立牌插画之下的文字区: 名称 + 单枚类别标签 + 一行说明。卡牌与物品立牌共用。

import type { ReactNode } from "react";
import { MarketChip, type MarketCategory } from "./MarketChip";
import s from "./MarketTileCopy.module.css";

interface Props {
  name: string;
  tag: string;
  category: MarketCategory;
  description: ReactNode;
}

export function MarketTileCopy({ name, tag, category, description }: Props) {
  return (
    <span className={s.copy}>
      <strong className={s.name}>{name}</strong>
      <span className={s.tags}><MarketChip category={category}>{tag}</MarketChip></span>
      <span className={s.description}>{description}</span>
    </span>
  );
}
