// 顶部服务槽位页签 —— 一个节点最多两个槽位, 各占一半宽。
//
// ★ 报价整块交给 ItemCostTag(1:1 图标框 + 框外文字), 这里不再自己拼图标与价格;
//   服务名与成交状态排在报价标签**旁边**的文字列里, 长名字只压缩自己那一列。

import { getTradeService } from "@/data";
import type { ExploreState, TradeSlotState } from "@/explore/types";
import { countByItemId } from "@/items/inventory";
import { cx } from "@/ui/common/cx";
import ItemCostTag from "@/ui/common/item/ItemCostTag";
import s from "./ServiceTabs.module.css";

interface Props {
  session: ExploreState;
  slots: TradeSlotState[];
  activeSlot: number;
  onPick: (slotIndex: number) => void;
}

export default function ServiceTabs({ session, slots, activeSlot, onPick }: Props) {
  return (
    <div className={s.tabs} role="tablist" aria-label="交易服务槽位">
      {slots.map((slot, slotIndex) => {
        const service = getTradeService(slot.serviceId);
        const owned = countByItemId(session.backpack, service.currencyItemId);
        const active = slotIndex === activeSlot;
        return (
          <button
            className={cx(s.tab, active && s.active, slot.sold && s.sold)}
            key={slot.serviceId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPick(slotIndex)}
          >
            <ItemCostTag
              className={s.cost}
              itemId={service.currencyItemId}
              count={service.price}
              owned={slot.sold ? undefined : owned}
              showOwned={!slot.sold}
              size="md"
            />
            <span className={s.copy}>
              <strong className={s.name}>{service.name}</strong>
              <span className={cx(s.state, slot.sold && s.done)}>
                {slot.sold ? "✓ 已成交" : "可交易"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
