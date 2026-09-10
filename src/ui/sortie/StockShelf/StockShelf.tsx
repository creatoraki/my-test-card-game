// 出击补给货架 —— 取代原先那条斜切滚动带(StockBand)。
//
// ★ 为什么改成实体货架: 货柜是**固定清单、不限量**(见 data/sortieStock.ts), 十件东西本就
//   应该一次全摆出来。滚动带一次只看得清一两件, 玩家读不出「这是一家店」。
//
// ★ 分层依据是 maxStack 而不是写死的下标: 临期食品 maxStack 5、消耗品 maxStack 1,
//   于是货柜清单里怎么排、日后加几件, 分层都自己对。
//
// 购买入口只有价格牌一处; 商品本体只负责悬浮浮卡(详情), 不吞点击。

import { useCallback, useMemo, useState } from "react";
import { getItemDef, SORTIE_STOCK_IDS } from "@/data";
import type { ItemStack } from "@/items/types";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { cx } from "@/ui/common/cx";
import { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { SortieTooltip } from "@/ui/sortie/SortieTooltip";
import ShelfRow from "./ShelfRow";
import s from "./StockShelf.module.css";

interface Props {
  active: boolean;
  entering: boolean;
  className?: string;
  /** 买成了。参数是商品 id, 留给调用方做更细的反馈。 */
  onBought: (itemId: string) => void;
  onPoor: () => void;
  onFull: () => void;
}

// 浮卡要的是 ItemStack, 货架上却只有 itemId。造一个**只用于展示**的堆 —— uid 借用 itemId,
// 与 town/shop 的 asStack() 同一手法(那边借用的是货位 key)。
const displayStack = (itemId: string): ItemStack => ({ uid: itemId, itemId, count: 1 });

export function StockShelf({ active, entering, className, onBought, onPoor, onFull }: Props) {
  const loot = useTownStore((state) => state.loot);
  const buy = useSortieStore((state) => state.buy);
  const [hovered, setHovered] = useState<{ itemId: string; point: TooltipPoint } | null>(null);

  const rows = useMemo(() => {
    const food: string[] = [];
    const gear: string[] = [];
    for (const itemId of SORTIE_STOCK_IDS) {
      (getItemDef(itemId).maxStack > 1 ? food : gear).push(itemId);
    }
    return [
      { label: "临期食品", itemIds: food },
      { label: "消耗品", itemIds: gear },
    ];
  }, []);

  const stacks = useMemo(
    () => new Map(SORTIE_STOCK_IDS.map((itemId) => [itemId, displayStack(itemId)])),
    [],
  );

  const affordableOf = useCallback(
    (itemId: string) => loot >= (getItemDef(itemId).buyValue ?? 0),
    [loot],
  );

  const handleBuy = useCallback(
    (itemId: string) => {
      if (!affordableOf(itemId)) {
        onPoor();
        return;
      }
      if (buy(itemId)) onBought(itemId);
      else onFull();
    },
    [affordableOf, buy, onBought, onFull],
  );

  const handleHover = useCallback((itemId: string, el: HTMLElement | null) => {
    setHovered((current) => {
      if (!el) return current?.itemId === itemId ? null : current;
      return { itemId, point: tooltipPointFromElement(el, "top") };
    });
  }, []);

  return (
    <section
      className={cx(s.shelf, className)}
      data-active={active}
      aria-hidden={!active}
      aria-label="补给货架"
    >
      <div className={s.rows}>
        {rows.map((row) => (
          <ShelfRow
            key={row.label}
            label={row.label}
            itemIds={row.itemIds}
            affordableOf={affordableOf}
            onBuy={handleBuy}
            onHover={handleHover}
            entering={entering}
          />
        ))}
      </div>
      {hovered && <SortieTooltip stack={stacks.get(hovered.itemId)!} point={hovered.point} />}
    </section>
  );
}

export default StockShelf;
