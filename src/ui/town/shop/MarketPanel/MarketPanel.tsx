// 据点统一商店面板: 左侧混合货架、右侧商品详情，底部统一刷新与设施升级。

import { useEffect, useState } from "react";
import { shopLevelOf, shopRefreshCost } from "@/data";
import { useTownStore } from "@/store/townStore";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { MarketActionButton } from "./MarketActionButton";
import { MarketDetail } from "./MarketDetail";
import { MarketShelf } from "./MarketShelf";
import s from "./MarketPanel.module.css";

const SHELF_LEAVE_MS = 415;
const SHELF_ENTER_MS = 525;

export function MarketPanel({ onUpgrade }: { onUpgrade: () => void }) {
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const shop = useTownStore((state) => state.shop);
  const refreshShop = useTownStore((state) => state.refreshShop);
  const buyShopSlot = useTownStore((state) => state.buyShopSlot);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { value: shownSlots, phase } = useSwapTransition(
    shop.slots,
    `${shop.day}:${shop.refreshes}`,
    SHELF_LEAVE_MS,
    SHELF_ENTER_MS,
  );

  useEffect(() => {
    setSelectedKey(null);
  }, [shop.day, shop.refreshes]);

  const level = shopLevelOf(shop.techs);
  const refreshCost = shopRefreshCost(shop.techs, shop.refreshes);
  const selectedSlot = shownSlots.find((slot) => slot.key === selectedKey)
    ?? shownSlots.find((slot) => !slot.sold) ?? shownSlots[0] ?? null;
  const availableCount = shownSlots.filter((slot) => !slot.sold).length;
  const note = availableCount
    ? `剩余 ${availableCount} 件商品 ｜ 购买后该货位今日不再补货。`
    : "今日货架已售罄，可以刷新货架寻找新货。";

  return (
    <div className={s.panel}>
      <div className={s.body}>
        <MarketShelf
          slots={shownSlots}
          phase={phase}
          characters={characters}
          loot={loot}
          selectedKey={selectedSlot?.key ?? null}
          onSelect={setSelectedKey}
          onBuy={buyShopSlot}
        />
        <MarketDetail
          slot={selectedSlot}
        />
      </div>

      <div className={s.foot}>
        <div className={s.summary}>
          <strong>当前货架信息</strong>
          <span className={s.note}>{note}</span>
        </div>
        <div className={s.actions}>
          <MarketActionButton
            tone="gold"
            icon="⟳"
            label="刷新货架"
            meta={`${refreshCost} 积分`}
            disabled={loot < refreshCost}
            onClick={refreshShop}
          />
          <MarketActionButton
            tone="cyan"
            icon="⇧"
            label="设施升级"
            meta={`等级 ${level}`}
            onClick={onUpgrade}
          />
        </div>
      </div>
    </div>
  );
}
