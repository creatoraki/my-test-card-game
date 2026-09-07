// 商店场景右侧的两条抽屉入口: 库存清单 / 回收台。
//
// ★ 这两件事原本住在「物资中转仓」。设施按语义合并后, 物资的进出(采购 / 出售 / 在库)
//   全部收进商店一个场景, 中转仓不再存在。
// ★ 抽屉与浮层的开合复用 common/panelMorph + common/PanelShell —— 与装配舱一模一样的机制,
//   本文件只登记「有哪几条入口、各自开哪个浮层」。

import { useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { getItemDef } from "@/data";
import { occupiedSlots, sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import { PanelShell } from "@/ui/common/PanelShell";
import { usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import { InventoryPanel } from "./InventoryPanel";
import { RecyclePanel } from "./RecyclePanel";
import { CrateIcon, RecycleIcon } from "./icons";
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
  "--event-panel-title-size": "56px",
} as CSSProperties;

type PanelId = "inventory" | "recycle";

const PANEL_RECT: Record<PanelId, Rect> = {
  inventory: { x: 160, y: 80, w: 1600, h: 920 },
  recycle: { x: 160, y: 80, w: 1600, h: 920 },
};

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);

export function StockEntries() {
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const discardStored = useTownStore((state) => state.discardStored);
  const sellItem = useTownStore((state) => state.sellItem);

  const morph = usePanelMorph<PanelId>({ rects: PANEL_RECT, entryAttr: "data-stock-entry" });
  const { panel } = morph;

  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);
  const scrapCount = storage.filter((stack) => getItemDef(stack.itemId).sellValue).length;

  return (
    <>
      {/* 贴画布右缘, 常态大部分被推出画布, 悬浮哪条哪条向左弹出(同装配舱的 .asm-entries)。
          位置/尺寸旋钮全在内联 style(设计 px); CSS 只负责定位与滑动机制。 */}
      <div
        className={s.entries}
        style={
          {
            right: "0px",
            top: "138px",
            width: "460px",
            height: "188px",
            "--peek": "252px",
          } as CSSProperties
        }
      >
        <EntryTile
          icon={<CrateIcon />}
          name="库存清单"
          desc={storage.length ? `${storage.length} 件在库` : "空仓"}
          entryId="inventory"
          hidden={morph.hiddenEntry === "inventory"}
          onClick={(event) => morph.openPanel("inventory", event.currentTarget)}
        />
        <EntryTile
          icon={<RecycleIcon />}
          name="回收台"
          desc={scrapCount ? `${scrapCount} 件可出售` : "无可回收物资"}
          entryId="recycle"
          hidden={morph.hiddenEntry === "recycle"}
          onClick={(event) => morph.openPanel("recycle", event.currentTarget)}
        />
      </div>

      {panel === "inventory" && (
        <PanelShell
          accent={STOCK_ACCENT}
          title="库存清单"
          status={`共 ${storage.length} 件 · 占 ${occupiedSlots(storage, getItemDef)} 格`}
          closeLabel="关闭库存清单"
          closing={morph.phase === "closing"}
          onClose={morph.closePanel}
          themeStyle={STOCK_THEME}
          className={s.panel}
          morph={{
            ref: morph.panelRef,
            rect: PANEL_RECT.inventory,
            ready: morph.ready,
            seed: <CrateIcon />,
            seedLabel: "库存清单",
          }}
        >
          <InventoryPanel stacks={sorted} onDiscard={discardStored} />
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

// 入口砖(抽屉)。结构与装配舱入口逐层对齐(rim / 图标 / 名称 / 说明 / ▸), 只有色相不同。
function EntryTile({
  icon,
  name,
  desc,
  entryId,
  hidden,
  onClick,
}: {
  icon: ReactNode;
  name: string;
  desc: string;
  entryId: PanelId;
  hidden: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className={s.entry}
      type="button"
      data-stock-entry={entryId}
      onClick={onClick}
      style={{ visibility: hidden ? "hidden" : "visible" }}
    >
      <span className={s.rim} aria-hidden />
      <span className={s["entry-icon"]}>{icon}</span>
      <span className={s["entry-text"]}>
        <span className={s["entry-name"]}>{name}</span>
        <span className={s["entry-desc"]}>{desc}</span>
      </span>
      <span className={s["entry-go"]} aria-hidden>
        ▸
      </span>
    </button>
  );
}
