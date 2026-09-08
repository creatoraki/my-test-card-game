// 货架的一层 = 层标签 + 若干货位 + 一块实体层板。
//
// ★ 层板画在这一层而不是外壳里: 层数与分组由数据(商品是否可堆叠)决定, 外壳不该知道有几块板。

import { memo } from "react";
import { cx } from "@/ui/common/cx";
import StockSlot from "./StockSlot";
import s from "./ShelfRow.module.css";

interface Props {
  label: string;
  itemIds: readonly string[];
  /** 判断某件商品此刻买不买得起。价格从物品定义读, 余额由外壳传。 */
  affordableOf: (itemId: string) => boolean;
  onBuy: (itemId: string) => void;
  onHover: (itemId: string, el: HTMLElement | null) => void;
  entering: boolean;
}

function ShelfRow({ label, itemIds, affordableOf, onBuy, onHover, entering }: Props) {
  return (
    <div className={s.row}>
      <div className={cx(s.goodsLine, entering && s.goodsLineEnter)}>
        {itemIds.map((itemId) => (
          <StockSlot
            key={itemId}
            itemId={itemId}
            affordable={affordableOf(itemId)}
            onBuy={onBuy}
            onHover={onHover}
          />
        ))}
      </div>
      <div className={s.board} aria-hidden>
        <span className={s.boardLabel}>{label}</span>
      </div>
    </div>
  );
}

export default memo(ShelfRow);
