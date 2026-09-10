// 据点商店抽屉入口：商店、回收台、仓库各自打开同一列中的一个独立面板。

import { useMemo, type CSSProperties } from "react";
import { getItemDef, sellPriceOf, shopLevelOf } from "@/data";
import { sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { techLevels, useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { CLOSE_MS, usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import { useFacilityPanelExit } from "@/ui/town/facilityExit";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import { MarketPanel } from "../MarketPanel";
import WarehousePanel from "../WarehousePanel/WarehousePanel";
import { EntryTile } from "./EntryTile";
import { RecyclePanel } from "./RecyclePanel";
import { CrateIcon, RecycleIcon, ShelfIcon } from "./icons";
import s from "./StockPanels.module.css";

export const STOCK_ACCENT = "#d6b477";

const STOCK_THEME = {
  "--asm-frame": STOCK_ACCENT,
  "--asm-glow": STOCK_ACCENT,
  "--asm-select": "#f0d49b",
  "--asm-cyan": "#f0d49b",
  "--asm-line": "#f2e6d82e",
  "--asm-ink": "#f2e6d8",
  "--asm-ink-dim": "#a5937f",
  "--asm-panel-bg": "#0c1215",
  "--panel-shell-title-size": "34px",
  "--panel-shell-status-size": "20px",
  "--panel-shell-close-size": "36px",
} as CSSProperties;

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

type PanelId = "shop" | "recycle" | "warehouse";

const PANEL_RECT: Record<PanelId, Rect> = {
  shop: { x: 210, y: 80, w: 1500, h: 920 },
  recycle: { x: 210, y: 80, w: 1500, h: 920 },
  warehouse: { x: 64, y: 178, w: 660, h: 776 },
};

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

export function StockEntries() {
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const shop = useTownStore((state) => state.shop);
  const levels = useTownStore(techLevels);
  const sellItem = useTownStore((state) => state.sellItem);

  const entryRise = useEntryRise();
  const morph = usePanelMorph<PanelId>({ rects: PANEL_RECT });
  const { panel } = morph;
  const mounted = panel !== null;
  useFacilityPanelExit(() => {
    if (!mounted) return 0;
    morph.closePanel();
    return CLOSE_MS;
  });

  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);
  const scrapCount = storage.filter((stack) => sellPriceOf(getItemDef(stack.itemId), levels) > 0).length;
  const availableCount = shop.slots.filter((slot) => !slot.sold).length;

  const hidden = (id: PanelId) => morph.hiddenEntry === id && morph.phase !== "closing";
  const revealing = (id: PanelId) => morph.phase === "closing" && morph.hiddenEntry === id;

  return (
    <>
      <div
        className={s.entries}
        {...entryRise}
        style={{
          right: "0px",
          top: "138px",
          width: "460px",
          height: "336px",
          "--peek": "268px",
          ...morph.entryVars,
        } as CSSProperties}
      >
        <EntryTile
          icon={<ShelfIcon />}
          name="商店"
          desc={availableCount ? `${availableCount} 件在售` : "今日已售罄"}
          entryId="shop"
          hidden={hidden("shop")}
          revealing={revealing("shop")}
          onClick={(event) => morph.openPanel("shop", event.currentTarget)}
        />
        <EntryTile
          icon={<RecycleIcon />}
          name="回收台"
          desc={scrapCount ? `${scrapCount} 件可出售` : "无可回收物资"}
          entryId="recycle"
          hidden={hidden("recycle")}
          revealing={revealing("recycle")}
          onClick={(event) => morph.openPanel("recycle", event.currentTarget)}
        />
        <EntryTile
          icon={<CrateIcon />}
          name="仓库"
          desc="查看与整理物资"
          entryId="warehouse"
          hidden={hidden("warehouse")}
          revealing={revealing("warehouse")}
          onClick={(event) => morph.openPanel("warehouse", event.currentTarget)}
        />
      </div>

      {panel === "shop" && (
        <PanelShell
          accent={STOCK_ACCENT}
          title="商店"
          status={`余额 ${loot.toLocaleString()} · 等级 ${shopLevelOf(shop.techs)}`}
          closeLabel="关闭商店"
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          themeStyle={STOCK_THEME}
          className={s.panel}
          morph={{ ref: morph.panelRef, rect: PANEL_RECT.shop, ready: morph.ready, seed: <ShelfIcon />, seedLabel: "商店" }}
        >
          <MarketPanel />
        </PanelShell>
      )}

      {panel === "recycle" && (
        <PanelShell
          accent={STOCK_ACCENT}
          title="回收台"
          status={`余额 ${loot.toLocaleString()} · 可回收 ${scrapCount} 件`}
          closeLabel="关闭回收台"
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          themeStyle={STOCK_THEME}
          className={s.panel}
          morph={{ ref: morph.panelRef, rect: PANEL_RECT.recycle, ready: morph.ready, seed: <RecycleIcon />, seedLabel: "回收台" }}
        >
          <RecyclePanel stacks={sorted} loot={loot} levels={levels} onSell={sellItem} />
        </PanelShell>
      )}

      {panel === "warehouse" && (
        <PanelShell
          accent="#c9d3da"
          title="仓库"
          status="仓储索引"
          closeLabel="关闭仓库"
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          themeStyle={WAREHOUSE_THEME}
          className={s.panel}
          morph={{ ref: morph.panelRef, rect: PANEL_RECT.warehouse, ready: morph.ready, seed: <CrateIcon />, seedLabel: "仓库" }}
        >
          <WarehousePanel rows={4} columns={4} />
        </PanelShell>
      )}
    </>
  );
}
