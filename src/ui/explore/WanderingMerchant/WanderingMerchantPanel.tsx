import { useEffect, useState } from "react";
import { getCharacter, getCardDef, getItemDef, makeCard } from "@/data";
import type { ExploreState } from "@/explore/types";
import { canBuyMerchantSlot, merchantShelf } from "@/explore/curio/merchant";
import { closeCorridorObject } from "@/store/exploreCorridor";
import { useRunStore } from "@/store/runStore";
import { useExploreStore } from "@/store/exploreStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import { MerchantShelfSlot } from "./MerchantShelfSlot";
import s from "./WanderingMerchantPanel.module.css";

export function WanderingMerchantPanel({ session }: { session: ExploreState }) {
  const [selected, setSelected] = useState(0);
  const openShelf = useRunStore((state) => state.openMerchantShelf);
  const buy = useRunStore((state) => state.buyMerchantSlot);
  const shelf = merchantShelf(session);

  useEffect(() => {
    if (session.phase === "landed") openShelf();
  }, [openShelf, session.phase, session.corridor?.activeObjectId]);

  const slot = shelf?.slots[selected] ?? null;
  const priceName = slot ? getItemDef(slot.price.itemId).name : "食品";
  const productName = slot
    ? slot.kind === "card" ? getCardDef(slot.cardDefId).name : getItemDef(slot.stack.itemId).name
    : "货架准备中";
  const canBuy = Boolean(slot && canBuyMerchantSlot(session, selected));

  return <div className={s.backdrop}>
    <section className={s.panel} role="dialog" aria-modal="true" aria-labelledby="merchant-heading">
      <header className={s.header}>
        <div><div className={s.eyebrow}>流浪货商 · 六格货架</div><h2 id="merchant-heading">今天的货物</h2></div>
        <button type="button" className={s.close} onClick={closeCorridorObject}>离开货架</button>
      </header>
      <div className={s.body}>
        <div className={s.shelf}>{shelf?.slots.map((item, index) => <MerchantShelfSlot key={index} slot={item} selected={index === selected} onClick={() => setSelected(index)} />) ?? <p className={s.loading}>货商正在整理货物……</p>}</div>
        <aside className={s.detail}>
          <div className={s.detailKicker}>商品详情</div>
          <h3>{productName}</h3>
          {slot?.kind === "card" && <>
            <p className={s.owner}>绑定队员：{getCharacter(slot.charId).name}</p>
            <div className={s.cardPreview}><span>{makeCard(slot.cardDefId).name}</span></div>
          </>}
          {slot?.kind === "item" && <ItemDetail stack={slot.stack} />}
          <div className={s.price}>价格：{priceName} ×{slot?.price.count ?? 0}</div>
          <button type="button" className={s.buy} disabled={!slot || slot.sold || !canBuy} onClick={() => buy(selected)}>
            {slot?.sold ? "已售出" : canBuy ? "购买" : `缺少${priceName}`}
          </button>
        </aside>
      </div>
      <footer className={s.footer}>货商不会补货；买空的格子会一直保持空置。打开和购买不消耗净化粒子。</footer>
    </section>
  </div>;
}
