// 物资中转仓(据点设施 storage)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 设定依据: 游戏设定.md 第四节据点设施表「物资中转仓 | 背包与库存管理」+ 探索模式设计.md §六。
//
// 与冬眠仓(ui/CryoScene.tsx)/ 控制终端(ui/ControlTerminalScene.tsx)**逐层同构** ——
//   场景常驻的只有「左上标题 + 右上读数 + 右侧一列抽屉式入口」, 点入口才弹浮层;
//   浮层无全局遮罩, 从画布上方连绳带板滑下。
//   ⚠ 不要把功能内容直接摊在场景上 —— 那样一进设施就被一整块面板糊住, 设施背景美术等于白画。
//
// 三条抽屉 = 三个功能:
//   ① 库存清单 —— **无上限**的物品列表(与探索背包的 24 格形成对照) + 同一套分类 tab + 丢弃。
//   ② 装备     —— 三装备槽穿戴/拆卸(《物品设计.md》第二章), 实时预览 16 项面板的变化。
//   ③ 回收台   —— 废料按 sellValue 批量出售换居民积分(设计文档 §6.1: 废料必须带回来卖)。
//
// 与冬眠仓的差别只有**色相**: 那边是浅色场景配深紫罗兰, 这边的背景(暂用 16:9 场景占位素材)按暗色场景处理,
// 故走**暗玻璃**配方 + 琥珀/铁锈橙强调色(--stor-*)。
//
// ⚠ 本组件的根节点 .stor-scene **永远不能挂 animation / opacity / transform**:
//   一旦祖先成为 backdrop root, 底下玻璃砖的 backdrop-filter 就取不到设施背景。
//   入场/退场动画一律挂叶子元素(与 CryoScene 同一条约束)。

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BOND_DEFS, activeBonds, getCharacter, getItemDef, nextTier } from "@/data";
import { STAT_KEYS, type StatBlock } from "@/engine";
import { occupiedSlots, sortStacks } from "@/items/inventory";
import { RARITY_ORDER, SLOT_LABEL, type EquipSlot, type ItemStack } from "@/items/types";
import { bondCountsOf, deriveStats, EQUIP_SLOTS, useTownStore } from "@/store/townStore";
import type { CharacterState } from "@/store/townStore";
import { BondIcon } from "@/ui/common/BondIcon";
import ItemDetail from "@/ui/common/item/ItemDetail";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTabs from "@/ui/common/item/ItemTabs";
import { matchTab, type EquipTab, type ItemTab } from "@/ui/common/item/itemFilters";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { cx } from "@/ui/common/cx";
import s from "./StorageScene.module.css";

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

// ⚠ 与 StorageScene.css 里 storPanelOut 的 duration 是**同一个值**, 改一处必须改两处 ——
//   JS 靠它决定什么时候真正卸载面板, CSS 靠它播完滑出。同 CryoScene 的 PANEL_OUT_MS。
const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180;

type PanelId = "inventory" | "gear" | "recycle";

// 三块浮层各自的尺寸(设计 px)。还要以 CSS 变量传给 .stor-modal —— 顶上两根吊绳靠它定位。
const PANEL_SIZE: Record<PanelId, { w: number; h: number }> = {
  inventory: { w: 1180, h: 660 },
  gear: { w: 1280, h: 690 },
  recycle: { w: 1040, h: 620 },
};

// 面板落定后内容才开始逐块浮现(= storPanelIn 的 600ms)。同 CryoScene 的 CONTENT_DELAY_MS。
const CONTENT_DELAY_MS = 560;

// 属性中文名。⚠ 与 CryoScene 的队员档案、ItemDetail 是同一套口径, 改名要一起改。
const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  maxHp: "生命",
  attack: "攻击力",
  healPower: "治愈力",
  defense: "防御力",
  hitRate: "命中率",
  dodgeRate: "闪避率",
  critRate: "暴击率",
  critDamage: "爆伤",
  precision: "精准",
  initiative: "先手",
  blockRate: "格挡",
  healBoost: "治愈强度",
  shieldBoost: "护盾强度",
  ailmentResist: "异常抗性",
  burdenAdapt: "负重适应",
  handLimit: "手牌上限",
  drawCount: "抽牌数",
};

const rarityRank = (r: string) => RARITY_ORDER.indexOf(r as never);

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

export function StorageScene({ leaving = false }: Props) {
  const storage = useTownStore((s) => s.storage);
  const loot = useTownStore((s) => s.loot);
  const characters = useTownStore((s) => s.characters);
  const awakened = useTownStore((s) => s.awakened);
  const party = useTownStore((s) => s.party); // 羁绊只统计上阵队伍的装备槽
  const discardStored = useTownStore((s) => s.discardStored);
  const sellItem = useTownStore((s) => s.sellItem);
  const equipItem = useTownStore((s) => s.equipItem);
  const unequipItem = useTownStore((s) => s.unequipItem);

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
  const gearCount = storage.filter((s) => getItemDef(s.itemId).category === "equipment").length;

  return (
    <div className={cn("stor-scene", leaving && "is-leaving")}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className={cn("stor-header")} style={{ left: "56px", top: "42px" }}>
        <span className={cn("stor-kicker")}>SUPPLY DEPOT</span>
        <h2 className={cn("stor-title")}>物资中转仓</h2>
        <p className={cn("stor-sub")}>库存管理 · 装备调配 · 废料回收</p>
      </header>

      {/* ---- 右上: 三枚读数 chip ---- */}
      <div className={cn("stor-readout")} style={{ right: "56px", top: "42px" }}>
        <div className={cn("stor-chip")}>
          <span className={cn("stor-chip-label")}>库存</span>
          {/* 仓库不设上限, 所以只报件数与占格, 不报「x / 上限」 */}
          <strong className={cn("stor-chip-value")}>{storage.length}</strong>
          <span className={cn("stor-chip-note")}>{occupiedSlots(storage, getItemDef)} 格</span>
        </div>
        <div className={cn("stor-chip")}>
          <span className={cn("stor-chip-label")}>装备</span>
          <strong className={cn("stor-chip-value")}>{gearCount}</strong>
        </div>
        <div className={cn("stor-chip")}>
          <span className={cn("stor-chip-label")}>居民积分</span>
          <strong className={cn("stor-chip-value")}>{loot.toLocaleString()}</strong>
        </div>
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
            gap: "10px",
            gridTemplateRows: "88px 88px 88px",
            "--peek": "252px", // 收起时露在画布内的宽度(说明文字比冬眠仓短一档)
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
          icon={<GearIcon />}
          name="装备"
          desc={gearCount ? `${gearCount} 件可调配` : "无可用装备"}
          onClick={() => setPanel("gear")}
        />
        <EntryTile
          icon={<RecycleIcon />}
          name="回收台"
          desc={scrapCount ? `${scrapCount} 件可出售` : "无可回收物资"}
          onClick={() => setPanel("recycle")}
        />
      </div>

      {/* ---- 浮层 ---- 无全局遮罩; 开合是连绳带板从上方滑下 / 收回(见 CSS)。
          ⚠ .stor-modal 这一层绝不能挂 opacity/filter/transform —— 它是面板的父元素,
            一旦成为 backdrop root, 面板的 backdrop-filter 就取不到场景。 */}
      {panel && (
        <div
          className={cn("stor-modal", closing && "is-closing")}
          onClick={closePanel}
          style={
            {
              "--panel-w": `${PANEL_SIZE[panel].w}px`,
              "--panel-h": `${PANEL_SIZE[panel].h}px`,
            } as CSSProperties
          }
        >
          <section
            className={cn("stor-panel")}
            onClick={(e) => e.stopPropagation()}
            style={
              {
                width: `${PANEL_SIZE[panel].w}px`,
                height: `${PANEL_SIZE[panel].h}px`,
                "--content-delay": `${CONTENT_DELAY_MS}ms`,
              } as CSSProperties
            }
          >
            {panel === "inventory" ? (
              <InventoryPanel stacks={sorted} onDiscard={discardStored} onClose={closePanel} />
            ) : panel === "gear" ? (
              <GearPanel
                stacks={sorted}
                characters={characters}
                awakened={awakened}
                party={party}
                onEquip={equipItem}
                onUnequip={unequipItem}
                onClose={closePanel}
              />
            ) : (
              <RecyclePanel stacks={sorted} loot={loot} onSell={sellItem} onClose={closePanel} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ===================== 入口砖(抽屉) =====================
// 结构与 .cryo-entry / .term-entry 逐层对齐(rim 跑光 / 图标 / 名称 / 说明 / ▸), 只有色相不同。
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

// 浮层标题栏。三个浮层共用。
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
    <div className={cn("stor-panel-head")}>
      <span className={cn("stor-kicker")}>{kicker}</span>
      <h3 className={cn("stor-panel-title")}>{title}</h3>
      <button className={cn("stor-close")} type="button" onClick={onClose} aria-label="关闭">
        ✕
      </button>
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
  onClose,
}: {
  stacks: ItemStack[];
  onDiscard: (uid: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ItemTab>("all");
  const [equipTab, setEquipTab] = useState<EquipTab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  // 换选中项时清掉确认态 —— 否则「确认丢弃」会挂在另一件东西上。
  useEffect(() => setConfirming(null), [selected]);

  const sel = stacks.find((s) => s.uid === selected) ?? null;

  return (
    <>
      <PanelHead kicker="INVENTORY" title="库存清单" onClose={onClose} />
      <div className={cn("stor-panel-body")}>
        <div className={cn("stor-col-main")}>
          <ItemTabs
            stacks={stacks}
            tab={tab}
            equipTab={equipTab}
            onTab={setTab}
            onEquipTab={setEquipTab}
          />
          <StockGrid
            stacks={stacks}
            tab={tab}
            equipTab={equipTab}
            selected={selected}
            onSelect={setSelected}
            empty="中转仓是空的 —— 从远征活着回来才会有东西进来。"
          />
        </div>
        <ItemDetail stack={sel} placeholder="仓库不设上限，带回来多少放多少。">
          {sel &&
            (confirming === sel.uid ? (
              <>
                <button
                  className={cn("stor-btn", "is-danger")}
                  type="button"
                  onClick={() => {
                    onDiscard(sel.uid);
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
      <div className={cn("stor-panel-foot")}>
        <p className={cn("stor-note")}>
          共 {stacks.length} 件 · 占 {occupiedSlots(stacks, getItemDef)} 格（仅供参考，仓库不设上限）
        </p>
      </div>
    </>
  );
}

// ===================== 浮层 ②: 装备 =====================
// 左角色名册 → 中三个槽位 → 右仓库里的可穿戴装备。
// ★ 穿在身上的装备**不占背包/仓库格** —— 它已经从 storage 移出去了(见 townStore.equipItem)。
function GearPanel({
  stacks,
  characters,
  awakened,
  party,
  onEquip,
  onUnequip,
  onClose,
}: {
  stacks: ItemStack[];
  characters: Record<string, CharacterState>;
  awakened: string[];
  party: string[];
  onEquip: (charId: string, uid: string) => void;
  onUnequip: (charId: string, slot: EquipSlot) => void;
  onClose: () => void;
}) {
  const [charId, setCharId] = useState(awakened[0] ?? "");
  const [slot, setSlot] = useState<EquipSlot>("weapon");

  // ★ 羁绊是**全队**系统, 只统计上阵队伍的 9 个槽 —— 与左边选中的是谁无关。
  const bondCounts = bondCountsOf(characters, party);

  const cs = characters[charId] ?? characters[awakened[0] ?? ""];
  const stats = cs ? deriveStats(cs) : null;

  // 该槽位能穿的装备。⚠ 只列**仓库里的** —— 穿在别人身上的要先卸下来。
  const candidates = stacks.filter((st) => {
    const d = getItemDef(st.itemId);
    return d.category === "equipment" && d.slot === slot;
  });

  return (
    <>
      <PanelHead kicker="LOADOUT" title="装备调配" onClose={onClose} />
      <div className={cn("stor-gear-body")}>
        {/* 左: 名册 */}
        <div className={cn("stor-roster")}>
          {awakened.map((id) => (
            <button
              key={id}
              type="button"
              className={cn("stor-roster-row", id === charId && "is-on")}
              onClick={() => setCharId(id)}
            >
              {getCharacter(id).name}
              {/* ★ 羁绊只算上阵角色 —— 不标出来的话, 给替补穿一堆装备却看不到羁绊涨点, 像 bug */}
              {party.includes(id) && <span className={cn("stor-roster-tag")}>上阵</span>}
            </button>
          ))}
        </div>

        {/* 中: 三个槽位 + 当前面板 */}
        <div className={cn("stor-slots")}>
          {EQUIP_SLOTS.map((s) => {
            const worn = cs?.equipped?.[s] ?? null;
            return (
              <div key={s} className={cn("stor-slot-row", s === slot && "is-on")}>
                <button
                  type="button"
                  className={cn("stor-slot-pick")}
                  onClick={() => setSlot(s)}
                  title={`调配${SLOT_LABEL[s]}`}
                >
                  <span className={cn("stor-slot-label")}>{SLOT_LABEL[s]}</span>
                  {worn ? (
                    <span className={cn("stor-slot-name", `r-${getItemDef(worn.itemId).rarity}`)}>
                      {getItemDef(worn.itemId).name}
                    </span>
                  ) : (
                    <span className={cn("stor-slot-name", "is-empty")}>空槽</span>
                  )}
                </button>
                {worn && (
                  <button
                    type="button"
                    className={cn("stor-btn", "is-mini")}
                    onClick={() => onUnequip(charId, s)}
                  >
                    卸下
                  </button>
                )}
              </div>
            );
          })}

          {stats && (
            <dl className={cn("stor-stats")}>
              {STAT_KEYS.filter((k) => STAT_LABEL[k]).map((k) => (
                <div key={k}>
                  <dt>{STAT_LABEL[k]}</dt>
                  <dd>{Math.round(stats[k] * 10) / 10}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* 右: 该槽位的候选装备 */}
        <div className={cn("stor-candidates")}>
          <span className={cn("stor-section-label")}>仓库里的{SLOT_LABEL[slot]}</span>
          {candidates.length ? (
            <div className={cn("stor-grid", "is-tight")}>
              {candidates.map((st) => (
                <div className={cn("stor-cand")} key={st.uid}>
                  <ItemSlot stack={st} />
                  <button
                    type="button"
                    className={cn("stor-btn", "is-mini", "is-primary")}
                    onClick={() => onEquip(charId, st.uid)}
                  >
                    装备
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={cn("stor-empty")}>仓库里没有可用的{SLOT_LABEL[slot]}。</p>
          )}
        </div>
      </div>
      <BondPanel counts={bondCounts} partySize={party.length} />
    </>
  );
}

// 全队羁绊进度(《羁绊设计概览.md》)。
// ⚠ 刻意**不**把羁绊加成混进上面那块 stor-stats 属性表 —— 那张表是 deriveStats 的
//   **单角色**口径(角色基础 + 该角色的装备), 羁绊却是全队的; 混在一起两个口径会打架,
//   玩家也说不清"这 +3 攻击到底是谁给的"。所以羁绊单独一块, 用文字把效果讲明白。
function BondPanel({ counts, partySize }: { counts: Record<string, number>; partySize: number }) {
  const defs = Object.values(BOND_DEFS);
  const maxSlots = partySize * EQUIP_SLOTS.length; // 上阵人数 × 3 槽
  const used = defs.reduce((s, d) => s + (counts[d.id] ?? 0), 0);
  // 已激活的档位, 按羁绊 id 索引 —— 与开战时 runStore 读的是同一个 activeBonds, 口径不会分叉。
  const tiers = new Map(activeBonds(counts).map((a) => [a.def.id, a.tier]));

  return (
    <div className={cn("stor-panel-foot", "stor-bonds")}>
      <div className={cn("stor-bonds-head")}>
        <span className={cn("stor-section-label")}>羁绊 AFFINITY</span>
        <span className={cn("stor-note")}>
          上阵队伍共 {maxSlots} 个装备槽 · 已带 {used} 条词条
        </span>
      </div>
      <div className={cn("stor-bonds-grid")}>
        {defs.map((def) => {
          const n = counts[def.id] ?? 0;
          const active = tiers.get(def.id) ?? null;
          const next = nextTier(def, n);
          return (
            <div key={def.id} className={cn("stor-bond", active && "is-on")}>
              <p className={cn("stor-bond-head")}>
                <BondIcon bondId={def.id} className={cn("stor-bond-icon")} />
                <span className={cn("stor-bond-name")}>{def.name}</span>
                <span className={cn("stor-bond-arcana")}>{def.arcana}</span>
                <span className={cn("stor-bond-count")}>
                  {n}
                  {next && <span className={cn("stor-bond-next")}> / {next.count}</span>}
                </span>
              </p>
              <p className={cn("stor-bond-effect")}>
                {active
                  ? active.desc
                  : next
                    ? `还差 ${next.count - n} 点：${next.desc}`
                    : "已达最高档"}
              </p>
            </div>
          );
        })}
      </div>
      {/* 只实装了 6 个 —— 说清楚, 别让玩家以为剩下 16 张塔罗牌是 bug */}
      <p className={cn("stor-note")}>
        当前开放 {defs.length} 种羁绊；羁绊饰品与词条重铸尚未开放。
      </p>
    </div>
  );
}

// ===================== 浮层 ③: 回收台 =====================
// 设计文档 §6.1: 探索层不产出货币, **废料必须带回据点出售**才换成居民积分。
function RecyclePanel({
  stacks,
  loot,
  onSell,
  onClose,
}: {
  stacks: ItemStack[];
  loot: number;
  onSell: (uid: string) => void;
  onClose: () => void;
}) {
  const sellable = stacks.filter((st) => getItemDef(st.itemId).sellValue);
  const [picked, setPicked] = useState<string[]>([]);

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
    <>
      <PanelHead kicker="RECLAMATION" title="回收台" onClose={onClose} />
      <div className={cn("stor-panel-body", "is-single")}>
        {sellable.length ? (
          <>
            <p className={cn("stor-note")}>
              废料在这里换成居民积分——这是探索层产出变成城镇通货的唯一途径。
            </p>
            <div className={cn("stor-grid")}>
              {sellable.map((st) => (
                <ItemSlot
                  key={st.uid}
                  stack={st}
                  selected={picked.includes(st.uid)}
                  onClick={() => toggle(st.uid)}
                />
              ))}
            </div>
          </>
        ) : (
          <p className={cn("stor-empty")}>没有可回收的物资。废料从远征里带回来。</p>
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
    </>
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

// 装备: 护板 + 短刃交叠
const GearIcon = () => (
  <svg {...iconBase}>
    <path d="M6 8 h9 l3 3 v10 l-3 3 H6 Z" />
    <path d="M23 5 l3 4 v11 l-3 3 -3 -3 V9 Z" opacity=".75" />
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
