// 商店场景右侧的两条抽屉入口: 商店 / 回收台。
// 商店弹层由 ShopScene 的 SciFiPanelShell 联动管理; 回收台继续使用 panelMorph。

import { useMemo, type CSSProperties } from "react";
import { getItemDef } from "@/data";
import { sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import { useEntryRise } from "@/ui/hooks/useEntryRise";
import { EntryTile } from "./EntryTile";
import { RecyclePanel } from "./RecyclePanel";
import { RecycleIcon, ShelfIcon } from "./icons";
import s from "./StockPanels.module.css";

/** 浮层主色: 与商店货架同一档暖金, 不用中转仓那支橙。 */
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

type PanelId = "recycle";

const PANEL_RECT: Record<PanelId, Rect> = {
  recycle: { x: 160, y: 80, w: 1600, h: 920 },
};

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

export interface StockEntriesProps {
  shopOpen: boolean;
  onOpenShop: () => void;
}

export function StockEntries({ shopOpen, onOpenShop }: StockEntriesProps) {
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const sellItem = useTownStore((state) => state.sellItem);

  const entryRise = useEntryRise();
  const morph = usePanelMorph<PanelId>({
    rects: PANEL_RECT,
  });
  const { panel } = morph;

  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);
  const scrapCount = storage.filter((stack) => getItemDef(stack.itemId).sellValue).length;

  return (
    <>
      <div
        className={s.entries}
        {...entryRise}
        style={
          {
            right: "0px",
            top: "138px",
            width: "460px",
            height: "220px",
            "--peek": "268px",
            ...morph.entryVars,
          } as CSSProperties
        }
      >
        <EntryTile
          icon={<ShelfIcon />}
          name="商店"
          desc="每日上新 · 采购物资"
          hidden={shopOpen}
          onClick={onOpenShop}
        />
        <EntryTile
          icon={<RecycleIcon />}
          name="回收台"
          desc={scrapCount ? `${scrapCount} 件可出售` : "无可回收物资"}
          entryId="recycle"
          hidden={morph.hiddenEntry === "recycle" && morph.phase !== "closing"}
          revealing={morph.phase === "closing" && morph.hiddenEntry === "recycle"}
          onClick={(event) => morph.openPanel("recycle", event.currentTarget)}
        />
      </div>

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
          morph={{
            ref: morph.panelRef,
            rect: PANEL_RECT.recycle,
            ready: morph.ready,
            seed: <RecycleIcon />,
            seedLabel: "回收台",
          }}
        >
          <RecyclePanel stacks={sorted} loot={loot} onSell={sellItem} />
        </PanelShell>
      )}
    </>
  );
}
