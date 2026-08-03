// 商店(据点设施 shop)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 进入场景即打开右侧货架面板, 通过「装备 / 材料」页签切换当日货物。
//
// ★ 商店的**主**刷新机制不在这个界面里: 每次出击后返回据点算推进一日,
//   由 runStore.backToTown → townStore.advanceDay 换新货并把刷新价打回首价。
//   本组件只读 shop 状态与派发 action, 不自己判日期(隔日重置的真相点只有 advanceDay 一处)。
//
// 面板主题使用白色文字与冷蓝色高光, 与商店背景中的冷光设施保持一致。
//
// ⚠ 本组件的根节点 .sx-root **永远不能挂 animation / opacity / transform**:
//   一旦祖先成为 backdrop root, 底下玻璃砖的 backdrop-filter 就取不到设施背景。
//   入场/退场动画一律挂叶子元素(与 StorageScene / CryoScene 同一条约束)。
//
// ★ 样式独立: 类名一律 sx- 前缀且全挂在 .sx-root 作用域下, 货架格与详情栏用商店自己的
//   ShopItemTile / ShopItemCard —— 本界面不再改写任何共享组件, 也不依赖 .town-splash。
//
// ★ 购买入口在**货架格底部的价格牌**(ShelfPriceTag)上, 右侧详情栏是**纯展示**:
//   价格与商品在同一个格子里, 玩家不用在"看中哪件"和"在哪付钱"之间来回移动视线,
//   详情栏也就腾得出整个上半部分给商品图当主视觉。
//
// ★ 「装备 / 材料」页签是挂在面板**视觉左上角外侧**、顺着立柱往下垂的两块招牌(ShelfTabRail),
//   不在面板里: 面板整幅是"今天的货", 换品类是站在货架**外面**做的动作 —— 分成两个物件,
//   面板内部就不必再为导航让出一条横带。因此 tab 状态提到 ShopScene 这一层, 由招牌与面板共用。

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { shopRefreshCost, type ShopSlot } from "../data/shop";
import type { ItemStack } from "../items/types";
import { useTownStore } from "../store/townStore";
import ShopItemCard from "./ShopItemCard";
import ShopItemTile from "./ShopItemTile";
import "./ShopScene.css";

// 面板使用固定设计画布尺寸, 右侧保留独立 UI 呼吸区, 并由 CSS 靠右对齐。
const CONTENT_DELAY_MS = 560;
const PANEL_SIZE = { w: 1180, h: 800 };
type ShopTab = "equipment" | "material";

const SHOP_TABS: { id: ShopTab; label: string }[] = [
  { id: "equipment", label: "装备" },
  { id: "material", label: "材料" },
];

// 货架格 → ShopItemTile / ShopItemCard 认识的 ItemStack。★ 只是**展示用**的临时对象:
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
  // ★ tab 提到这一层: 纵向控制柱在面板**外面**, 与面板是兄弟节点, 两边都要读这个值。
  const [tab, setTab] = useState<ShopTab>("equipment");

  return (
    <div className={`sx-root${leaving ? " is-leaving" : ""}`}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className="sx-header" style={{ left: "56px", top: "42px" }}>
        <span className="sx-kicker">SUPPLY EXCHANGE</span>
        <h2 className="sx-title">商店</h2>
        <p className="sx-sub">每日上新 · 积分采购</p>
      </header>

      {/* ---- 常驻货架面板 ---- */}
      <div
        className="sx-stage"
        style={
          {
            "--panel-w": `${PANEL_SIZE.w}px`,
            "--panel-h": `${PANEL_SIZE.h}px`,
          } as CSSProperties
        }
      >
        {/* 招牌在面板**之前** —— .sx-stage 是右对齐的 flex 行, 它自然落在面板左外侧。 */}
        <ShelfTabRail tab={tab} onTab={setTab} shop={shop} />
        <section
          className="sx-panel"
          style={
            {
              width: `${PANEL_SIZE.w}px`,
              height: `${PANEL_SIZE.h}px`,
              "--content-delay": `${CONTENT_DELAY_MS}ms`,
            } as CSSProperties
          }
        >
          <span className="sx-panel-rim" aria-hidden="true" />
          <ShelfPanel
            shop={shop}
            loot={loot}
            day={day}
            tab={tab}
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
// ★ 读数(余额/日期/刷新)是标题栏的**一部分**, 不再是浮在面板右上角的绝对定位块 ——
//   两者同属一条 flex 行, 底边天然对齐, 面板 padding 变了也不会错位。
function PanelHead({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="sx-panel-head">
      <div className="sx-panel-head-text">
        <span className="sx-kicker">{kicker}</span>
        <h3 className="sx-panel-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ===================== 面板外的页签吊牌 =====================
// 从面板左上角外侧往下垂的两块招牌, 挂在一根立柱上 —— 像建筑外墙上挑出去的广告牌:
// 牌面与面板共用同一个 rotateY 倾角(读作贴在同一面墙上), 它们和面板一样是"摆在场景里的
// 物件", 而不是面板内部的一条导航带。
// 品类名走 writing-mode: vertical-rl 竖排(两个汉字自然叠成一列), 数量仍是横排小徽标。
// 当前页签会朝面板方向推出一小截, 牌面底色变化指出当前货物分类。
function ShelfTabRail({
  tab,
  onTab,
  shop,
}: {
  tab: ShopTab;
  onTab: (t: ShopTab) => void;
  shop: { equip: ShopSlot[]; material: ShopSlot[] };
}) {
  return (
    <div className="sx-tabrail" role="tablist" aria-label="货架分类" aria-orientation="vertical">
      {SHOP_TABS.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            className={`sx-vtab${active ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(item.id)}
          >
            <span className="sx-vtab-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 一排货。格子用商店专属的 ShopItemTile(见该文件顶部注释: 为什么不复用 ItemSlot)。
//   已售出的格压暗并把价格划掉, 但**保留占位**: 当日不补货是规则的一部分,
//   抽掉格子会让玩家看不出今天原本有几件。
function ShelfRow({
  label,
  slots,
  selected,
  hovered,
  loot,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onBuy,
}: {
  label: string;
  slots: ShopSlot[];
  selected: string | null;
  hovered: string | null;
  loot: number;
  onSelect: (key: string) => void;
  onHoverStart: (key: string) => void;
  onHoverEnd: (key: string) => void;
  onBuy: (key: string) => void;
}) {
  return (
    <div className="sx-row">
      <p className="sx-row-label">{label}</p>
      {slots.length ? (
        <div className="sx-grid">
          {slots.map((s) => (
            <div key={s.key} className={`sx-cell${s.sold ? " is-sold" : ""}`}>
              <ShopItemTile
                stack={asStack(s)}
                selected={selected === s.key}
                hovered={hovered === s.key}
                sold={s.sold}
                onClick={() => onSelect(s.key)}
                onPointerEnter={() => onHoverStart(s.key)}
                onPointerLeave={() => onHoverEnd(s.key)}
                onFocus={() => onHoverStart(s.key)}
                onBlur={() => onHoverEnd(s.key)}
              />
              <ShelfPriceTag slot={s} affordable={loot >= s.price} onBuy={onBuy} />
            </div>
          ))}
        </div>
      ) : (
        <p className="sx-empty">这一档今天没有进货。</p>
      )}
    </div>
  );
}

// 货架格底部的价格标记牌 —— 它**就是**购买按钮: 价格与商品在同一个格子里,
//   玩家不必先选中再挪到右栏付钱。详情栏因此不再有任何购买控件。
// 三种态各自显式配色(见 .sx-price.is-*), 不用整体 opacity 压暗 —— 价格必须始终读得清,
// 尤其是「积分不足」时, 玩家要看的正是还差多少。
function ShelfPriceTag({
  slot,
  affordable,
  onBuy,
}: {
  slot: ShopSlot;
  affordable: boolean;
  onBuy: (key: string) => void;
}) {
  const state = slot.sold ? "sold" : affordable ? "ready" : "poor";
  const label = slot.sold ? "已售出" : affordable ? "买入" : "积分不足";

  return (
    <button
      className={`sx-price is-${state}`}
      type="button"
      disabled={slot.sold || !affordable}
      onClick={() => onBuy(slot.key)}
      aria-label={`${label}，售价 ${slot.price} 居民积分`}
      title={label}
    >
      {slot.sold ? <span className="sx-price-sold">已售出</span> : <strong>{slot.price}</strong>}
    </button>
  );
}

// ===================== 常驻面板: 补给货架 =====================
function ShelfPanel({
  shop,
  loot,
  day,
  tab,
  refreshCost,
  onBuy,
  onRefresh,
}: {
  shop: { equip: ShopSlot[]; material: ShopSlot[]; refreshes: number };
  loot: number;
  day: number;
  /** 当前品类。★ 由 ShopScene 持有 —— 切换控件在面板外面(见 ShelfTabRail)。 */
  tab: ShopTab;
  refreshCost: number;
  onBuy: (key: string) => void;
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const visibleSlots = tab === "equipment" ? shop.equip : shop.material;
  const selectedSlot = visibleSlots.find((s) => s.key === selected) ?? null;
  const hoveredSlot = visibleSlots.find((s) => s.key === hovered) ?? null;
  const displayedSlot = hoveredSlot ?? selectedSlot;

  // 切换页签或刷新会让当前货架变化, 不可见的选中/悬浮商品都要清掉。
  useEffect(() => {
    const visibleKeys = new Set(visibleSlots.map((s) => s.key));
    setSelected((cur) => (cur && visibleKeys.has(cur) ? cur : null));
    setHovered((cur) => (cur && visibleKeys.has(cur) ? cur : null));
  }, [shop.equip, shop.material, tab, visibleSlots]);

  const handleHoverEnd = (key: string) => {
    setHovered((current) => (current === key ? null : current));
  };

  return (
    <>
      <PanelHead kicker="SUPPLY EXCHANGE" title="补给货架">
        <div className="sx-readout" aria-label="商店状态">
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
      </PanelHead>
      <div className="sx-body">
        <div className="sx-main">
          {/* key={tab} 强制换页签时重挂载 —— .sx-grid 的 sxTabSwap 淡入才会重播。 */}
          <ShelfRow
            key={tab}
            label={tab === "equipment" ? "装备" : "材料"}
            slots={visibleSlots}
            selected={selected}
            hovered={hovered}
            loot={loot}
            onSelect={setSelected}
            onHoverStart={setHovered}
            onHoverEnd={handleHoverEnd}
            onBuy={onBuy}
          />
        </div>
        <ShopItemCard
          stack={displayedSlot ? asStack(displayedSlot) : null}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        />
      </div>
      <div className="sx-foot">
        {/* ★ 余额与刷新次数**只在**顶部 readout 说一次 —— 这里以前重复了一遍, 三处讲同一批
            数字, 而底栏这条最长的文字信息量最低。留下的是 readout 说不了的那件事:
            主刷新机制不在这个界面里, 免得玩家以为只能花钱换货。 */}
        <p className="sx-note">出击归来自动换一批新货，刷新价也会归零。</p>
        <button
          className="sx-refresh"
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
