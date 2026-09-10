// 交易终端内容面板 —— 只做状态与编排, 版式全部下放给三个子组件。
//
// 骨架(与据点统一商店 MarketPanel 同一族):
//   顶部服务槽位页签 → 左内容区(货位 / BUFF / 服务说明) + 右定宽详情栏 → 底部记录条与关闭。
// ★ 购买入口**只有一个**: 右详情栏底部的「确认支付」。页签与货位只负责选择, 不成交。

import { useState } from "react";
import { getTradeService } from "@/data";
import { tradeQuote } from "@/explore/shop";
import { countByItemId } from "@/items/inventory";
import type { ExploreState, ShopState } from "@/explore/types";
import { EventPanelStage } from "@/ui/common/EventPanel";
import ServiceStage from "./ServiceStage";
import ServiceTabs from "./ServiceTabs";
import TradeDetail from "./TradeDetail";
import TradeNotes from "./TradeNotes";
import s from "./MerchantPanel.module.css";

interface Props {
  session: ExploreState;
  shop: ShopState;
  onBuy: (slotIndex: number, stockIndex?: number) => boolean;
  canClose: boolean;
  onClose: () => void;
  /** 本节点已产生的结算记录, 由 ShopOverlay 下发。 */
  notes: string[];
}

export default function MerchantPanel({ session, shop, onBuy, canClose, onClose, notes }: Props) {
  const [message, setMessage] = useState("");
  const [activeSlot, setActiveSlot] = useState(0);
  const [selected, setSelected] = useState<{ slotIndex: number; stockIndex: number } | null>(null);

  const slot = shop.slots[activeSlot];
  const service = slot ? getTradeService(slot.serviceId) : null;
  // 选中只在**当前**槽位内生效: 切页签等于换一间店, 上一间的选择不该跟过来。
  const selectedStockIndex = selected?.slotIndex === activeSlot ? selected.stockIndex : undefined;
  const selectedStock = selectedStockIndex == null ? null : slot?.stock[selectedStockIndex] ?? null;
  const quote = slot && service && !slot.sold ? tradeQuote(session, activeSlot, selectedStockIndex) : null;
  const owned = service ? countByItemId(session.backpack, service.currencyItemId) : 0;
  const reason = slot?.sold ? "该服务已成交，本次抵达不再补货。" : quote?.reason;

  const buy = () => {
    if (!service) return;
    const slotIndex = activeSlot;
    if (!onBuy(slotIndex, selectedStockIndex)) {
      setMessage(tradeQuote(session, slotIndex, selectedStockIndex).reason ?? "当前无法完成交易。");
      return;
    }
    setSelected(null);
    setMessage("交易已完成，终端已锁定该服务槽位。");
  };

  if (!slot || !service) return null;

  return (
    <EventPanelStage className={s.stage}>
      <ServiceTabs
        session={session}
        slots={shop.slots}
        activeSlot={activeSlot}
        onPick={(slotIndex) => {
          setActiveSlot(slotIndex);
          setMessage("");
        }}
      />

      <div className={s.body}>
        <div className={s.main}>
          <ServiceStage
            service={service}
            slot={slot}
            selectedStockIndex={selectedStockIndex}
            onSelect={(stockIndex) => setSelected({ slotIndex: activeSlot, stockIndex })}
          />
        </div>
        <TradeDetail
          service={service}
          sold={slot.sold}
          stack={selectedStock}
          owned={owned}
          canBuy={Boolean(quote?.ok)}
          reason={reason}
          message={message}
          onBuy={buy}
        />
      </div>

      <TradeNotes notes={notes} canClose={canClose} onClose={onClose} />
    </EventPanelStage>
  );
}
