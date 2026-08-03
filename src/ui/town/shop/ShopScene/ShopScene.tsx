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
// ★ 商店面板左侧保留两块独立的梯形侧牌, 与面板共用背板材质, 负责装备/材料切换。

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { shopRefreshCost, type ShopSlot } from "@/data/shop";
import type { ItemStack } from "@/items/types";
import { useTownStore } from "@/store/townStore";
import ShopItemCard from "@/ui/town/shop/ShopItemCard";
import ShopItemTile from "@/ui/town/shop/ShopItemTile";
import { cx } from "@/ui/common/cx";
import s from "./ShopScene.module.css";

// 面板使用固定设计画布尺寸, 右侧靠近用户, 左侧保留背景 NPC 的观景区。
const CONTENT_DELAY_MS = 560;
const SHELF_EXIT_MS = 500;
const SHELF_ENTER_MS = 520;
const PANEL_SIZE = { w: 1100, h: 800 };
type ShopTab = "equipment" | "material";
type TabDirection = "forward" | "backward";
type ShelfMotion = "entering" | "leaving" | "idle";
type ShelfSnapshot = { key: string; tab: ShopTab; slots: ShopSlot[] };
const SHOP_TABS: { id: ShopTab; label: string }[] = [
  { id: "equipment", label: "装备" },
  { id: "material", label: "材料" },
];

const shelfMotionDuration = (duration: number) =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : duration;

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
  const [tab, setTab] = useState<ShopTab>("equipment");
  const [tabDirection, setTabDirection] = useState<TabDirection>("forward");

  const handleTabChange = (nextTab: ShopTab) => {
    if (nextTab === tab) return;
    setTabDirection(tab === "equipment" && nextTab === "material" ? "forward" : "backward");
    setTab(nextTab);
  };

  return (
    <div className={cx(s["sx-root"], leaving && s["is-leaving"])} data-shop-root>
      {/* ---- 左上: 场景标题 ---- */}
      <header className={s["sx-header"]} style={{ left: "56px", top: "42px" }}>
        <span className={s["sx-kicker"]}>SUPPLY EXCHANGE</span>
        <h2 className={s["sx-title"]}>商店</h2>
        <p className={s["sx-sub"]}>每日上新 · 积分采购</p>
      </header>

      {/* ---- 常驻货架面板 ---- */}
      <div
        className={s["sx-stage"]}
        style={
          {
            "--panel-w": `${PANEL_SIZE.w}px`,
            "--panel-h": `${PANEL_SIZE.h}px`,
          } as CSSProperties
        }
      >
        <div className={s["sx-display-group"]}>
          {/* 两块侧牌与面板作为一个整体倾斜, 右侧靠近用户、左侧远离用户。 */}
          <div className={s["sx-side-rail"]} role="tablist" aria-label="货架分类" aria-orientation="vertical">
            {SHOP_TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  className={cx(s["sx-control"], s["sx-side-plaque"], active && s["is-active"])}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(item.id)}
                >
                  <span className={s["sx-side-plaque-label"]}>{item.label}</span>
                </button>
              );
            })}
          </div>
          <section
            className={s["sx-panel"]}
            style={
              {
                width: `${PANEL_SIZE.w}px`,
                height: `${PANEL_SIZE.h}px`,
                "--content-delay": `${CONTENT_DELAY_MS}ms`,
              } as CSSProperties
            }
          >
            <span className={s["sx-panel-rim"]} aria-hidden="true" />
            <ShelfPanel
              shop={shop}
              loot={loot}
              day={day}
              tab={tab}
              tabDirection={tabDirection}
              refreshCost={refreshCost}
              onBuy={buyShopItem}
              onRefresh={refreshShop}
            />
          </section>
        </div>
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
    <div className={s["sx-panel-head"]}>
      <div className={s["sx-panel-head-text"]}>
        <span className={s["sx-kicker"]}>{kicker}</span>
        <h3 className={s["sx-panel-title"]}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// 一排货。格子用商店专属的 ShopItemTile(见该文件顶部注释: 为什么不复用 ItemSlot)。
//   已售出的格压暗并把价格划掉, 但**保留占位**: 当日不补货是规则的一部分,
//   抽掉格子会让玩家看不出今天原本有几件。
function ShelfRow({
  label,
  direction,
  slots,
  selected,
  hovered,
  motion,
  loot,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onBuy,
}: {
  label: string;
  direction: TabDirection;
  slots: ShopSlot[];
  selected: string | null;
  hovered: string | null;
  motion: ShelfMotion;
  loot: number;
  onSelect: (key: string) => void;
  onHoverStart: (key: string) => void;
  onHoverEnd: (key: string) => void;
  onBuy: (key: string) => void;
}) {
  const motionClass = motion === "leaving" ? s["is-leaving"] : motion === "entering" ? s["is-entering"] : undefined;

  return (
    <div className={cx(s["sx-row"], s[`is-${direction}`])}>
      <p className={s["sx-row-label"]}>{label}</p>
      {slots.length ? (
        <div className={cx(s["sx-grid"], s[`is-${direction}`], motionClass)}>
          {slots.map((slot) => (
            <div key={slot.key} className={cx(s["sx-cell"], slot.sold && s["is-sold"])}>
              <ShopItemTile
                stack={asStack(slot)}
                selected={selected === slot.key}
                hovered={hovered === slot.key}
                sold={slot.sold}
                onClick={() => onSelect(slot.key)}
                onPointerEnter={() => onHoverStart(slot.key)}
                onPointerLeave={() => onHoverEnd(slot.key)}
                onFocus={() => onHoverStart(slot.key)}
                onBlur={() => onHoverEnd(slot.key)}
              />
              <ShelfPriceTag slot={slot} affordable={loot >= slot.price} onBuy={onBuy} />
            </div>
          ))}
        </div>
      ) : (
        <p className={s["sx-empty"]}>这一档今天没有进货。</p>
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
      className={cx(s["sx-control"], s["sx-price"], s[`is-${state}`])}
      type="button"
      disabled={slot.sold || !affordable}
      onClick={() => onBuy(slot.key)}
      aria-label={`${label}，售价 ${slot.price} 居民积分`}
      title={label}
    >
      {slot.sold ? <span className={s["sx-price-sold"]}>已售出</span> : <strong>{slot.price}</strong>}
    </button>
  );
}

// ===================== 常驻面板: 补给货架 =====================
function ShelfPanel({
  shop,
  loot,
  day,
  tab,
  tabDirection,
  refreshCost,
  onBuy,
  onRefresh,
}: {
  shop: { equip: ShopSlot[]; material: ShopSlot[]; refreshes: number };
  loot: number;
  day: number;
  /** 当前品类。★ 由 ShopScene 持有 —— 切换控件在面板外面(见 ShelfTabRail)。 */
  tab: ShopTab;
  tabDirection: TabDirection;
  refreshCost: number;
  onBuy: (key: string) => void;
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const visibleSlots = tab === "equipment" ? shop.equip : shop.material;
  const shelfKey = `${tab}-${day}-${shop.refreshes}`;
  const initialShelf: ShelfSnapshot = { key: shelfKey, tab, slots: visibleSlots };
  const [shelfMotion, setShelfMotion] = useState<ShelfMotion>("entering");
  const [shelf, setShelf] = useState<ShelfSnapshot>(initialShelf);
  const activeShelfRef = useRef<ShelfSnapshot>(initialShelf);
  const pendingShelfRef = useRef<ShelfSnapshot>(initialShelf);
  const transitionRef = useRef(false);
  const initialEnterTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const selectedSlot = visibleSlots.find((s) => s.key === selected) ?? null;
  const hoveredSlot = visibleSlots.find((s) => s.key === hovered) ?? null;
  const displayedSlot = hoveredSlot ?? selectedSlot;

  useEffect(() => {
    initialEnterTimerRef.current = window.setTimeout(() => {
      initialEnterTimerRef.current = null;
      setShelfMotion("idle");
    }, shelfMotionDuration(SHELF_ENTER_MS));

    return () => {
      if (initialEnterTimerRef.current !== null) {
        window.clearTimeout(initialEnterTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextShelf: ShelfSnapshot = { key: shelfKey, tab, slots: visibleSlots };
    pendingShelfRef.current = nextShelf;

    if (nextShelf.key === activeShelfRef.current.key) {
      activeShelfRef.current = nextShelf;
      setShelf(nextShelf);
      return;
    }

    if (initialEnterTimerRef.current !== null) {
      window.clearTimeout(initialEnterTimerRef.current);
      initialEnterTimerRef.current = null;
    }

    if (transitionRef.current) return;

    transitionRef.current = true;
    setShelfMotion("leaving");
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      const incomingShelf = pendingShelfRef.current;
      activeShelfRef.current = incomingShelf;
      setShelf(incomingShelf);
      setShelfMotion("entering");
      enterTimerRef.current = window.setTimeout(() => {
        enterTimerRef.current = null;
        transitionRef.current = false;
        setShelfMotion("idle");
      }, shelfMotionDuration(SHELF_ENTER_MS));
    }, shelfMotionDuration(SHELF_EXIT_MS));
  }, [shelfKey, tab, visibleSlots]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current);
    };
  }, []);

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
        <div className={s["sx-readout"]} aria-label="商店状态">
          <div>
            <span>居民积分</span>
            <strong>{loot.toLocaleString()}</strong>
          </div>
        </div>
      </PanelHead>
      <div className={s["sx-body"]}>
        <div className={s["sx-main"]}>
          {/* 分类、刷新或跨日换货时先保留旧快照离场，再替换成新货架。 */}
          <ShelfRow
            key={shelf.key}
            label={shelf.tab === "equipment" ? "装备" : "材料"}
            direction={tabDirection}
            motion={shelfMotion}
            slots={shelf.slots}
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
          key={
            displayedSlot
              ? `${day}-${shop.refreshes}-${displayedSlot.key}`
              : `idle-${day}-${shop.refreshes}`
          }
          stack={displayedSlot ? asStack(displayedSlot) : null}
          placeholder="选择一件商品查看详情。今天挑剩的，明天就换新货了。"
        />
      </div>
      <div className={s["sx-foot"]}>
        {/* ★ 余额与刷新次数**只在**顶部 readout 说一次 —— 这里以前重复了一遍, 三处讲同一批
            数字, 而底栏这条最长的文字信息量最低。留下的是 readout 说不了的那件事:
            主刷新机制不在这个界面里, 免得玩家以为只能花钱换货。 */}
        <p className={s["sx-note"]}></p>
        {/* ★ 三段式(图标 / 动词 / 价格)不是装饰 —— 动词与价格必须**分列**才有层级:
            挤在同一行同字号时, "刷新货架 · 12" 读起来像一串标签而不是一颗可按的键。
            分隔竖线由 CSS ::before 画, 不进 DOM。 */}
        <button
          className={cx(s["sx-control"], s["sx-refresh"])}
          type="button"
          disabled={loot < refreshCost}
          onClick={onRefresh}
          aria-label={`刷新货架，花费 ${refreshCost} 居民积分`}
          title={loot < refreshCost ? "居民积分不足" : "刷新货架"}
        >
          <span className={s["sx-refresh-icon"]} aria-hidden="true">
            ↻
          </span>
          <span className={s["sx-refresh-label"]}>刷新货架</span>
          <span className={s["sx-refresh-cost"]}>{refreshCost}</span>
        </button>
      </div>
    </>
  );
}

export default ShopScene;
