import { useMemo, useState } from "react";
import { getItemDef } from "@/data";
import type { MerchantShelf } from "@/data/curios/types";
import { merchantCouponActive } from "@/explore/relics/relicModifiers";
import type { ExploreState } from "@/explore/types";
import { useRunStore } from "@/store/run/runStore";
import { MarketActionButton, MarketDetail, MarketShelf } from "@/ui/town/shop/MarketPanel";
import marketStyles from "@/ui/town/shop/MarketPanel/MarketPanel.module.css";
import { MerchantFoodIcon } from "./MerchantFoodIcon";
import { merchantShopSlots } from "./merchantShopSlots";
import { useMerchantBuyReason } from "./useMerchantBuyReason";
import s from "./MerchantMarket.module.css";

export function MerchantMarket({ session, shelf }: { session: ExploreState; shelf: MerchantShelf }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const buyMerchantSlot = useRunStore((state) => state.buyMerchantSlot);
  const adapted = useMemo(() => merchantShopSlots(shelf.slots), [shelf.slots]);
  const getBuyReason = useMerchantBuyReason(session);
  // 试吃券: 下一件商品免费, 价格一律显示为免费。
  const free = merchantCouponActive(session);
  const selectedSlot = adapted.slots.find((slot) => slot.key === selectedKey)
    ?? adapted.slots.find((slot) => !slot.sold)
    ?? adapted.slots[0]
    ?? null;
  const selectedPayment = selectedSlot ? adapted.paymentByKey[selectedSlot.key] : null;
  const selectedIndex = selectedSlot ? adapted.indexByKey[selectedSlot.key] : null;
  const selectedReason = selectedSlot ? getBuyReason(selectedSlot) : "当前无法交换";
  const availableCount = adapted.slots.filter((slot) => !slot.sold).length;
  const note = selectedReason
    ?? `剩余 ${availableCount} 件商品，货商不会补货；打开与交换不消耗净化粒子。${free ? "试吃券：下一件商品免费。" : ""}`;

  return (
    <div className={marketStyles.panel}>
      <div className={marketStyles.body}>
        <MarketShelf
          slots={adapted.slots}
          phase="idle"
          minSlots={6}
          selectedKey={selectedSlot?.key ?? null}
          onSelect={setSelectedKey}
          getBuyReason={getBuyReason}
          priceIcon={(slot) => {
            const payment = adapted.paymentByKey[slot.key];
            return payment && !free ? <MerchantFoodIcon itemId={payment.itemId} size={26} /> : null;
          }}
          priceText={(slot) => {
            const payment = adapted.paymentByKey[slot.key];
            if (!payment) return "当前无法交换";
            return free ? "免费" : `${getItemDef(payment.itemId).name} ×${payment.count}`;
          }}
        />
        <MarketDetail slot={selectedSlot} />
      </div>

      <div className={marketStyles.foot}>
        <div className={marketStyles.summary}>
          <strong>当前货架信息</strong>
          <span className={marketStyles.note}>{note}</span>
        </div>
        <div className={marketStyles.actions}>
          <MarketActionButton
            tone="gold"
            icon="⇄"
            label="交换"
            meta={free ? "免费" : selectedPayment ? <span className={s.payment}><MerchantFoodIcon itemId={selectedPayment.itemId} size={26} /> ×{selectedPayment.count}</span> : "—"}
            disabled={!selectedSlot || selectedReason !== null}
            onClick={() => { if (selectedIndex !== null) buyMerchantSlot(selectedIndex); }}
          />
        </div>
      </div>
    </div>
  );
}
