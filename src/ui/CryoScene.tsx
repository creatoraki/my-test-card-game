// 冬眠仓(据点设施 cryo)的**设施内**界面 —— 由 TownScreen 在 phase 进到 inside 后挂载。
// 设定依据: 游戏设定.md 第一节「主角一行在 3300 年代被强制唤醒」+ 第四节据点设施表「冬眠舱 | 唤醒新队友」。
//
// 与控制终端(ui/ControlTerminalScene.tsx)**完全同构** —— 那是设施内 UI 的范本:
//   场景常驻的只有「左上标题 + 右上读数 + 右侧一列抽屉式入口」, 点入口才弹浮层,
//   具体功能全在浮层里。⚠ 不要把功能内容直接摊在场景上 —— 那样一进设施就被一整块面板糊住,
//   设施背景美术等于白画。
//   抽屉: 常态半隐在画布右缘外只露 --peek 一截, 悬浮哪条哪条向左弹出(机制见 CryoScene.css)。
//   浮层: **无全局遮罩**, 白紫毛玻璃面板 + 顶上两根吊绳, 开合是从画布上方滑下 / 收回。
//
// 三块入口砖 = 三个功能:
//   ① 编队     —— 3 个上阵槽 + 待命名册, 互相编入/撤出(上限 RULES.progression.partySize, 至少留 1 人)。
//   ② 队员档案 —— **只读**展示等级/经验/四维/个人卡组。
//      ⚠ 加点与卡组锻造刻意不放这里 —— 那两样归训练室(游戏设定.md:86-89 的设施分工)。
//   ③ 冬眠唤醒 —— 舱位阵列, 花残片解封还在休眠的舱位(townStore.awaken)。
//
// 与控制终端唯一的差别是**色相**: 那边是白底控制室的深青(--term-*), 这边是冬眠仓.png 的
// 紫粉白 —— 同一套亮玻璃配方, 强调色换成深紫罗兰 #7c4dbe(--cryo-*)。
//
// 与据点大厅同一套「1920×1080 设计画布 + 等比缩放」机制(见 ui/stage.ts):
// ★ 本文件里所有坐标/尺寸都是「设计 px」, 直接照着 1920×1080 的设计稿填数。
// ⚠ 不要在画布内写 vw/vh 或按窗口宽度的 @media —— 那会让构图随分辨率漂移。
//
// ⚠ 本组件的根节点 .cryo-scene **永远不能挂 animation / opacity / transform**: 一旦祖先成为
//   backdrop root, 底下玻璃砖的 backdrop-filter 就取不到设施背景, 会糊成一块死板。
//   故入场/退场动画一律挂在叶子元素身上(见 CSS 里 cryoRise / cryoFade 的挂法)。

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { RULES, type StatBlock } from "../engine";
import { CHARACTERS, getCharacter } from "../data";
import { deriveStats, useTownStore, type CharacterState } from "../store/townStore";
import { CardView } from "./CardView";
import { CharacterPortrait } from "./CharacterPortrait";
import { prefersReducedMotion } from "./transitions";
import "./CryoScene.css";

// ===================== 常量 =====================

// 浮层滑出的时长。⚠ 这个数与 CryoScene.css 里 cryoPanelOut 的 duration 是**同一个值**,
// 改一处必须改两处 —— JS 靠它决定什么时候真正卸载面板, CSS 靠它播完滑出。
const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180; // 「减少动态效果」下退化成一次短促淡出(见 CSS 末尾的降级块)

// 三块浮层各自的尺寸(设计 px)。⚠ 除了给面板本体当 width/height, 还要以 CSS 变量的形式传给外层
// .cryo-modal —— 顶上那两根吊绳是 .cryo-modal 的伪元素, 靠这两个数算出「该垂到面板顶边的哪两点」
// (见 CSS 的 .cryo-modal::before / ::after)。改尺寸只改这里一处, 绳子会自己跟上。
const PANEL_SIZE: Record<PanelId, { w: number; h: number }> = {
  formation: { w: 1100, h: 640 },
  dossier: { w: 1240, h: 680 },
  awaken: { w: 1100, h: 640 },
};

// 舱位阵列的格数(只在「冬眠唤醒」浮层里用)。已解封 + 休眠中的角色依次占位, 剩下的补成
// 「无信号」空舱 —— 空舱不是错误状态, 是「这排舱位本来就有这么多, 只是没人」的场景表达。
// ★ 角色多到超过这个数时列表照样能滚, 这里只是**至少**画几格。
const POD_SLOTS = 6;

// 只读面板分组。★ 角色不设等级也不加点 —— 这些数字进游戏后不会再变, 长期成长看装备与卡组。
// suffix "%" 的项在数据里存的是百分点整数(见 engine/types.StatBlock)。
const STAT_GROUPS: { title: string; rows: { key: keyof StatBlock; label: string; pct?: boolean }[] }[] =
  [
    {
      title: "生存与输出",
      rows: [
        { key: "maxHp", label: "生命" },
        { key: "attack", label: "攻击力" },
        { key: "defense", label: "防御力" },
        { key: "healPower", label: "治愈力" },
      ],
    },
    {
      title: "命中与暴击",
      rows: [
        { key: "hitRate", label: "命中率", pct: true },
        { key: "dodgeRate", label: "闪避率", pct: true },
        { key: "critRate", label: "暴击率", pct: true },
        { key: "critDamage", label: "爆伤", pct: true },
        { key: "precision", label: "精准", pct: true },
      ],
    },
    {
      title: "节奏与防护",
      rows: [
        { key: "initiative", label: "先手" },
        { key: "blockRate", label: "格挡", pct: true },
        { key: "healBoost", label: "治愈强度", pct: true },
        { key: "shieldBoost", label: "护盾强度", pct: true },
        { key: "ailmentResist", label: "异常抗性", pct: true },
      ],
    },
    {
      title: "探索与小队",
      rows: [
        { key: "burdenAdapt", label: "负重适应", pct: true },
        { key: "handLimit", label: "手牌上限" },
        { key: "drawCount", label: "抽牌数" },
      ],
    },
  ];

// 密封舱详情的装饰读数。⚠ 纯文案, 不接任何数据 —— 休眠体在解封前本来就「身份未解析」。
const VITALS = [
  { label: "舱内温度", value: "−196.4 °C" },
  { label: "代谢速率", value: "0.3 %" },
  { label: "舱压", value: "标称" },
  { label: "维生余量", value: "充足" },
];

// ===================== 图标 =====================
// 画法与大厅设施图标 / 控制终端图标统一: 48×48 视框、stroke="currentColor"、
// 外轮廓 strokeWidth 1.2 + opacity .38 当陪衬、主体 1.6。刻意不用 emoji。

// 编队: 一个居中靠前的主位 + 两侧各一个副位, 读作「三人一队的编成」。
function FormationIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* 编成框: 压低透明度当陪衬 */}
      <path d="M5 10h38v28H5z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      {/* 中间主位: 头 + 肩 */}
      <circle cx="24" cy="19" r="4" strokeWidth={1.6} />
      <path d="M18 31c0-3.6 2.7-6 6-6s6 2.4 6 6" strokeWidth={1.6} />
      {/* 两侧副位: 小一号 */}
      <circle cx="12" cy="21" r="3" strokeWidth={1.4} opacity={0.72} />
      <path d="M7.5 31c0-2.8 2-4.6 4.5-4.6s4.5 1.8 4.5 4.6" strokeWidth={1.4} opacity={0.72} />
      <circle cx="36" cy="21" r="3" strokeWidth={1.4} opacity={0.72} />
      <path d="M31.5 31c0-2.8 2-4.6 4.5-4.6s4.5 1.8 4.5 4.6" strokeWidth={1.4} opacity={0.72} />
    </svg>
  );
}

// 队员档案: 档案卡(右上折角) + 一枚人头 + 右侧几行数据。
function DossierIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M9 4h22l8 8v32H9z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <path d="M31 4v8h8" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      {/* 证件照: 头 + 肩 */}
      <circle cx="19" cy="22" r="4" strokeWidth={1.6} />
      <path d="M13 33c0-3.6 2.7-6 6-6s6 2.4 6 6" strokeWidth={1.6} />
      {/* 右侧数据行 */}
      <path d="M29 20h7M29 26h7M29 32h5" strokeWidth={1.4} opacity={0.72} />
    </svg>
  );
}

// 冬眠唤醒: 舱体 + 内部人形剪影 + 上方三段外扩的唤醒射线。
function AwakenIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M14 14h20v30H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      {/* 人形剪影: 只到胸口 —— 舱盖只露上半 */}
      <circle cx="24" cy="26" r="4.5" strokeWidth={1.6} />
      <path d="M17 40c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5" strokeWidth={1.6} />
      {/* 唤醒射线: 越往上越宽 */}
      <path d="M24 4v5" strokeWidth={1.6} />
      <path d="M15.5 6.5l2.5 4M32.5 6.5L30 10.5" strokeWidth={1.4} opacity={0.72} />
    </svg>
  );
}

// 密封舱: 舱体 + 内部人形剪影 + 一枚锁扣(浮层里的舱位与大图占位共用)。
function SealedIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M14 5h20v38H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <circle cx="24" cy="17" r="4.5" strokeWidth={1.6} />
      <path d="M17 31c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5" strokeWidth={1.6} />
      <path d="M21 38h6v4h-6z" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M22.5 38v-2a1.5 1.5 0 013 0v2" strokeWidth={1.4} />
    </svg>
  );
}

// 空舱: 断开的舱体轮廓 + 中间一条虚线。
function NoSignalIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M14 6h20v36H14z" strokeWidth={1.2} strokeLinejoin="round" opacity={0.38} />
      <path d="M10 24h28" strokeWidth={1.6} strokeDasharray="5 4" />
    </svg>
  );
}

// ===================== 类型 =====================

// 当前打开的浮层; null = 没开, 只看得到场景与三个入口。
type PanelId = "formation" | "dossier" | "awaken";

// 唤醒浮层里的三种舱位。charId 只在前两种上有 —— 空舱没有归属。
type Pod =
  | { kind: "awake"; charId: string }
  | { kind: "sealed"; charId: string }
  | { kind: "empty" };

interface Props {
  /** 返回据点的演出已开始: 内容整体淡出, 与背景交叉淡同步。 */
  leaving?: boolean;
}

// ===================== 主组件 =====================

export function CryoScene({ leaving = false }: Props) {
  const characters = useTownStore((s) => s.characters);
  const awakened = useTownStore((s) => s.awakened);
  const party = useTownStore((s) => s.party);
  const loot = useTownStore((s) => s.loot);
  const toggleParty = useTownStore((s) => s.toggleParty);
  const awaken = useTownStore((s) => s.awaken);

  const [panel, setPanel] = useState<PanelId | null>(null);
  // 关窗**不能**直接卸载: 那样滑出动画根本没机会播(元素当场消失)。故先进 closing 态让 CSS 播滑出,
  // 播完再真的把 panel 置空 —— 与 TownScreen 的 leaving 阶段是同一套「留到演出走完才卸载」的做法。
  const [closing, setClosing] = useState(false);
  // 档案浮层选中的角色 / 唤醒浮层选中的舱位。两个浮层各自记忆自己的选择。
  const [dossierId, setDossierId] = useState(awakened[0] ?? "");
  const [podSlot, setPodSlot] = useState(0);

  // 所有关窗路径(✕ / 点面板外空白 / Esc)都走这里, 保证一定播完滑出。
  // 滑出途中重复调用是安全的: 置同一个 true 不会触发重渲染, 下面的计时器也就不会被重置。
  const closePanel = useCallback(() => setClosing(true), []);

  // 滑出播完 → 真正卸载。⚠ 计时器挂在 effect 里而不是裸 setTimeout: 返回据点时本组件会被卸载,
  // 清理函数顺手把它清掉, 不会有卸载后 setState。
  useEffect(() => {
    if (!closing) return;
    const ms = prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS;
    const id = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
    }, ms);
    return () => clearTimeout(id);
  }, [closing]);

  // Esc 关浮层。只在浮层开着时挂监听, 免得白占一个全局键位(同 ControlTerminalScene)。
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  const sealedCount = CHARACTERS.length - awakened.length;

  return (
    <div className={`cryo-scene${leaving ? " is-leaving" : ""}`}>
      {/* ---- 左上: 场景标题 ---- */}
      <header className="cryo-header" style={{ left: "56px", top: "42px" }}>
        <span className="cryo-kicker">CRYOGENIC BAY</span>
        <h2 className="cryo-title">冬眠仓</h2>
        <p className="cryo-sub">队员唤醒 · 作战编成</p>
      </header>

      {/* ---- 右上: 三枚读数 chip ---- */}
      <div className="cryo-readout" style={{ right: "56px", top: "42px" }}>
        <div className="cryo-chip">
          <span className="cryo-chip-label">上阵</span>
          <strong className="cryo-chip-value">
            {party.length} / {RULES.progression.partySize}
          </strong>
        </div>
        <div className="cryo-chip">
          <span className="cryo-chip-label">已唤醒</span>
          <strong className="cryo-chip-value">{awakened.length}</strong>
        </div>
        <div className="cryo-chip">
          <span className="cryo-chip-label">残片</span>
          <strong className="cryo-chip-value">{loot.toLocaleString()}</strong>
        </div>
      </div>

      {/* ---- 右侧抽屉: 功能入口 ----
          ★ 位置/尺寸旋钮全在下面的内联 style(设计 px), 直接改数值即可 —— CSS 只负责定位与滑动机制。
          ★ 贴画布右缘(right:0)、落在右上读数 chip 下方: 常态三条砖大部分被推出画布, 超出的部分由
            .town-splash 的 overflow:hidden 裁掉; 鼠标悬浮哪一条, 哪一条向左弹出完整宽度。
            这样设施背景美术(舱体阵列 / 冷凝管线)一个都不遮。
            三块 88px + 两道 10px 缝 = 284px, 从 top:138 排到 y=422, 不会顶到画面下缘。 */}
      <div
        className="cryo-entries"
        style={
          {
            right: "0px", // ← 贴画布右缘: 抽屉收起时超出的部分被画布裁掉
            top: "138px", // ← 落在右上 .cryo-readout(top:42, 实高约 72)下方, 留 24px 呼吸
            width: "460px", // ← 完全弹出时的条宽
            gap: "10px", // ← 砖块之间的缝
            gridTemplateRows: "88px 88px 88px", // ← 每条砖的高
            // ★ 本处唯一需要手调的旋钮: 收起时露在画布内的宽度。
            //   260px 比控制终端的 248 大一档 —— 冬眠仓的说明文字更长(「查看属性与卡组 · N 人」),
            //   248 会把末尾正好卡在画布边缘上。嫌露太多就调小, 嫌读不全就调大。
            "--peek": "260px",
          } as CSSProperties
        }
      >
        <EntryTile
          icon={<FormationIcon />}
          name="编队"
          desc={`编成小队 · ${party.length}/${RULES.progression.partySize} 人`}
          onClick={() => setPanel("formation")}
        />
        <EntryTile
          icon={<DossierIcon />}
          name="队员档案"
          desc={`查看属性与卡组 · ${awakened.length} 人`}
          onClick={() => {
            // 打开前兜一下: 名单可能已经变了(比如刚唤醒完), 让选中项恒有效。
            if (!awakened.includes(dossierId)) setDossierId(awakened[0] ?? "");
            setPanel("dossier");
          }}
        />
        <EntryTile
          icon={<AwakenIcon />}
          name="冬眠唤醒"
          desc={sealedCount > 0 ? `${sealedCount} 具休眠体待解封` : "无休眠体信号"}
          onClick={() => setPanel("awaken")}
        />
      </div>

      {/* ---- 浮层 ----
          ★ **没有全局遮罩**: 冬眠仓.png 是一张紫粉白的浅色场景, 压暗它换对比度会毁掉这张图的气质。
            面板本体是白紫毛玻璃, 靠模糊 + 重投影从场景里托起来(见 CSS 的 .cryo-panel)。
          外层 .cryo-modal 仍是一整层(只是完全透明): 点它关窗, 同时天然挡住底下的「返回据点」
          与三条抽屉 —— 不需要额外的禁用逻辑。⚠ 代价是那个按钮不再变暗, 看起来仍可点。
          ★ 开合都是**从画布上方滑入 / 滑回上方**(见 CSS 的 cryoPanelIn / cryoPanelOut)。
            is-closing 只挂在 .cryo-modal 上当选择器用 —— ⚠ 这一层自己绝不能挂动画, 它是面板的
            父元素, 一旦成为 backdrop root, 面板的 backdrop-filter 就取不到场景了。 */}
      {panel && (
        <div
          className={`cryo-modal${closing ? " is-closing" : ""}`}
          onClick={closePanel}
          style={
            {
              // 只是把面板尺寸转成变量给两根吊绳定位用, 本层自己**不因此产生任何视觉**
              // —— 尤其没有 transform/opacity/filter, 那会让它变成 backdrop root。
              "--panel-w": `${PANEL_SIZE[panel].w}px`,
              "--panel-h": `${PANEL_SIZE[panel].h}px`,
            } as CSSProperties
          }
        >
          {/* 点面板本体不该关窗, 故在这里截断冒泡 */}
          <section
            className="cryo-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              // 面板只给宽高(设计 px), 居中交给 .cryo-modal 的 flex —— 换尺寸不用回头算坐标。
              width: `${PANEL_SIZE[panel].w}px`,
              height: `${PANEL_SIZE[panel].h}px`,
            }}
          >
            {panel === "formation" ? (
              <FormationPanel
                characters={characters}
                awakened={awakened}
                party={party}
                onToggle={toggleParty}
                onClose={closePanel}
              />
            ) : panel === "dossier" ? (
              <DossierPanel
                characters={characters}
                awakened={awakened}
                party={party}
                selectedId={dossierId}
                onSelect={setDossierId}
                onClose={closePanel}
              />
            ) : (
              <AwakenPanel
                awakened={awakened}
                loot={loot}
                slot={podSlot}
                onSelect={setPodSlot}
                onAwaken={awaken}
                onClose={closePanel}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ===================== 入口砖(抽屉) =====================
// 结构与 .term-entry 逐层对齐(rim 跑光 / 图标 / 名称行 / 说明 / ▸), 只有色相不同。
// ⚠ 名称外面那层 .cryo-entry-head 现在只包着一个名称 —— 留着是为了与控制终端逐层同构:
//   将来若要给某个入口加「未接入」一类的行内小标, 直接放进这一层即可(收起态右上角在画布外,
//   绝对定位的角标读不到, 小标必须与名称同行)。
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
    <button className="cryo-entry" type="button" onClick={onClick}>
      <span className="cryo-rim" aria-hidden />
      <span className="cryo-entry-icon">{icon}</span>
      <span className="cryo-entry-text">
        <span className="cryo-entry-head">
          <span className="cryo-entry-name">{name}</span>
        </span>
        <span className="cryo-entry-desc">{desc}</span>
      </span>
      <span className="cryo-entry-go" aria-hidden>
        ▸
      </span>
    </button>
  );
}

// 浮层标题栏。三个浮层共用, 免得每个都抄一遍 head + 关闭按钮。
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
    <div className="cryo-panel-head">
      <span className="cryo-kicker">{kicker}</span>
      <h3 className="cryo-panel-title">{title}</h3>
      <button className="cryo-close" type="button" onClick={onClose} aria-label="关闭">
        ✕
      </button>
    </div>
  );
}

// ===================== 浮层 ①: 编队 =====================
// 上半 = partySize 个上阵槽(所见即所得的出战阵容), 下半 = 待命名册。
// ⚠ 刻意不做成「一列名单 + 上阵/下阵开关」(那是旧 FormationScreen 的样子): 上阵人数是有上限的,
//   把槽位画出来才能一眼看出还剩几个空位。
function FormationPanel({
  characters,
  awakened,
  party,
  onToggle,
  onClose,
}: {
  characters: Record<string, CharacterState>;
  awakened: string[];
  party: string[];
  onToggle: (charId: string) => void;
  onClose: () => void;
}) {
  const size = RULES.progression.partySize;
  const slots = Array.from({ length: size }, (_, i) => party[i]);
  const bench = awakened.filter((id) => !party.includes(id));
  const full = party.length >= size;

  return (
    <>
      <PanelHead kicker="SQUAD FORMATION" title="编队 · 出战编成" onClose={onClose} />

      <div className="cryo-panel-body">
        <span className="cryo-section-label">出战槽位 · {party.length} / {size}</span>
        <div className="cryo-slots" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {slots.map((id, i) =>
            id ? (
              <div key={id} className="cryo-slot is-filled">
                <span className="cryo-slot-no">SLOT-{String(i + 1).padStart(2, "0")}</span>
                <span className="cryo-slot-figure">
                  <CharacterPortrait
                    characterId={id}
                    emoji={getCharacter(id).emoji}
                    alt={getCharacter(id).name}
                    className="cryo-bust"
                  />
                </span>
                <span className="cryo-slot-name">{getCharacter(id).name}</span>
                <span className="cryo-slot-meta">
                  {Math.round(deriveStats(characters[id]).maxHp)} HP · 卡组 Lv.
                  {characters[id].deckLevel}
                </span>
                <button
                  className="cryo-mini is-off"
                  type="button"
                  disabled={party.length <= 1}
                  title={party.length <= 1 ? "至少要保留 1 名队员上阵" : undefined}
                  onClick={() => onToggle(id)}
                >
                  撤出
                </button>
              </div>
            ) : (
              <div key={`empty-${i}`} className="cryo-slot is-vacant">
                <span className="cryo-slot-no">SLOT-{String(i + 1).padStart(2, "0")}</span>
                <span className="cryo-slot-vacant-mark" aria-hidden>
                  ＋
                </span>
                <span className="cryo-slot-meta">空槽位</span>
              </div>
            ),
          )}
        </div>

        <span className="cryo-section-label">待命 · {bench.length} 人</span>
        <div className="cryo-bench">
          {bench.length === 0 ? (
            <p className="cryo-note cryo-bench-empty">
              没有待命的队员 —— 去「冬眠唤醒」解封更多休眠体。
            </p>
          ) : (
            bench.map((id) => (
              <div key={id} className="cryo-bench-card">
                <span className="cryo-bench-figure">
                  <CharacterPortrait
                    characterId={id}
                    emoji={getCharacter(id).emoji}
                    alt={getCharacter(id).name}
                    className="cryo-portrait"
                  />
                </span>
                <span className="cryo-bench-text">
                  <span className="cryo-slot-name">{getCharacter(id).name}</span>
                  <span className="cryo-slot-meta">
                    {Math.round(deriveStats(characters[id]).maxHp)} HP · 卡组 Lv.
                    {characters[id].deckLevel}
                  </span>
                </span>
                <button
                  className="cryo-mini"
                  type="button"
                  disabled={full}
                  title={full ? `上阵人数已达上限 ${size} 人` : undefined}
                  onClick={() => onToggle(id)}
                >
                  编入
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="cryo-panel-foot">
        <p className="cryo-note">
          至少保留 1 名队员上阵；本次远征中阵亡的队员不会再出战，其个人卡组也一并退出卡组。
        </p>
      </div>
    </>
  );
}

// ===================== 浮层 ②: 队员档案 =====================
// 左名册 + 右只读详情。⚠ 全程没有任何 ＋ 按钮 —— 属性分配与卡组锻造归训练室。
function DossierPanel({
  characters,
  awakened,
  party,
  selectedId,
  onSelect,
  onClose,
}: {
  characters: Record<string, CharacterState>;
  awakened: string[];
  party: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const cs = characters[selectedId];

  return (
    <>
      <PanelHead kicker="CREW DOSSIER" title="队员档案 · 只读" onClose={onClose} />

      <div className="cryo-dossier-body" style={{ gridTemplateColumns: "320px 1fr" }}>
        <div className="cryo-roster">
          {awakened.map((id) => {
            const c = getCharacter(id);
            const s = characters[id];
            const onField = party.includes(id);
            return (
              <button
                key={id}
                className={`cryo-roster-row${id === selectedId ? " is-active" : ""}`}
                type="button"
                onClick={() => onSelect(id)}
              >
                <span className="cryo-roster-figure">
                  <CharacterPortrait
                    characterId={id}
                    emoji={c.emoji}
                    alt={c.name}
                    className="cryo-portrait"
                  />
                </span>
                <span className="cryo-roster-text">
                  <span className="cryo-slot-name">{c.name}</span>
                  <span className="cryo-slot-meta">
                    卡组 Lv.{s.deckLevel} · {s.deck.length} 张
                  </span>
                </span>
                {onField && <span className="cryo-roster-flag">ON</span>}
              </button>
            );
          })}
        </div>

        {cs ? <DossierDetail cs={cs} /> : <p className="cryo-note">没有已唤醒的队员。</p>}
      </div>

      <div className="cryo-panel-foot">
        <p className="cryo-note">卡组锻造请前往训练室 —— 冬眠仓只负责唤醒与编成。</p>
      </div>
    </>
  );
}

function DossierDetail({ cs }: { cs: CharacterState }) {
  const def = getCharacter(cs.charId);
  const stats = deriveStats(cs);

  // 面板都是绝对值(角色基础 + 装备)。百分点类补个 % 后缀, 其余取整显示。
  const fmt = (key: keyof StatBlock, pct?: boolean): string =>
    `${Math.round(stats[key])}${pct ? "%" : ""}`;

  return (
    <div className="cryo-dossier-detail">
      <div className="cryo-detail-head">
        <div className="cryo-detail-figure">
          <CharacterPortrait
            characterId={def.id}
            emoji={def.emoji}
            alt={def.name}
            className="cryo-bust"
          />
        </div>
        <div className="cryo-detail-id">
          <span className="cryo-kicker">SUBJECT / {def.id.toUpperCase()}</span>
          <h4 className="cryo-detail-name">{def.name}</h4>
          {/* ★ 没有等级。这里给的是"可用经验"(卡组锻造的燃料)与卡组的锻造进度。 */}
          <span className="cryo-detail-lv">
            可用经验 {cs.exp} · 累计 {cs.expEarned}
          </span>
          <div className="cryo-stat-groups">
            {STAT_GROUPS.map((g) => (
              <div key={g.title} className="cryo-stat-group">
                <span className="cryo-stat-group-title">{g.title}</span>
                {g.rows.map((row) => (
                  <div key={row.key} className="cryo-attr">
                    <span className="cryo-attr-label">{row.label}</span>
                    <strong className="cryo-attr-value">{fmt(row.key, row.pct)}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="cryo-note">
            卡组 Lv.{cs.deckLevel} · 最小卡组下限 {cs.minDeckSize} 张
          </p>
        </div>
      </div>

      <div className="cryo-deck">
        <span className="cryo-section-label">个人卡组 · {cs.deck.length} 张</span>
        <div className="cryo-deck-grid">
          {cs.deck.map((card) => (
            <CardView key={card.uid} card={card} playable selected={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== 浮层 ③: 冬眠唤醒 =====================
// 左舱位阵列 + 右舱位详情。已解封的舱位也列出来(灰化标「已解封」)——
// 这排舱位是同一批冬眠的人, 少列几个反而看不出「谁已经醒了」。
function AwakenPanel({
  awakened,
  loot,
  slot,
  onSelect,
  onAwaken,
  onClose,
}: {
  awakened: string[];
  loot: number;
  slot: number;
  onSelect: (i: number) => void;
  onAwaken: (charId: string) => void;
  onClose: () => void;
}) {
  // 舱位顺序: 已解封(按唤醒先后) → 休眠中(按 CHARACTERS 定义序) → 空舱补齐。
  // 唤醒一个人时它会从下半段挪到上半段, 顺序稳定、不会跳来跳去。
  const pods = useMemo<Pod[]>(() => {
    const awake: Pod[] = awakened.map((id) => ({ kind: "awake", charId: id }));
    const sealed: Pod[] = CHARACTERS.filter((c) => !awakened.includes(c.id)).map((c) => ({
      kind: "sealed",
      charId: c.id,
    }));
    const filled = [...awake, ...sealed];
    const empties: Pod[] = Array.from({ length: Math.max(0, POD_SLOTS - filled.length) }, () => ({
      kind: "empty",
    }));
    return [...filled, ...empties];
  }, [awakened]);

  const active = pods[slot] ?? pods[0];
  const cost = RULES.progression.awakenCost;
  const affordable = loot >= cost;
  const canAwaken = active?.kind === "sealed" && affordable;

  return (
    <>
      <PanelHead kicker="CRYO POD ARRAY" title="冬眠唤醒 · 舱位解封" onClose={onClose} />

      <div className="cryo-awaken-body" style={{ gridTemplateColumns: "340px 1fr" }}>
        <div className="cryo-rack">
          {pods.map((pod, i) => (
            <PodRow
              key={pod.kind === "empty" ? `empty-${i}` : pod.charId}
              pod={pod}
              index={i}
              selected={i === slot}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>

        <div className="cryo-pod-detail">
          {active?.kind === "sealed" ? (
            <>
              <div className="cryo-sealed-figure" aria-hidden>
                <SealedIcon />
              </div>
              <span className="cryo-kicker">DORMANT / {active.charId.toUpperCase()}</span>
              <h4 className="cryo-detail-name">休眠体 · 身份未解析</h4>
              <p className="cryo-sealed-desc">
                舱盖仍处于密封状态。解封前无法读取该冬眠体的档案 —— 只知道生命体征仍在。
              </p>
              <div className="cryo-vitals">
                {VITALS.map((v) => (
                  <div key={v.label} className="cryo-vital">
                    <span className="cryo-attr-label">{v.label}</span>
                    <strong className="cryo-vital-value">{v.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : active?.kind === "awake" ? (
            <>
              <div className="cryo-awake-figure">
                <CharacterPortrait
                  characterId={active.charId}
                  emoji={getCharacter(active.charId).emoji}
                  alt={getCharacter(active.charId).name}
                  className="cryo-bust"
                />
              </div>
              <span className="cryo-kicker">RELEASED</span>
              <h4 className="cryo-detail-name">{getCharacter(active.charId).name}</h4>
              <p className="cryo-sealed-desc">
                该舱位已解封。档案与卡组请去「队员档案」查看，出战编成去「编队」。
              </p>
            </>
          ) : (
            <>
              <div className="cryo-empty-figure" aria-hidden>
                <NoSignalIcon />
              </div>
              <span className="cryo-kicker">NO SIGNAL</span>
              <p className="cryo-sealed-desc">此舱位没有冬眠体信号。</p>
            </>
          )}
        </div>
      </div>

      <div className="cryo-panel-foot">
        <p className="cryo-note">
          {active?.kind !== "sealed"
            ? "选中一个密封舱位才能解封。"
            : affordable
              ? "解封后该队员进入待命，不会自动上阵 —— 需要去「编队」编入小队。"
              : `残片不足 —— 还差 ${(cost - loot).toLocaleString()} 才够解封。`}
        </p>
        <button
          className="cryo-primary"
          type="button"
          disabled={!canAwaken}
          onClick={() => active?.kind === "sealed" && onAwaken(active.charId)}
        >
          解封唤醒 −{cost} 残片
        </button>
      </div>
    </>
  );
}

// 一格舱位。三种状态共用一个外壳, 靠 is-* 类切视觉。空舱也是 button 而**不是 div**:
// 它可选中、右栏会给出说明, 做成死块反而让人以为界面坏了。
function PodRow({
  pod,
  index,
  selected,
  onSelect,
}: {
  pod: Pod;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const cls = ["cryo-pod", `is-${pod.kind}`, selected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} type="button" onClick={onSelect}>
      <span className="cryo-pod-frost" aria-hidden />
      <span className="cryo-pod-no">POD-{String(index + 1).padStart(2, "0")}</span>

      {pod.kind === "awake" ? (
        <>
          <span className="cryo-pod-figure">
            <CharacterPortrait
              characterId={pod.charId}
              emoji={getCharacter(pod.charId).emoji}
              alt={getCharacter(pod.charId).name}
              className="cryo-portrait"
            />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name">{getCharacter(pod.charId).name}</span>
            <span className="cryo-slot-meta">已解封</span>
          </span>
        </>
      ) : pod.kind === "sealed" ? (
        <>
          <span className="cryo-pod-figure cryo-pod-icon">
            <SealedIcon />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name">休眠体</span>
            <span className="cryo-slot-meta">密封 · 生命体征稳定</span>
          </span>
        </>
      ) : (
        <>
          <span className="cryo-pod-figure cryo-pod-icon">
            <NoSignalIcon />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name is-mono">NO SIGNAL</span>
            <span className="cryo-slot-meta">空舱</span>
          </span>
        </>
      )}
    </button>
  );
}
