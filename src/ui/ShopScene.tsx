// 商店(据点设施 shop)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
//
// 与物资中转仓(ui/StorageScene.tsx)/ 冬眠仓(ui/CryoScene.tsx)/ 控制终端**逐层同构**:
//   场景常驻的只有「左上标题 + 右上读数 chip + 右侧一列抽屉式入口」, 点入口才弹浮层;
//   浮层无全局遮罩, 从画布上方连绳带板滑下。
//   ⚠ 不要把货架直接摊在场景上 —— 那样一进设施就被一整块面板糊住, 店主立绘与场景美术全白画。
//
// 两条抽屉 = 两件事:
//   ① 补给货架 —— 当日的 5 件装备 + 3 件材料, 花居民积分买走; 面板底部另有花积分刷新货架。
//   ② 商店终端 —— 只读的规则说明(等级 / 每日上架量 / 品质分布 / 下次刷新价)。
//
// ★ 商店的**主**刷新机制不在这个界面里: 每次出击后返回据点算推进一日,
//   由 runStore.backToTown → townStore.advanceDay 换新货并把刷新价打回首价。
//   本组件只读 shop 状态与派发 action, 不自己判日期(隔日重置的真相点只有 advanceDay 一处)。
//
// 与另外三个设施的差别只有**色相**: 冬眠仓浅紫、控制终端青、物资中转仓琥珀,
// 这里走霓虹品红 —— 四个设施分居四个色相, 才不会读起来像同一个房间。
//
// ⚠ 本组件的根节点 .shop-scene **永远不能挂 animation / opacity / transform**:
//   一旦祖先成为 backdrop root, 底下玻璃砖的 backdrop-filter 就取不到设施背景。
//   入场/退场动画一律挂叶子元素(与 StorageScene / CryoScene 同一条约束)。

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SHOP_LEVELS, shopLevel, shopRefreshCost, type ShopSlot } from "../data/shop";
import { RARITY_LABEL, type ItemRarity, type ItemStack } from "../items/types";
import { useTownStore } from "../store/townStore";
import ItemDetail from "./ItemDetail";
import ItemSlot from "./ItemSlot";
import { prefersReducedMotion } from "./transitions";
// ⚠ 临时素材: 店主还没有专属立绘取景, 直接用人物立绘原图。换图只改这一行。
import keeperArt from "../assets/人物立绘/商店机器人.png";
import "./ShopScene.css";

// ⚠ 与 ShopScene.css 里 shopPanelOut 的 duration 是**同一个值**, 改一处必须改两处 ——
//   JS 靠它决定什么时候真正卸载面板, CSS 靠它播完滑出。同 StorageScene 的 PANEL_OUT_MS。
const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180;

// 面板落定后内容才开始逐块浮现(= shopPanelIn 的 600ms)。同 StorageScene 的 CONTENT_DELAY_MS。
const CONTENT_DELAY_MS = 560;

type PanelId = "shelf" | "terminal";

const PANEL_SIZE: Record<PanelId, { w: number; h: number }> = {
  shelf: { w: 1180, h: 660 },
  terminal: { w: 760, h: 480 },
};

// 货架格 → ItemSlot / ItemDetail 认识的 ItemStack。★ 只是**展示用**的临时对象:
//   真正的实例(与 uid)要到 townStore.buyShopItem 里才由 makeItemStack 发出来。
//   uid 借用货架格的 key —— 它在这一批货里唯一, 够 React key 与选中态用了。
const asStack = (s: ShopSlot): ItemStack => ({
  uid: s.key,
  itemId: s.itemId,
  count: 1,
  affinity: s.affinity,
});

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

export function ShopScene({ leaving = false }: Props) {
  const loot = useTownStore((s) => s.loot);
  const day = useTownStore((s) => s.day);
  const shop = useTownStore((s) => s.shop);
  const refreshShop = useTownStore((s) => s.refreshShop);
  const buyShopItem = useTownStore((s) => s.buyShopItem);

  const [panel, setPanel] = useState<PanelId | null>(null);
  // 关窗不能直接卸载, 否则滑出动画没机会播 —— 先进 closing 态, 播完再置空(同 StorageScene)。
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

  const refreshCost = shopRefreshCost(shop.refreshes);
  const inStock = [...shop.equip, ...shop.material].filter((s) => !s.sold).length;

  return (
    <div className={`shop-scene${leaving ? " is-leaving" : ""}`}>
      {/* ---- 店主立绘 ---- 纯装饰, 不接收点击; 贴画布左下, 避开右侧抽屉。 */}
      {/* <img
        className="shop-keeper"
        src={keeperArt}
        alt=""
        draggable={false}
        style={{ left: "96px", bottom: "0px", height: "760px" }}
      /> */}

      {/* ---- 左上: 场景标题 ---- */}
      <header className="shop-header" style={{ left: "56px", top: "42px" }}>
        <span className="shop-kicker">SUPPLY EXCHANGE</span>
        <h2 className="shop-title">商店</h2>
        <p className="shop-sub">每日上新 · 积分采购</p>
      </header>

      {/* ---- 右上: 三枚读数 chip ---- */}
      <div className="shop-readout" style={{ right: "56px", top: "42px" }}>
        <div className="shop-chip">
          <span className="shop-chip-label">居民积分</span>
          <strong className="shop-chip-value">{loot.toLocaleString()}</strong>
        </div>
        <div className="shop-chip">
          <span className="shop-chip-label">生存时间</span>
          <strong className="shop-chip-value">第 {day} 日</strong>
          <span className="shop-chip-note">出击归来换新货</span>
        </div>
        <div className="shop-chip">
          <span className="shop-chip-label">今日刷新</span>
          <strong className="shop-chip-value">{shop.refreshes}</strong>
          <span className="shop-chip-note">下次 {refreshCost}</span>
        </div>
      </div>

      {/* ---- 右侧抽屉: 功能入口 ----
          位置/尺寸旋钮全在内联 style(设计 px); CSS 只负责定位与滑动机制。
          贴画布右缘, 常态大部分被推出画布, 悬浮哪条哪条向左弹出(同 .stor-entries)。 */}
      <div
        className="shop-entries"
        style={
          {
            right: "0px",
            top: "168px",
            width: "460px",
            gap: "10px",
            gridTemplateRows: "88px 88px",
            "--peek": "252px", // 收起时露在画布内的宽度(同物资中转仓)
          } as CSSProperties
        }
      >
        <EntryTile
          icon={<ShelfIcon />}
          name="补给货架"
          desc={inStock ? `${inStock} 件在架` : "今日已售罄"}
          onClick={() => setPanel("shelf")}
        />
        <EntryTile
          icon={<TerminalIcon />}
          name="商店终端"
          desc={`${shop.level} 级 · 上架规则`}
          onClick={() => setPanel("terminal")}
        />
      </div>

      {/* ---- 浮层 ---- 无全局遮罩; 开合是连绳带板从上方滑下 / 收回(见 CSS)。
          ⚠ .shop-modal 这一层绝不能挂 opacity/filter/transform —— 它是面板的父元素,
            一旦成为 backdrop root, 面板的 backdrop-filter 就取不到场景。 */}
      {panel && (
        <div
          className={`shop-modal${closing ? " is-closing" : ""}`}
          onClick={closePanel}
          style={
            {
              "--panel-w": `${PANEL_SIZE[panel].w}px`,
              "--panel-h": `${PANEL_SIZE[panel].h}px`,
            } as CSSProperties
          }
        >
          <section
            className="shop-panel"
            onClick={(e) => e.stopPropagation()}
            style={
              {
                width: `${PANEL_SIZE[panel].w}px`,
                height: `${PANEL_SIZE[panel].h}px`,
                "--content-delay": `${CONTENT_DELAY_MS}ms`,
              } as CSSProperties
            }
          >
            {panel === "shelf" ? (
              <ShelfPanel
                shop={shop}
                loot={loot}
                refreshCost={refreshCost}
                onBuy={buyShopItem}
                onRefresh={refreshShop}
                onClose={closePanel}
              />
            ) : (
              <TerminalPanel level={shop.level} refreshCost={refreshCost} onClose={closePanel} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ===================== 入口砖(抽屉) =====================
// 结构与 .stor-entry / .cryo-entry 逐层对齐(rim 跑光 / 图标 / 名称 / 说明 / ▸), 只有色相不同。
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
    <button className="shop-entry" type="button" onClick={onClick}>
      <span className="shop-rim" aria-hidden />
      <span className="shop-entry-icon">{icon}</span>
      <span className="shop-entry-text">
        <span className="shop-entry-name">{name}</span>
        <span className="shop-entry-desc">{desc}</span>
      </span>
      <span className="shop-entry-go" aria-hidden>
        ▸
      </span>
    </button>
  );
}

// 浮层标题栏。两个浮层共用。
function PanelHead({
  kicker,
  title,
  onClose,
}: {
  kicker: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="shop-panel-head">
      <span className="shop-kicker">{kicker}</span>
      <h3 className="shop-panel-title">{title}</h3>
      <button className="shop-close" type="button" onClick={onClose} aria-label="关闭">
        ✕
      </button>
    </div>
  );
}

// 一排货。★ 复用背包/仓库那颗 ItemSlot —— 稀有度边框、图标与羁绊角标不在这里再画一遍。
//   已售出的格压暗并盖一张「已售出」封条, 但**保留占位**: 当日不补货是规则的一部分,
//   抽掉格子会让玩家看不出今天原本有几件。
function ShelfRow({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: ShopSlot[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="shop-row">
      <p className="shop-section-label">{label}</p>
      {slots.length ? (
        <div className="shop-grid">
          {slots.map((s) => (
            <div key={s.key} className={`shop-cell${s.sold ? " is-sold" : ""}`}>
              <ItemSlot
                stack={asStack(s)}
                selected={selected === s.key}
                dimmed={s.sold}
                onClick={() => onSelect(s.key)}
              />
              <span className="shop-cell-price">{s.sold ? "已售出" : s.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="shop-empty">这一档今天没有进货。</p>
      )}
    </div>
  );
}

// ===================== 浮层 ①: 补给货架 =====================
function ShelfPanel({
  shop,
  loot,
  refreshCost,
  onBuy,
  onRefresh,
  onClose,
}: {
  shop: { equip: ShopSlot[]; material: ShopSlot[]; refreshes: number };
  loot: number;
  refreshCost: number;
  onBuy: (key: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const all = [...shop.equip, ...shop.material];
  const sel = all.find((s) => s.key === selected) ?? null;

  // 刷新会把整批货换掉, 选中的那一格随之消失 —— 不清掉的话右栏会挂着一件买不到的幽灵。
  useEffect(() => {
    setSelected((cur) => (cur && all.some((s) => s.key === cur) ? cur : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.equip, shop.material]);

  const affordable = sel ? loot >= sel.price : false;

  return (
    <>
      <PanelHead kicker="SHELF" title="补给货架" onClose={onClose} />
      <div className="shop-panel-body">
        <div className="shop-col-main">
          <ShelfRow label="装备" slots={shop.equip} selected={selected} onSelect={setSelected} />
          <ShelfRow label="材料" slots={shop.material} selected={selected} onSelect={setSelected} />
        </div>
        <ItemDetail
          stack={sel ? asStack(sel) : null}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        >
          {sel && (
            <>
              <p className="shop-price-line">
                <span className="shop-price-label">售价</span>
                <strong className="shop-price">{sel.price}</strong>
                <span className="shop-price-unit">居民积分</span>
              </p>
              <button
                className="shop-btn is-primary"
                type="button"
                disabled={sel.sold || !affordable}
                onClick={() => onBuy(sel.key)}
              >
                {sel.sold ? "已售出" : affordable ? "买下" : "积分不足"}
              </button>
            </>
          )}
        </ItemDetail>
      </div>
      <div className="shop-panel-foot">
        <p className="shop-note">
          当前余额 {loot.toLocaleString()} · 今日已刷新 {shop.refreshes} 次
          {/* 主刷新机制不在这里, 说清楚免得玩家以为只能花钱换货 */}
          <span className="shop-note-dim">　出击归来自动换一批新货，刷新价也会归零。</span>
        </p>
        <button
          className="shop-primary"
          type="button"
          disabled={loot < refreshCost}
          onClick={onRefresh}
        >
          刷新货架 · {refreshCost}
        </button>
      </div>
    </>
  );
}

// ===================== 浮层 ②: 商店终端(只读) =====================
function TerminalPanel({
  level,
  refreshCost,
  onClose,
}: {
  level: number;
  refreshCost: number;
  onClose: () => void;
}) {
  const cfg = shopLevel(level);
  // 只列权重不为 0 的档 —— 1 级就是「普通 100%」一行, 不必把 5 档全摆出来。
  const total = Object.values(cfg.weights).reduce((a, b) => a + b, 0);
  const tiers = (Object.entries(cfg.weights) as [ItemRarity, number][]).filter(([, w]) => w > 0);
  const maxLevel = Math.max(...Object.keys(SHOP_LEVELS).map(Number));

  return (
    <>
      <PanelHead kicker="TERMINAL" title="商店终端" onClose={onClose} />
      <div className="shop-panel-body is-single">
        <dl className="shop-spec">
          <div>
            <dt>设施等级</dt>
            <dd>{level} 级</dd>
          </div>
          <div>
            <dt>每次上架</dt>
            <dd>
              装备 {cfg.equipCount} 件 · 材料 {cfg.materialCount} 件
            </dd>
          </div>
          <div>
            <dt>品质分布</dt>
            <dd>
              {tiers.map(([r, w]) => (
                <span key={r} className="shop-spec-tier">
                  {RARITY_LABEL[r]} {Math.round((w / total) * 100)}%
                </span>
              ))}
            </dd>
          </div>
          <div>
            <dt>换货时机</dt>
            <dd>每次出击归来（推进一日）自动换新</dd>
          </div>
          <div>
            <dt>下次刷新</dt>
            <dd>{refreshCost} 居民积分</dd>
          </div>
        </dl>
        <p className="shop-note">
          手动刷新每用一次，当日下一次就更贵；隔日回落到起步价。售出的格子当日不补货。
        </p>
        {level >= maxLevel && (
          <p className="shop-note is-locked">设施升级尚未开放，货架规格暂时固定在 {level} 级。</p>
        )}
      </div>
    </>
  );
}

// ===================== 入口图标 =====================
// 内联线框 SVG(与 ui/itemArt.tsx、StorageScene、TownScreen 的设施图标同约定: 不用 emoji)。
const iconBase = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 货架: 三层横板 + 板上摆着的两件货
const ShelfIcon = () => (
  <svg {...iconBase}>
    <path d="M4 9 h24 M4 17 h24 M4 25 h24" />
    <path d="M6 6 v22 M26 6 v22" opacity=".45" />
    <rect x="9" y="4" width="5" height="5" opacity=".8" />
    <rect x="18" y="12" width="6" height="5" opacity=".8" />
  </svg>
);

// 终端: 立式屏 + 价签行
const TerminalIcon = () => (
  <svg {...iconBase}>
    <rect x="5" y="6" width="22" height="16" rx="1.5" opacity=".55" />
    <path d="M10 12 h9 M10 16 h12" />
    <path d="M13 22 v4 M19 22 v4 M10 26 h12" opacity=".7" />
  </svg>
);

export default ShopScene;
