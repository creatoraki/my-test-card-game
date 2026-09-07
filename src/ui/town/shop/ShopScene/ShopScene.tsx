// 商店(据点设施 shop, 全景里的「商店」)的设施内界面。
//
// ⚠ 本组件的根节点 .sx-root 永远不能挂 animation / opacity / transform:
//    入场/退场动画一律挂在叶子节点，避免破坏设施背景的 backdrop-filter。

import { useCallback, useRef, useState } from "react";
import { shopRefreshCost } from "@/data/shop";
import { useTownStore } from "@/store/townStore";
import { SciFiPanelShell } from "@/ui/common/SciFiPanelShell";
import { cx } from "@/ui/common/cx";
import PurchaseFlight, { type PurchaseFlightRect } from "@/ui/town/shop/PurchaseFlight/PurchaseFlight";
import { CrateIcon } from "@/ui/town/shop/StockPanels/icons";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import { ShopPanel } from "./ShopPanel";
import { useShopPopover } from "./useShopPopover";
import s from "./ShopScene.module.css";

const SHOP_PANEL_COLORS = {
  armor: "#241a0e",
  trim: "#a97c30",
  energy: "#ffc654",
  accent: "#ff754f",
  highlight: "#fff0bc",
  circuit: "#80622c",
};
const SHOP_PANEL_BG = "linear-gradient(150deg, #141311, #0a0d0e)";

const WAREHOUSE_RECT = { x: 70, y: 140, w: 640, h: 820 };
const SHOP_RECT = { x: 750, y: 140, w: 1100, h: 820 };

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
  const warehouseIconRef = useRef<HTMLSpanElement>(null);
  const itemIconRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const flightIdRef = useRef(0);
  const [purchaseFlights, setPurchaseFlights] = useState<PurchaseFlightState[]>([]);
  const { open, closing, mounted, openPanels, closePanels } = useShopPopover();

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
        <p className={s["sx-sub"]}>每日上新 · 积分采购 · 物资回收</p>
      </header>

      <StockEntries shopOpen={open} onOpenShop={openPanels} />

      {mounted && (
        <>
          <SciFiPanelShell
            rect={WAREHOUSE_RECT}
            kicker="STORAGE INDEX"
            title="仓库"
            closeLabel="关闭仓库"
            closing={closing}
            leaving={leaving}
            from="left"
            colors={SHOP_PANEL_COLORS}
            background={SHOP_PANEL_BG}
            headExtra={
              <span ref={warehouseIconRef} className={s["sx-warehouse-icon"]} aria-hidden="true">
                <CrateIcon />
              </span>
            }
            onClose={closePanels}
          >
            <WarehousePanel rows={4} columns={5} leaving={leaving} />
          </SciFiPanelShell>

          <SciFiPanelShell
            rect={SHOP_RECT}
            kicker="SUPPLY EXCHANGE"
            title="自动售货机"
            status={<span className={s["sx-status"]}>居民积分 · {loot.toLocaleString()}</span>}
            closeLabel="关闭商店"
            closing={closing}
            leaving={leaving}
            from="right"
            colors={SHOP_PANEL_COLORS}
            background={SHOP_PANEL_BG}
            onClose={closePanels}
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
          </SciFiPanelShell>
        </>
      )}

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

export default ShopScene;
