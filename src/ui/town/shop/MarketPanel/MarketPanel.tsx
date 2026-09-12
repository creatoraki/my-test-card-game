// 据点统一商店面板: 左侧混合货架、右侧商品详情，底部统一刷新与设施升级。

import { useEffect, useState, type MouseEvent } from "react";
import { shopLevelOf, shopRefreshCost } from "@/data";
import { useTownStore } from "@/store/townStore";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { designScaleOf, stageHostOf } from "@/ui/hooks/stage";
import { MarketActionButton } from "./MarketActionButton";
import { MarketDetail } from "./MarketDetail";
import { MarketShelf } from "./MarketShelf";
import { MarketUpgradePanel } from "./MarketUpgradePanel";
import s from "./MarketPanel.module.css";

type UpgradeState = { x: number; y: number; host: HTMLElement; closing: boolean };

const SHELF_LEAVE_MS = 415;
const SHELF_ENTER_MS = 525;

export function MarketPanel() {
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const shop = useTownStore((state) => state.shop);
  const refreshShop = useTownStore((state) => state.refreshShop);
  const buyShopSlot = useTownStore((state) => state.buyShopSlot);
  const upgradeShop = useTownStore((state) => state.upgradeShop);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeState | null>(null);
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

  const openUpgrade = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const host = stageHostOf(button);
    const hostRect = host.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const scale = designScaleOf(host);
    setUpgrade({
      x: (rect.left + rect.width / 2 - hostRect.left) / scale,
      y: (rect.top + rect.height / 2 - hostRect.top) / scale,
      host,
      closing: false,
    });
  };

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
            onClick={openUpgrade}
          />
        </div>
      </div>

      {upgrade && (
        <MarketUpgradePanel
          level={level}
          credits={loot}
          host={upgrade.host}
          doneTechs={shop.techs}
          storage={storage}
          origin={{ x: upgrade.x, y: upgrade.y }}
          closing={upgrade.closing}
          onResearch={upgradeShop}
          onClose={() => setUpgrade((current) => current ? { ...current, closing: true } : current)}
          onClosed={() => setUpgrade(null)}
        />
      )}
    </div>
  );
}
