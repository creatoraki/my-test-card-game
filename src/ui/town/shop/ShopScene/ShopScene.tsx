// 商店(据点设施 shop, 全景里的「商店」)的设施内界面。
//
// ⚠ 本组件的根节点 .sx-root 永远不能挂 animation / opacity / transform:
//    入场/退场动画一律挂在叶子节点，避免破坏设施背景的 backdrop-filter。

import { type CSSProperties } from "react";
import { shopRefreshCost } from "@/data/shop";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { cx } from "@/ui/common/cx";
import { CrateIcon, ShelfIcon } from "@/ui/town/shop/StockPanels/icons";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import { PanelShadows } from "./PanelShadows";
import { ShopPanel } from "./ShopPanel";
import { useShopPanelsMorph, VENDING_RECT, WAREHOUSE_RECT } from "./useShopPanelsMorph";
import s from "./ShopScene.module.css";

// 仓库 —— 黑银。中性银 + 近黑底, 走哑光拉丝金属的路子, 亮度全靠边缘高光顶上来。
const WAREHOUSE_THEME = {
  "--asm-frame": "#c9d3da",
  "--asm-glow": "#c9d3da",
  "--asm-select": "#f2f6f9",
  "--asm-cyan": "#f2f6f9",
  "--asm-line": "#c9d3da2e",
  "--asm-ink": "#eef2f5",
  "--asm-ink-dim": "#98a3ab",
  "--asm-panel-bg": "#0a0d10d9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

// 自动售货机 —— 钢青冰蓝。与仓库同为冷色, 靠明度与质感(电光高光 vs 哑光拉丝)分层。
const VENDING_THEME = {
  "--asm-frame": "#5fc8ff",
  "--asm-glow": "#5fc8ff",
  "--asm-select": "#cdeeff",
  "--asm-cyan": "#cdeeff",
  "--asm-line": "#5fc8ff33",
  "--asm-ink": "#e8f6ff",
  "--asm-ink-dim": "#8ba6b8",
  "--asm-panel-bg": "#08131cd9",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

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
  const { open, closing, mounted, openPanels, closePanels, warehouse, vending } = useShopPanelsMorph();

  return (
    // ⚠ data-leaving 不能省: 抽屉入口的样式在 StockPanels.module.css 里, 与本文件不是同一个
    //   CSS Module, 拿不到 .is-leaving 的哈希类名 —— 只能靠这个属性把退场传下去。
    <div
      className={cx(s["sx-root"], leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <header className={s["sx-header"]} style={{ left: "56px", top: "42px" }}>
        <span className={s["sx-kicker"]}>物资交换</span>
        <h2 className={s["sx-title"]}>商店</h2>
        <p className={s["sx-sub"]}>每日上新 · 积分采购 · 物资回收</p>
      </header>

      <StockEntries shopOpen={open} shopClosing={closing} onOpenShop={openPanels} />

      {mounted && (
        <>
          {warehouse.ready && !closing && <PanelShadows />}

          <PanelShell
            title="仓库"
            accent="#c9d3da"
            status={
              <span className={s["sx-status"]}>
                <span className={s["sx-warehouse-icon"]} aria-hidden="true">
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
            accent="#5fc8ff"
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
              onBuy={buyShopItem}
              onRefresh={refreshShop}
            />
          </PanelShell>
        </>
      )}
    </div>
  );
}

export default ShopScene;
