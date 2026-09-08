import { useMemo, useState, type MouseEvent } from "react";
import {
  cardShopLevel,
  cardShopLevelOf,
  cardShopRefreshCost,
  getCharacter,
} from "@/data";
import { useTownStore } from "@/store/townStore";
import { CardShopSlotCard } from "./CardShopSlotCard";
import { CardShopUpgradePanel } from "./CardShopUpgradePanel";
import s from "./CardShopPanel.module.css";

type UpgradeState = { x: number; y: number; closing: boolean };

export function CardShopPanel() {
  const awakened = useTownStore((state) => state.awakened);
  const characters = useTownStore((state) => state.characters);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const cardShop = useTownStore((state) => state.cardShop);
  const refreshCardShop = useTownStore((state) => state.refreshCardShop);
  const buyCardShopCard = useTownStore((state) => state.buyCardShopCard);
  const upgradeCardShop = useTownStore((state) => state.upgradeCardShop);
  const [selectedChar, setSelectedChar] = useState("all");
  const [upgrade, setUpgrade] = useState<UpgradeState | null>(null);

  const level = cardShopLevelOf(cardShop.techs);
  const levelConfig = cardShopLevel(level);
  const refreshCost = cardShopRefreshCost(level, cardShop.refreshes);
  const visibleSlots = useMemo(
    () => selectedChar === "all"
      ? cardShop.slots
      : cardShop.slots.filter((slot) => slot.charId === selectedChar),
    [cardShop.slots, selectedChar],
  );
  const availableCount = cardShop.slots.filter((slot) => !slot.sold).length;
  const note = availableCount
    ? `货架保留 ${availableCount} 张卡牌；购买后该货位今日不再补货。`
    : "今日货架已售罄，可以刷新货架寻找新卡。";

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
        <div className={s.notice}>
          <strong>居民积分采购卡牌</strong>
          <span>每个货位绑定一名已唤醒角色，买下后直接加入该角色卡组。</span>
        </div>

        <div className={s.tabs} role="tablist" aria-label="卡牌商店角色筛选">
          <button
            className={`${s.tab} ${selectedChar === "all" ? s["is-active"] : ""}`}
            type="button"
            role="tab"
            aria-selected={selectedChar === "all"}
            onClick={() => setSelectedChar("all")}
          >
            全部角色
          </button>
          {awakened.map((charId) => (
            <button
              className={`${s.tab} ${selectedChar === charId ? s["is-active"] : ""}`}
              type="button"
              role="tab"
              aria-selected={selectedChar === charId}
              key={charId}
              onClick={() => setSelectedChar(charId)}
            >
              {getCharacter(charId).name}
            </button>
          ))}
        </div>

        <div className={s.grid} aria-label="卡牌商店货架">
          {visibleSlots.length ? visibleSlots.map((slot, index) => (
            <CardShopSlotCard
              key={slot.key}
              slot={slot}
              character={characters[slot.charId]}
              index={index}
              affordable={loot >= slot.price}
              onBuy={buyCardShopCard}
            />
          )) : <p className={s.empty}>当前筛选没有可展示的卡牌。</p>}
        </div>
      </div>

      <div className={s.foot}>
        <div className={s.summary}>
          <span>余额 {loot.toLocaleString()} 积分</span>
          <span>等级 {level} · {levelConfig.slotCount} 个货位</span>
          <span className={s.note}>{note}</span>
        </div>
        <div className={s.actions}>
          <button
            className={s.refresh}
            type="button"
            disabled={loot < refreshCost}
            onClick={refreshCardShop}
          >
            刷新货架 · {refreshCost} 积分
          </button>
          <button className={s.upgrade} type="button" onClick={openUpgrade}>
            设施升级 · 等级 {level}
          </button>
        </div>
      </div>

      {upgrade && (
        <CardShopUpgradePanel
          level={level}
          doneTechs={cardShop.techs}
          storage={storage}
          loot={loot}
          origin={{ x: upgrade.x, y: upgrade.y }}
          closing={upgrade.closing}
          onResearch={upgradeCardShop}
          onClose={() => setUpgrade((current) => current ? { ...current, closing: true } : current)}
          onClosed={() => setUpgrade(null)}
        />
      )}
    </div>
  );
}
