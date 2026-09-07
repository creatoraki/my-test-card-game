// 商店(据点设施 shop, 全景里的「商店」)的设施内界面。
//
// ⚠ 本组件的根节点 .sx-root 永远不能挂 animation / opacity / transform:
//    入场/退场动画一律挂在叶子节点，避免破坏设施背景的 backdrop-filter。

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { shopRefreshCost } from "@/data/shop";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { cx } from "@/ui/common/cx";
import PurchaseFlight, { type PurchaseFlightRect } from "@/ui/town/shop/PurchaseFlight/PurchaseFlight";
import { CrateIcon, ShelfIcon } from "@/ui/town/shop/StockPanels/icons";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import { ShopPanel } from "./ShopPanel";
import { useShopPanelsMorph, VENDING_RECT, WAREHOUSE_RECT } from "./useShopPanelsMorph";
import s from "./ShopScene.module.css";

const WAREHOUSE_THEME = {
  "--asm-frame": "#36d9d0",
  "--asm-glow": "#36d9d0",
  "--asm-select": "#a8fff6",
  "--asm-cyan": "#a8fff6",
  "--asm-line": "#a8fff633",
  "--asm-ink": "#e8fffc",
  "--asm-ink-dim": "#85aaa5",
  "--asm-panel-bg": "#071d25d9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

const VENDING_THEME = {
  "--asm-frame": "#b6ff4d",
  "--asm-glow": "#b6ff4d",
  "--asm-select": "#eaffd0",
  "--asm-cyan": "#eaffd0",
  "--asm-line": "#eaffd033",
  "--asm-ink": "#f0ffdf",
  "--asm-ink-dim": "#a5b98e",
  "--asm-panel-bg": "#101c12d9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

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
  const { open, closing, mounted, openPanels, closePanels, warehouse, vending } = useShopPanelsMorph();

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

      <StockEntries shopOpen={open} shopClosing={closing} onOpenShop={openPanels} />

      {mounted && (
        <>
          <PanelShell
            title="仓库"
            accent="#36d9d0"
            status={
              <span className={s["sx-status"]}>
                <span ref={warehouseIconRef} className={s["sx-warehouse-icon"]} aria-hidden="true">
                  <CrateIcon />
                </span>
                仓储索引
              </span>
            }
            closeLabel="关闭仓库"
            closing={closing}
            onClose={closePanels}
            themeStyle={WAREHOUSE_THEME}
            className={s["sx-warehouse-modal"]}
            morph={{
              ref: warehouse.panelRef,
              rect: WAREHOUSE_RECT,
              ready: warehouse.ready,
              seed: <CrateIcon />,
              seedLabel: "仓库",
            }}
          >
            <WarehousePanel rows={4} columns={4} leaving={leaving} />
          </PanelShell>

          <PanelShell
            title="自动售货机"
            accent="#b6ff4d"
            status={<span className={s["sx-status"]}>居民积分 · {loot.toLocaleString()}</span>}
            closeLabel="关闭商店"
            closing={closing}
            onClose={closePanels}
            sfx={false}
            themeStyle={VENDING_THEME}
            className={s["sx-vending-modal"]}
            morph={{
              ref: vending.panelRef,
              rect: VENDING_RECT,
              ready: vending.ready,
              seed: <ShelfIcon />,
              seedLabel: "自动售货机",
            }}
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
          </PanelShell>
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
