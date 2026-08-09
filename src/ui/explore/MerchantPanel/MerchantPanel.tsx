import { useState } from "react";
import { getItemDef, getTradeService } from "@/data";
import { tradeQuote } from "@/explore/shop";
import type { ExploreState, ShopState } from "@/explore/types";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
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
  const [selected, setSelected] = useState<{ slotIndex: number; stockIndex: number } | null>(null);
  const buy = (slotIndex: number, stockIndex?: number) => {
    const result = onBuy(slotIndex, stockIndex);
    if (!result) {
      const quote = tradeQuote(session, slotIndex, stockIndex);
      setMessage(quote.reason ?? "当前无法完成交易。");
      return;
    }
    setSelected(null);
    setMessage("交易已完成，终端已锁定该服务槽位。");
  };

  return (
    <div className={s.panel}>
      <div className={s.head}>
        <span className={s.kicker}>MERCHANT TERMINAL / {shop.trades}/{shop.slots.length}</span>
        <span className={s.counter}>每个服务限购 1 次</span>
      </div>
      <div className={s.slots}>
        {shop.slots.map((slot, slotIndex) => {
          const service = getTradeService(slot.serviceId);
          const currency = getItemDef(service.currencyItemId);
          const selectedStockIndex = selected?.slotIndex === slotIndex ? selected.stockIndex : undefined;
          const selectedStock =
            selectedStockIndex == null ? null : slot.stock[selectedStockIndex] ?? null;
          const quote =
            slot.sold || (service.kind === "goods" && selectedStockIndex == null)
              ? null
              : tradeQuote(session, slotIndex, selectedStockIndex);
          return (
            <section className={cx(s.slot, slot.sold && s.sold)} key={slot.serviceId}>
              <div className={s.slotHead}>
                <div>
                  <h4>{service.name}</h4>
                  <p>{service.desc}</p>
                </div>
                <span className={s.price}>
                  {currency.name} ×{service.price}
                </span>
              </div>
              {service.kind === "goods" ? (
                <div className={s.stock}>
                  {slot.stock.map((stock, stockIndex) => (
                    <div
                      className={s.stockChoice}
                      key={stock.uid}
                    >
                      <ItemSlot
                        stack={stock}
                        showName
                        selected={selectedStockIndex === stockIndex}
                        disabled={slot.sold}
                        onClick={() => setSelected({ slotIndex, stockIndex })}
                      />
                      <span>{slot.sold ? "已成交" : selectedStockIndex === stockIndex ? "已选货位" : "选择货位"}</span>
                    </div>
                  ))}
                  {!slot.stock.length && <span className={s.empty}>本地区暂无可用货位。</span>}
                  {selectedStock && (
                    <ItemDetail stack={selectedStock} className={s.detail}>
                      <button
                        className={s.serviceButton}
                        type="button"
                        disabled={!quote?.ok}
                        title={quote?.reason}
                        onClick={() => buy(slotIndex, selectedStockIndex)}
                      >
                        {quote?.ok ? `确认支付 ${currency.name} ×${service.price}` : quote?.reason ?? "无法交易"}
                      </button>
                    </ItemDetail>
                  )}
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
                  <button
                    className={s.serviceButton}
                    type="button"
                    disabled={slot.sold || !quote?.ok}
                    title={slot.sold ? "该服务已成交" : quote?.reason}
                    onClick={() => buy(slotIndex)}
                  >
                    {slot.sold ? "已成交" : "随机获得 1 个协议"}
                  </button>
                </div>
              ) : (
                <button
                  className={s.serviceButton}
                  type="button"
                  disabled={slot.sold || !quote?.ok}
                  title={slot.sold ? "该服务已成交" : quote?.reason}
                  onClick={() => buy(slotIndex)}
                >
                  {slot.sold ? "已成交" : "执行服务"}
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className={s.message} aria-live="polite">
        {message || "食品仅在确认交易时扣除，跳过不会退款。"}
      </p>
      <div className={s.foot}>
        <span>已成交 {shop.trades} / {shop.slots.length}</span>
        <button className={s.closeButton} type="button" disabled={!canClose} onClick={onClose}>
          关闭终端
        </button>
      </div>
    </div>
  );
}
