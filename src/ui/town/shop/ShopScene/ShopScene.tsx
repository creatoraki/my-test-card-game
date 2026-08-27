// 商店(据点设施 shop)的设施内界面 —— 常驻货架与仓库入口。
//
// 商店的主刷新机制仍由 runStore.backToTown → townStore.advanceDay 负责。
// 本组件只读 shop 状态、派发 action，并编排购买飞行与 EventPanel 版式。
//
// ⚠ 本组件的根节点 .sx-root 永远不能挂 animation / opacity / transform:
//    入场/退场动画一律挂在叶子节点，避免破坏设施背景的 backdrop-filter。

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { shopRefreshCost, type ShopSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import {
  EventPanelButton,
  EventPanelFoot,
  EventPanelFrame,
  EventPanelStage,
} from "@/ui/common/EventPanel";
import { cx } from "@/ui/common/cx";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import PurchaseFlight, { type PurchaseFlightRect } from "@/ui/town/shop/PurchaseFlight/PurchaseFlight";
import ShelfGrid from "@/ui/town/shop/ShopScene/ShelfGrid";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import s from "./ShopScene.module.css";

const CONTENT_DELAY_MS = 560;
const PANEL_SIZE = { w: 1100, h: 800 };
type PurchaseFlightState = {
  id: number;
  itemId: string;
  source: PurchaseFlightRect;
  target: PurchaseFlightRect;
};

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

export function ShopScene({ leaving = false }: Props) {
  const loot = useTownStore((state) => state.loot);
  const day = useTownStore((state) => state.day);
  const shop = useTownStore((state) => state.shop);
  const refreshShop = useTownStore((state) => state.refreshShop);
  const buyShopItem = useTownStore((state) => state.buyShopItem);
  const refreshCost = shopRefreshCost(shop.refreshes);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const warehouseIconRef = useRef<HTMLSpanElement>(null);
  const itemIconRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const flightIdRef = useRef(0);
  const [purchaseFlights, setPurchaseFlights] = useState<PurchaseFlightState[]>([]);

  // 传给 memo 化的货架格，保持图标节点注册回调稳定。
  const registerItemIcon = useCallback((key: string, element: HTMLSpanElement | null) => {
    if (element) {
      itemIconRefs.current.set(key, element);
    } else {
      itemIconRefs.current.delete(key);
    }
  }, []);

  const handleBuy = (key: string) => {
    const slot = shop.slots.find((item) => item.key === key);
    const source = itemIconRefs.current.get(key);
    const target = warehouseIconRef.current;

    if (slot && !slot.sold && loot >= slot.price && source && target) {
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const id = flightIdRef.current++;
      setPurchaseFlights((current) => [
        ...current,
        {
          id,
          itemId: slot.itemId,
          source: {
            left: sourceRect.left,
            top: sourceRect.top,
            width: sourceRect.width,
            height: sourceRect.height,
          },
          target: {
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
          },
        },
      ]);
    }

    buyShopItem(key);
  };

  const removePurchaseFlight = (id: number) => {
    setPurchaseFlights((current) => current.filter((flight) => flight.id !== id));
  };

  return (
    <div className={cx(s["sx-root"], leaving && s["is-leaving"])} data-shop-root>
      <header className={s["sx-header"]} style={{ left: "56px", top: "42px" }}>
        <span className={s["sx-kicker"]}>SUPPLY EXCHANGE</span>
        <h2 className={s["sx-title"]}>商店</h2>
        <p className={s["sx-sub"]}>每日上新 · 积分采购</p>
      </header>

      <button
        className={cx(s["sx-control"], s["sx-warehouse-trigger"], warehouseOpen && s["is-active"])}
        type="button"
        aria-controls="shop-warehouse-panel"
        aria-expanded={warehouseOpen}
        onClick={() => setWarehouseOpen((current) => !current)}
      >
        <span ref={warehouseIconRef} className={s["sx-warehouse-icon"]} aria-hidden="true">
          ▦
        </span>
        <span>仓库</span>
      </button>

      <div
        className={s["sx-stage"]}
        style={
          {
            "--panel-w": `${PANEL_SIZE.w}px`,
            "--panel-h": `${PANEL_SIZE.h}px`,
          } as CSSProperties
        }
      >
        <div className={s["sx-display-group"]}>
          <section
            className={s["sx-panel"]}
            style={
              {
                width: `${PANEL_SIZE.w}px`,
                height: `${PANEL_SIZE.h}px`,
                "--content-delay": `${CONTENT_DELAY_MS}ms`,
              } as CSSProperties
            }
          >
            <EventPanelFrame
              accent="#d6b477"
              kicker="SUPPLY EXCHANGE"
              title="自动售货机"
              status={<span className={s["sx-status"]}>居民积分 · {loot.toLocaleString()}</span>}
              contentKey={`${day}-${shop.refreshes}`}
              className={s["sx-event-frame"]}
            >
              <ShopPanel
                shop={shop}
                loot={loot}
                day={day}
                refreshCost={refreshCost}
                onBuy={handleBuy}
                onIconRef={registerItemIcon}
                onRefresh={refreshShop}
              />
            </EventPanelFrame>
          </section>
        </div>
      </div>

      <WarehousePanel
        open={warehouseOpen}
        leaving={leaving}
        onClose={() => setWarehouseOpen(false)}
        panelId="shop-warehouse-panel"
        rows={4}
        columns={6}
        position={{ side: "left", top: 200, offset: 85 }}
        rotation={{ x: 0.7, y: 5 }}
      />

      {purchaseFlights.map((flight) => (
        <PurchaseFlight
          key={flight.id}
          itemId={flight.itemId}
          source={flight.source}
          target={flight.target}
          onComplete={() => removePurchaseFlight(flight.id)}
        />
      ))}
    </div>
  );
}

function ShopPanel({
  shop,
  loot,
  day,
  refreshCost,
  onBuy,
  onIconRef,
  onRefresh,
}: {
  shop: { slots: ShopSlot[]; refreshes: number };
  loot: number;
  day: number;
  refreshCost: number;
  onBuy: (key: string) => void;
  onIconRef: (key: string, element: HTMLSpanElement | null) => void;
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selectedSlot = shop.slots.find((slot) => slot.key === selected) ?? null;
  const hoveredSlot = shop.slots.find((slot) => slot.key === hovered) ?? null;
  const displayedSlot = hoveredSlot ?? selectedSlot;
  const displayedStack = useMemo<ItemStack | null>(
    () => (displayedSlot ? asStack(displayedSlot) : null),
    [displayedSlot],
  );

  useEffect(() => {
    setSelected(null);
    setHovered(null);
  }, [day, shop.refreshes]);

  const handleHoverEnd = useCallback((key: string) => {
    setHovered((current) => (current === key ? null : current));
  }, []);

  return (
    <EventPanelStage className={s["sx-event-stage"]}>
      <div className={s["sx-body"]}>
        <div className={s["sx-main"]}>
          <ShelfGrid
            slots={shop.slots}
            loot={loot}
            selected={selected}
            onSelect={setSelected}
            onHoverStart={setHovered}
            onHoverEnd={handleHoverEnd}
            onBuy={onBuy}
            onIconRef={onIconRef}
          />
        </div>
        <ShopItemCard
          key={`${day}-${shop.refreshes}`}
          stack={displayedStack}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        />
      </div>
      <EventPanelFoot note="出击返回据点即推进一日，货架会自动换新。">
        <EventPanelButton
          tone="primary"
          className={s["sx-refresh"]}
          disabled={loot < refreshCost}
          onClick={onRefresh}
          aria-label={`刷新货架，花费 ${refreshCost} 居民积分`}
        >
          <span className={s["sx-refresh-icon"]} aria-hidden="true">
            ↻
          </span>
          <span className={s["sx-refresh-label"]}>刷新货架</span>
          <span className={s["sx-refresh-cost"]}>{refreshCost}</span>
        </EventPanelButton>
      </EventPanelFoot>
    </EventPanelStage>
  );
}

const asStack = (slot: ShopSlot): ItemStack => ({
  uid: slot.key,
  itemId: slot.itemId,
  count: 1,
  affinity: slot.affinity,
});

export default ShopScene;
