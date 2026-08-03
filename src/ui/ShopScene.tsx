// 商店(据点设施 shop)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 进入场景即打开右侧货架面板, 通过「装备 / 材料」页签切换当日货物。
//
// ★ 商店的**主**刷新机制不在这个界面里: 每次出击后返回据点算推进一日,
//   由 runStore.backToTown → townStore.advanceDay 换新货并把刷新价打回首价。
//   本组件只读 shop 状态与派发 action, 不自己判日期(隔日重置的真相点只有 advanceDay 一处)。
//
// 面板主题使用白色文字与冷蓝色高光, 与商店背景中的冷光设施保持一致。
//
// ⚠ 本组件的根节点 .shop-scene **永远不能挂 animation / opacity / transform**:
//   一旦祖先成为 backdrop root, 底下玻璃砖的 backdrop-filter 就取不到设施背景。
//   入场/退场动画一律挂叶子元素(与 StorageScene / CryoScene 同一条约束)。

import { useEffect, useState, type CSSProperties } from "react";
import { shopRefreshCost, type ShopSlot } from "../data/shop";
import type { ItemStack } from "../items/types";
import { useTownStore } from "../store/townStore";
import ItemDetail from "./ItemDetail";
import ItemSlot from "./ItemSlot";
import "./ShopScene.css";

// 面板使用固定设计画布尺寸, 右侧保留独立 UI 呼吸区, 并由 CSS 靠右对齐。
const CONTENT_DELAY_MS = 560;
const PANEL_SIZE = { w: 1180, h: 720 };
type ShopTab = "equipment" | "material";

const SHOP_TABS: { id: ShopTab; label: string }[] = [
  { id: "equipment", label: "装备" },
  { id: "material", label: "材料" },
];

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
  const refreshCost = shopRefreshCost(shop.refreshes);

  return (
    <div className={`shop-scene${leaving ? " is-leaving" : ""}`}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className="shop-header" style={{ left: "56px", top: "42px" }}>
        <span className="shop-kicker">SUPPLY EXCHANGE</span>
        <h2 className="shop-title">商店</h2>
        <p className="shop-sub">每日上新 · 积分采购</p>
      </header>

      {/* ---- 常驻货架面板 ---- */}
      <div
        className="shop-modal"
        style={
          {
            "--panel-w": `${PANEL_SIZE.w}px`,
            "--panel-h": `${PANEL_SIZE.h}px`,
          } as CSSProperties
        }
      >
        <section
          className="shop-panel"
          style={
            {
              width: `${PANEL_SIZE.w}px`,
              height: `${PANEL_SIZE.h}px`,
              "--content-delay": `${CONTENT_DELAY_MS}ms`,
            } as CSSProperties
          }
        >
          <span className="shop-panel-rim" aria-hidden="true" />
          <ShelfPanel
            shop={shop}
            loot={loot}
            day={day}
            refreshCost={refreshCost}
            onBuy={buyShopItem}
            onRefresh={refreshShop}
          />
        </section>
      </div>
    </div>
  );
}

// 常驻面板标题栏。返回据点由 TownScreen 统一提供, 商店面板不再设置关闭按钮。
function PanelHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="shop-panel-head">
      <span className="shop-kicker">{kicker}</span>
      <h3 className="shop-panel-title">{title}</h3>
    </div>
  );
}

// 一排货。★ 复用背包/仓库那颗 ItemSlot —— 稀有度边框、图标与羁绊角标不在这里再画一遍。
//   已售出的格压暗并盖一张「已售出」封条, 但**保留占位**:
//  当日不补货是规则的一部分,
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
                iconOnly
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

// 购买徽章 —— 价格**长在按钮里面**, 所以详情栏不再单列一行「售价 xxx 居民积分」:
//   同一个数字出现两次会让玩家在两处之间来回确认, 反而变慢。
// 三种态各自显式配色(见 .shop-buy.is-*), 不用整体 opacity 压暗 —— 价格必须始终读得清,
// 尤其是「积分不足」时, 玩家要看的正是还差多少。
function BuyBadge({
  slot,
  affordable,
  onBuy,
}: {
  slot: ShopSlot;
  affordable: boolean;
  onBuy: (key: string) => void;
}) {
  const state = slot.sold ? "sold" : affordable ? "ready" : "poor";
  const label = slot.sold ? "已售出" : affordable ? "购入" : "积分不足";

  return (
    <button
      className={`shop-buy is-${state}`}
      type="button"
      disabled={slot.sold || !affordable}
      onClick={() => onBuy(slot.key)}
      aria-label={`${label}，售价 ${slot.price} 居民积分`}
    >
      <span className="shop-buy-rim" aria-hidden="true" />
      <span className="shop-buy-label">{label}</span>
      <strong className="shop-buy-price">{slot.price}</strong>
    </button>
  );
}

// ===================== 常驻面板: 补给货架 =====================
function ShelfPanel({
  shop,
  loot,
  day,
  refreshCost,
  onBuy,
  onRefresh,
}: {
  shop: { equip: ShopSlot[]; material: ShopSlot[]; refreshes: number };
  loot: number;
  day: number;
  refreshCost: number;
  onBuy: (key: string) => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<ShopTab>("equipment");
  const [selected, setSelected] = useState<string | null>(null);
  const visibleSlots = tab === "equipment" ? shop.equip : shop.material;
  const sel = visibleSlots.find((s) => s.key === selected) ?? null;

  // 切换页签或刷新会让当前货架变化, 选中的商品若已不可见就清掉详情。
  useEffect(() => {
    const visibleKeys = new Set(visibleSlots.map((s) => s.key));
    setSelected((cur) => (cur && visibleKeys.has(cur) ? cur : null));
  }, [shop.equip, shop.material, tab, visibleSlots]);

  const affordable = sel ? loot >= sel.price : false;

  return (
    <>
      <PanelHead kicker="SUPPLY EXCHANGE" title="补给货架" />
      <div className="shop-panel-readout" aria-label="商店状态">
        <div>
          <span>居民积分</span>
          <strong>{loot.toLocaleString()}</strong>
        </div>
        <div>
          <span>生存时间</span>
          <strong>第 {day} 日</strong>
        </div>
        <div>
          <span>今日刷新</span>
          <strong>{shop.refreshes}</strong>
          <em>下次 {refreshCost}</em>
        </div>
      </div>
      <div className="shop-tabs" role="tablist" aria-label="货架分类">
        {SHOP_TABS.map((item) => {
          const count = item.id === "equipment" ? shop.equip.length : shop.material.length;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              className={`shop-tab${active ? " is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
            >
              <span>{item.label}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>
      <div className="shop-panel-body">
        <div className="shop-col-main">
          <ShelfRow
            label={tab === "equipment" ? "装备" : "材料"}
            slots={visibleSlots}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
        <ItemDetail
          stack={sel ? asStack(sel) : null}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        >
          {sel && <BuyBadge slot={sel} affordable={affordable} onBuy={onBuy} />}
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

export default ShopScene;
