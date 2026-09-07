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

const WAREHOUSE_PANEL_COLORS = {
  armor: "#071d25",
  trim: "#237d91",
  energy: "#36d9d0",
  accent: "#719dff",
  highlight: "#dcfffc",
  circuit: "#145467",
};
const WAREHOUSE_PANEL_BG = [
  "radial-gradient(ellipse 80% 48% at 12% 4%, #63fff033, transparent 66%)",
  "radial-gradient(ellipse 62% 52% at 92% 94%, #718dff26, transparent 70%)",
  "linear-gradient(145deg, #173943 0%, #0a171d 58%, #050a0e 100%)",
].join(", ");

const SHOP_PANEL_COLORS = {
  armor: "#101c12",
  trim: "#3f7a44",
  energy: "#b6ff4d",
  accent: "#ff5fa2",
  highlight: "#eaffd0",
  circuit: "#2a5230",
};
const SHOP_PANEL_BG = [
  "radial-gradient(ellipse 72% 46% at 88% 5%, #b6ff4d26, transparent 68%)",
  "radial-gradient(ellipse 60% 55% at 8% 94%, #ff5fa21f, transparent 72%)",
  "linear-gradient(145deg, #16301c 0%, #0c1a10 56%, #050906 100%)",
].join(", ");

const WAREHOUSE_RECT = { x: 70, y: 140, w: 680, h: 820 };
const SHOP_RECT = { x: 760, y: 130, w: 1150, h: 860 };

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
        <span className={s["sx-kicker"]}>物资交换</span>
        <h2 className={s["sx-title"]}>商店</h2>
        <p className={s["sx-sub"]}>每日上新 · 积分采购 · 物资回收</p>
      </header>

      <StockEntries shopOpen={open} onOpenShop={openPanels} />

      {mounted && (
        <>
          <SciFiPanelShell
            className={s["sx-warehouse-shell"]}
            rect={WAREHOUSE_RECT}
            kicker="仓储索引"
            title="仓库"
            closeLabel="关闭仓库"
            closing={closing}
            leaving={leaving}
            from="left"
            colors={WAREHOUSE_PANEL_COLORS}
            background={WAREHOUSE_PANEL_BG}
            headExtra={
              <span ref={warehouseIconRef} className={s["sx-warehouse-icon"]} aria-hidden="true">
                <CrateIcon />
              </span>
            }
            onClose={closePanels}
          >
            <WarehousePanel rows={4} columns={4} leaving={leaving} />
          </SciFiPanelShell>

          <SciFiPanelShell
            className={s["sx-vending-shell"]}
            rect={SHOP_RECT}
            kicker="物资交换"
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
