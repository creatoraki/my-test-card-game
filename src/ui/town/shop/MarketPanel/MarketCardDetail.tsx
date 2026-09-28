// 货架卡牌详情：按货位组装卡牌，展示统一交给 ShopCardDetail。购买按钮由 MarketDetail 承载。

import { useMemo } from "react";
import { makeCard } from "@/data";
import type { ShopCardSlot } from "@/data/shop/shop";
import { ShopCardDetail } from "@/ui/town/shop/ShopCardDetail";

export function MarketCardDetail({ slot }: { slot: ShopCardSlot }) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );

  return <ShopCardDetail card={card} animKey={slot.key} />;
}
