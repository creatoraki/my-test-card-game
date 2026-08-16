import { useState } from "react";
import { getItemDef, getTradeService } from "@/data";
import { tradeQuote } from "@/explore/shop";
import { countByItemId } from "@/items/inventory";
import type { ExploreState, ShopState } from "@/explore/types";
import { itemIcon } from "@/ui/art/itemArt";
import { EventPanelBody, EventPanelButton, EventPanelFoot, EventPanelStage } from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import { RailPopover } from "@/ui/common/RailPopover";
import ItemCostTag from "@/ui/common/item/ItemCostTag";
import ItemDetail from "@/ui/common/item/ItemDetail";
import s from "./MerchantPanel.module.css";

interface Props {
  session: ExploreState;
  shop: ShopState;
  onBuy: (slotIndex: number, stockIndex?: number) => boolean;
  canClose: boolean;
  onClose: () => void;
}

export default function MerchantPanel({ session, shop, onBuy, canClose, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [activeSlot, setActiveSlot] = useState(0);
  const [selected, setSelected] = useState<{ slotIndex: number; stockIndex: number } | null>(null);
  const slot = shop.slots[activeSlot];
  const service = slot ? getTradeService(slot.serviceId) : null;
  const selectedStockIndex = selected?.slotIndex === activeSlot ? selected.stockIndex : undefined;
  const selectedStock = selectedStockIndex == null ? null : slot?.stock[selectedStockIndex] ?? null;
  const quote = slot && service && !slot.sold ? tradeQuote(session, activeSlot, selectedStockIndex) : null;
  const owned = service ? countByItemId(session.backpack, service.currencyItemId) : 0;
  const reason = slot?.sold ? "该服务已成交，本次抵达不再补货。" : quote?.reason;

  const buy = (stockIndex?: number) => {
    if (!service) return;
    const slotIndex = activeSlot;
    const result = onBuy(slotIndex, stockIndex);
    if (!result) {
      const quote = tradeQuote(session, slotIndex, stockIndex);
      setMessage(quote.reason ?? "当前无法完成交易。");
      return;
    }
    setSelected(null);
    setMessage("交易已完成，终端已锁定该服务槽位。");
  };

  if (!slot || !service) return null;

  return (
    <EventPanelStage>
      <div className={s.head}>
        <div className={s.tabs} role="tablist" aria-label="交易服务">
          {shop.slots.map((tabSlot, slotIndex) => {
            const tabService = getTradeService(tabSlot.serviceId);
            const tabOwned = countByItemId(session.backpack, tabService.currencyItemId);
            return (
              <button
                className={cx(s.tab, slotIndex === activeSlot && s.active, tabSlot.sold && s.sold)}
                key={tabSlot.serviceId}
                type="button"
                role="tab"
                aria-selected={slotIndex === activeSlot}
                onClick={() => {
                  setActiveSlot(slotIndex);
                  setMessage("");
                }}
              >
                <ItemCostTag
                  itemId={tabService.currencyItemId}
                  count={tabService.price}
                  owned={tabOwned}
                  size="sm"
                  showOwned
                />
                <span className={s.tabCopy}>
                  <strong>{tabService.name}</strong>
                  <small>{tabSlot.sold ? "已成交" : `服务 ${slotIndex + 1}`}</small>
                </span>
                {tabSlot.sold && <span className={s.check} aria-label="已成交">✓</span>}
              </button>
            );
          })}
        </div>
        <div className={s.counter}>
          <span>已成交 {shop.trades} / {shop.slots.length}</span>
          <span>每个服务限购 1 次</span>
        </div>
      </div>

      <EventPanelBody className={s.body}>
        <section className={s.service} aria-label={service.name}>
          <div className={s.serviceHead}>
            <div>
              <span className={s.kicker}>SERVICE {String(activeSlot + 1).padStart(2, "0")}</span>
              <h2>{service.name}</h2>
              <p>{service.desc}</p>
            </div>
            <ItemCostTag itemId={service.currencyItemId} count={service.price} owned={owned} showOwned />
          </div>

          {service.kind === "goods" ? (
            <div className={s.goodsView}>
              <div className={s.stock}>
                {slot.stock.map((stock, stockIndex) => {
                  const def = getItemDef(stock.itemId);
                  return (
                    <button
                      className={cx(s.tile, s[`r-${def.rarity}`], selectedStockIndex === stockIndex && s.selected)}
                      key={stock.uid}
                      type="button"
                      disabled={slot.sold}
                      aria-label={`选择 ${def.name}`}
                      onClick={() => setSelected({ slotIndex: activeSlot, stockIndex })}
                    >
                      <span className={s.tileIcon}>{itemIcon(def)}</span>
                      <span className={s.tileName}>{def.name}</span>
                    </button>
                  );
                })}
                {!slot.stock.length && <span className={s.empty}>本地区暂无可用货位。</span>}
              </div>
              <ItemDetail stack={selectedStock} className={s.detail} placeholder="选择货位查看物品详情。" />
            </div>
          ) : service.kind === "random" ? (
            <div className={s.buffList}>
              {slot.buffOptions?.map((option) => (
                <div className={s.buff} key={option.aura.id}>
                  <strong>{option.aura.name}</strong>
                  <span>{option.weight}%</span>
                  <small>{option.aura.desc}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className={s.serviceCard}>
              <span className={s.serviceGlyph} aria-hidden="true">◇</span>
              <div>
                <strong>{service.kind === "pending" ? "待办结算服务" : "队伍服务"}</strong>
                <p>{service.desc}</p>
                <small>确认支付后立即加入远征结算流程。</small>
              </div>
            </div>
          )}
        </section>
      </EventPanelBody>

      <EventPanelFoot
        note={
          <span className={s.footNote} aria-live="polite">
            <ItemCostTag itemId={service.currencyItemId} count={service.price} owned={owned} showOwned />
            <span>{message || (slot.sold ? "该服务已成交。" : quote?.reason || "食品仅在确认交易时扣除，跳过不会退款。")}</span>
          </span>
        }
      >
        <span className={s.actionHint} data-rail-item>
          <EventPanelButton
            tone="primary"
            disabled={slot.sold || !quote?.ok}
            onClick={() => buy(selectedStockIndex)}
          >
            {slot.sold ? "已成交" : "确认支付"}
            {!slot.sold && <ItemCostTag itemId={service.currencyItemId} count={service.price} size="sm" />}
          </EventPanelButton>
          {reason && <RailPopover side="top-right">{reason}</RailPopover>}
        </span>
        <EventPanelButton disabled={!canClose} onClick={onClose}>关闭终端</EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}
