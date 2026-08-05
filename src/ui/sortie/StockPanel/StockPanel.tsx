import { useState } from "react";
import { getItemDef, SORTIE_STOCK_FIRST_ROW } from "@/data";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { itemIcon } from "@/ui/art/itemArt";
import { cx } from "@/ui/common/cx";
import s from "./StockPanel.module.css";

interface Props {
  itemIds: readonly string[];
  /** 调用方的布局类(占哪块格、第几个入场)。面板自身的外观一律由本组件持有。 */
  className?: string;
}

export function StockPanel({ itemIds, className }: Props) {
  const loot = useTownStore((state) => state.loot);
  const backpack = useSortieStore((state) => state.backpack);
  const buy = useSortieStore((state) => state.buy);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1500);
  };

  return (
    <section className={cx(s.panel, className)} aria-labelledby="sortie-stock-title">
      <header className={s.header}>
        <div>
          <span className={s.kicker}>SUPPLY BAY / UNLIMITED STOCK</span>
          <h2 id="sortie-stock-title" className={s.title}>货柜</h2>
        </div>
        <span className={s.notice} role="status">
          {notice}
        </span>
      </header>
      <div className={s.shelf}>
        {itemIds.map((itemId, index) => {
          const def = getItemDef(itemId);
          const price = def.buyValue ?? 0;
          const affordable = loot >= price;
          // 摆位是数据的一部分(食品一行、消耗品一行), 换行位置读 data/sortieStock.ts 的常量:
          // 第二行的头一件起在第 2 列, 于是 4 件相对第一行的 6 件居中。
          return (
            <div className={cx(s.item, index === SORTIE_STOCK_FIRST_ROW && s.rowBreak)} key={itemId}>
              <button
                className={cx(s.itemTile, s[`rarity-${def.rarity}`], !affordable && s.tileDisabled)}
                type="button"
                title={`${def.name} · ${price} 积分`}
                onClick={() => {
                  if (!affordable) {
                    showNotice("积分不足");
                    return;
                  }
                  if (!buy(itemId)) showNotice("背包已满");
                }}
              >
                <span className={s.icon}>{itemIcon(def)}</span>
                <strong>{def.name}</strong>
              </button>
              <span className={cx(s.price, !affordable && s.priceDisabled)}>
                {price} · {affordable ? "买入" : "积分不足"}
              </span>
            </div>
          );
        })}
      </div>
      <p className={s.foot}>常驻货品 · 不限量 · 普通消耗品每件 20 积分</p>
      <span className={s.capacityHint} aria-hidden>
        已装 {backpack.length} 堆
      </span>
    </section>
  );
}
