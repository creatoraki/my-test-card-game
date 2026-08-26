// 物资中转仓(据点设施 storage)的设施内界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 场景常驻只保留标题、读数与两条抽屉入口；库存清单和回收台统一复用 common/PanelShell。
// 装备穿戴/拆卸与羁绊进度已迁至角色详情页，这里不再保留重复入口。
//
// ⚠ 本组件的根节点 .stor-scene 与 .stor-entries 不挂 animation / opacity / transform，
//   避免影响设施背景的分层；入场/退场动画只挂常驻元素与抽屉叶子节点。

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { getItemDef } from "@/data";
import { mergeStacksForDisplay, occupiedSlots, sortStacks } from "@/items/inventory";
import { RARITY_ORDER, type ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import {
  PanelShell,
  PANEL_OUT_MS,
  PANEL_OUT_REDUCED_MS,
} from "@/ui/common/PanelShell";
import s from "./StorageScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

export const STORAGE_ACCENT = "#e59b3f";
const STORAGE_THEME = {
  "--asm-frame": STORAGE_ACCENT,
  "--asm-glow": STORAGE_ACCENT,
  "--asm-select": "#ffbe6b",
  "--asm-cyan": "#ffc98a",
  "--asm-line": "#f2e6d82e",
  "--asm-ink": "#f2e6d8",
  "--asm-ink-dim": "#a5937f",
  "--event-panel-title-size": "56px",
} as CSSProperties;

type PanelId = "inventory" | "recycle";

const rarityRank = (r: string) => RARITY_ORDER.indexOf(r as never);

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

export function StorageScene({ leaving = false }: Props) {
  const storage = useTownStore((s) => s.storage);
  const loot = useTownStore((s) => s.loot);
  const discardStored = useTownStore((s) => s.discardStored);
  const sellItem = useTownStore((s) => s.sellItem);

  const [panel, setPanel] = useState<PanelId | null>(null);
  // 关窗不能直接卸载, 否则滑出动画没机会播 —— 先进 closing 态, 播完再置空(同 CryoScene)。
  const [closing, setClosing] = useState(false);
  const closePanel = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const ms = prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS;
    const id = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
    }, ms);
    return () => clearTimeout(id);
  }, [closing]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);
  const scrapCount = storage.filter((s) => getItemDef(s.itemId).sellValue).length;

  return (
    <div className={cn("stor-scene", leaving && "is-leaving")}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className={cn("stor-header")} style={{ left: "56px", top: "42px" }}>
        <h2 className={cn("stor-title")}>物资中转仓</h2>
        <p className={cn("stor-sub")}>库存管理 · 物资回收</p>
      </header>

      {/* ---- 右上: 两枚读数 chip ---- */}
      <div className={cn("stor-readout")} style={{ right: "56px", top: "42px" }}>
        <Readout label="库存" value={storage.length} note={`${occupiedSlots(storage, getItemDef)} 格`} />
        <Readout label="居民积分" value={loot} />
      </div>

      {/* ---- 右侧抽屉: 功能入口 ----
          位置/尺寸旋钮全在内联 style(设计 px); CSS 只负责定位与滑动机制。
          贴画布右缘, 常态大部分被推出画布, 悬浮哪条哪条向左弹出(同 .cryo-entries)。 */}
      <div
        className={cn("stor-entries")}
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
          onClick={() => setPanel("inventory")}
        />
        <EntryTile
          icon={<RecycleIcon />}
          name="回收台"
          desc={scrapCount ? `${scrapCount} 件可出售` : "无可回收物资"}
          onClick={() => setPanel("recycle")}
        />
      </div>

      {panel === "inventory" && (
        <PanelShell
          accent={STORAGE_ACCENT}
          title="库存清单"
          status={`共 ${storage.length} 件 · 占 ${occupiedSlots(storage, getItemDef)} 格`}
          closeLabel="关闭库存清单"
          closing={closing}
          onClose={closePanel}
          themeStyle={STORAGE_THEME}
        >
          <InventoryPanel stacks={sorted} onDiscard={discardStored} />
        </PanelShell>
      )}
      {panel === "recycle" && (
        <PanelShell
          accent={STORAGE_ACCENT}
          title="回收台"
          status={`余额 ${loot.toLocaleString()} · 可回收 ${scrapCount} 件`}
          closeLabel="关闭回收台"
          closing={closing}
          onClose={closePanel}
          themeStyle={STORAGE_THEME}
        >
          <RecyclePanel stacks={sorted} loot={loot} onSell={sellItem} />
        </PanelShell>
      )}
    </div>
  );
}

// ===================== 入口砖(抽屉) =====================
// 结构与装配舱入口逐层对齐(rim / 图标 / 名称 / 说明 / ▸), 只有色相不同。
function EntryTile({
  icon,
  name,
  desc,
  onClick,
}: {
  icon: ReactNode;
  name: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button className={cn("stor-entry")} type="button" onClick={onClick}>
      <span className={cn("stor-rim")} aria-hidden />
      <span className={cn("stor-entry-icon")}>{icon}</span>
      <span className={cn("stor-entry-text")}>
        <span className={cn("stor-entry-name")}>{name}</span>
        <span className={cn("stor-entry-desc")}>{desc}</span>
      </span>
      <span className={cn("stor-entry-go")} aria-hidden>
        ▸
      </span>
    </button>
  );
}

function Readout({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className={cn("stor-chip")}>
      <span className={cn("stor-chip-label")}>{label}</span>
      <strong className={cn("stor-chip-value")}>{value.toLocaleString()}</strong>
      {note && <span className={cn("stor-chip-note")}>{note}</span>}
    </div>
  );
}

// 库存网格。★ 与探索背包共用同一个 ItemSlot 与同一套 tab —— 这就是把格子抽成组件的全部意义。
//   区别只有一条: 这里**没有格数上限**, 用 auto-fill 的流式网格 + 滚动。
function StockGrid({
  stacks,
  tab,
  equipTab,
  selected,
  onSelect,
  empty,
}: {
  stacks: ItemStack[];
  tab: ItemTab;
  equipTab: EquipTab;
  selected: string | null;
  onSelect: (uid: string) => void;
  empty: string;
}) {
  const shown = stacks.filter((st) => matchTab(st, tab, equipTab));
  if (!shown.length) return <p className={cn("stor-empty")}>{empty}</p>;
  return (
    <div className={cn("stor-grid")}>
      {shown.map((st) => (
        <ItemSlot
          key={st.uid}
          stack={st}
          selected={selected === st.uid}
          onClick={() => onSelect(st.uid)}
        />
      ))}
    </div>
  );
}

// ===================== 浮层 ①: 库存清单 =====================
function InventoryPanel({
  stacks,
  onDiscard,
}: {
  stacks: ItemStack[];
  onDiscard: (uid: string) => void;
}) {
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const displayStacks = useMemo(() => mergeStacksForDisplay(stacks, getItemDef), [stacks]);

  // 换选中项时清掉确认态 —— 否则「确认丢弃」会挂在另一件东西上。
  useEffect(() => setConfirming(null), [selected]);

  const sel = displayStacks.find((s) => s.uid === selected) ?? null;
  const discardSelection = (stack: ItemStack) => {
    const def = getItemDef(stack.itemId);
    if (def.category !== "material" && def.category !== "consumable") {
      onDiscard(stack.uid);
      return;
    }

    for (const source of stacks) {
      if (source.itemId === stack.itemId && source.affinity === stack.affinity) {
        onDiscard(source.uid);
      }
    }
  };

  return (
    <div className={cn("storBody")}>
        <div className={cn("stor-col-main")}>
          <ItemTabs
            stacks={displayStacks}
            tab={tab}
            equipTab={equipTab}
            onTab={setTab}
            onEquipTab={setEquipTab}
            className={cn("stor-inventory-tabs")}
          />
          <StockGrid
            stacks={displayStacks}
            tab={tab}
            equipTab={equipTab}
            selected={selected}
            onSelect={setSelected}
            empty="中转仓是空的 —— 从远征活着回来才会有东西进来。"
          />
        </div>
        <ItemDetail
          stack={sel}
          placeholder="仓库不设上限，带回来多少放多少。"
          className={cn("stor-inventory-detail")}
        >
          {sel &&
            (confirming === sel.uid ? (
              <>
                <button
                  className={cn("stor-btn", "is-danger")}
                  type="button"
                  onClick={() => {
                    discardSelection(sel);
                    setSelected(null);
                  }}
                >
                  确认丢弃
                </button>
                <button className={cn("stor-btn")} type="button" onClick={() => setConfirming(null)}>
                  取消
                </button>
              </>
            ) : (
              <button className={cn("stor-btn")} type="button" onClick={() => setConfirming(sel.uid)}>
                丢弃
              </button>
            ))}
        </ItemDetail>
    </div>
  );
}

// ===================== 浮层 ②: 回收台 =====================
// 设计文档 §6.1: 探索层不产出货币, **可回收物资必须带回据点出售**才换成居民积分。
function RecyclePanel({
  stacks,
  loot,
  onSell,
}: {
  stacks: ItemStack[];
  loot: number;
  onSell: (uid: string) => void;
}) {
  const sellable = stacks.filter((st) => getItemDef(st.itemId).sellValue);
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [picked, setPicked] = useState<string[]>([]);
  const shown = sellable.filter((st) => matchTab(st, tab, equipTab));

  // 卖掉的东西会从 stacks 里消失, 勾选表得跟着收敛, 否则「已选 3 件」会一直挂着卖不掉的幽灵。
  useEffect(() => {
    setPicked((cur) => cur.filter((uid) => sellable.some((s) => s.uid === uid)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stacks]);

  const total = picked.reduce((n, uid) => {
    const st = sellable.find((s) => s.uid === uid);
    if (!st) return n;
    return n + (getItemDef(st.itemId).sellValue ?? 0) * st.count;
  }, 0);

  const toggle = (uid: string) =>
    setPicked((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));

  return (
    <div className={cn("storRecycle")}>
      <div className={cn("storBody", "storRecycleBody")}>
        {sellable.length ? (
          <>
            <p className={cn("stor-note")}>
              废料与装备在这里换成居民积分——这是探索层产出变成城镇通货的唯一途径。
            </p>
            <ItemTabs
              stacks={sellable}
              tab={tab}
              equipTab={equipTab}
              onTab={setTab}
              onEquipTab={setEquipTab}
            />
            {shown.length ? (
              <div className={cn("stor-grid")}>
                {shown.map((st) => (
                  <ItemSlot
                    key={st.uid}
                    stack={st}
                    selected={picked.includes(st.uid)}
                    onClick={() => toggle(st.uid)}
                  />
                ))}
              </div>
            ) : (
              <p className={cn("stor-empty")}>该分类没有可回收物资。</p>
            )}
          </>
        ) : (
          <p className={cn("stor-empty")}>没有可回收的物资。请从远征里带回废料或装备。</p>
        )}
      </div>
      <div className={cn("stor-panel-foot")}>
        <p className={cn("stor-note")}>
          当前余额 {loot.toLocaleString()} · 已选 {picked.length} 件，可换 {total} 积分
        </p>
        <button
          className={cn("stor-primary")}
          type="button"
          disabled={!picked.length}
          onClick={() => {
            for (const uid of picked) onSell(uid);
            setPicked([]);
          }}
        >
          出售
        </button>
      </div>
    </div>
  );
}

// ===================== 入口图标 =====================
// 内联线框 SVG(与 ui/itemArt.tsx、TownScreen 的设施图标同约定: 不用 emoji, 不依赖素材)。
const iconBase = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 库存: 堆叠的货箱
const CrateIcon = () => (
  <svg {...iconBase}>
    <rect x="5" y="14" width="22" height="13" rx="1" />
    <path d="M5 19 h22" opacity=".6" />
    <path d="M13 14 v13 M19 14 v13" opacity=".45" />
    <rect x="10" y="6" width="12" height="8" rx="1" opacity=".7" />
  </svg>
);

// 回收台: 三角循环箭头
const RecycleIcon = () => (
  <svg {...iconBase}>
    <path d="M16 5 L21 14 h-10 Z" />
    <path d="M8 18 L3 27 h10 Z" opacity=".75" />
    <path d="M24 18 L29 27 H19 Z" opacity=".75" />
    <path d="M13 27 h6" opacity=".5" />
  </svg>
);
