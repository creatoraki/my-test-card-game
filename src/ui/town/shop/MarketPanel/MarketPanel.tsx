// 据点统一商店面板: 左侧混合货架、右侧商品详情，底部统一刷新与设施升级。

import { useEffect, useState, type MouseEvent } from "react";
import { shopLevelOf, shopRefreshCost } from "@/data";
import { useTownStore } from "@/store/townStore";
import { MarketDetail } from "./MarketDetail";
import { MarketShelf } from "./MarketShelf";
import { MarketUpgradePanel } from "./MarketUpgradePanel";
import s from "./MarketPanel.module.css";

type UpgradeState = { x: number; y: number; closing: boolean };

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

  useEffect(() => {
    setSelectedKey(null);
  }, [shop.day, shop.refreshes]);

  const level = shopLevelOf(shop.techs);
  const refreshCost = shopRefreshCost(shop.techs, shop.refreshes);
  const selectedSlot = shop.slots.find((slot) => slot.key === selectedKey)
    ?? shop.slots.find((slot) => !slot.sold) ?? shop.slots[0] ?? null;
  const availableCount = shop.slots.filter((slot) => !slot.sold).length;
  const note = availableCount
    ? `剩余 ${availableCount} 件商品 ｜ 购买后该货位今日不再补货。`
    : "今日货架已售罄，可以刷新货架寻找新货。";

  const openUpgrade = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    setUpgrade({
      x: button.offsetLeft + button.offsetWidth / 2,
      y: button.offsetTop + button.offsetHeight / 2,
      closing: false,
    });
  };

  return (
    <div className={s.panel}>
      <div className={s.body}>
        <MarketShelf
          slots={shop.slots}
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
          <button
            className={s.refresh}
            type="button"
            disabled={loot < refreshCost}
            onClick={refreshShop}
          >
            <span className={s.actionIcon} aria-hidden="true">⟳</span>刷新货架 <span className={s.cost}>{refreshCost} 积分</span>
          </button>
          <button className={s.upgrade} type="button" onClick={openUpgrade}>
            <span className={s.actionIcon} aria-hidden="true">⇧</span>设施升级 <span className={s.cost}>等级 {level}</span>
          </button>
        </div>
      </div>

      {upgrade && (
        <MarketUpgradePanel
          level={level}
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
