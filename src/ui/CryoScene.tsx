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
// ★ 本设施现在**只有一个功能**: 冬眠唤醒 —— 舱位阵列, 花居民积分解封还在休眠的舱位(townStore.awaken)。
//   ⚠ 原来还有「编队」与「队员档案」两块浮层, 已经提为据点的一级全屏页
//     (ui/FormationScreen.tsx / ui/CharacterDetailScreen.tsx, 入口在大厅 bento 的「编队」砖)——
//     那两件事的信息量早就撑破 1100×640 的浮层了。冬眠仓由此退回单一职责: 只管把人弄醒。
//   ★ 结构仍保留「入口砖 → 浮层」这一层(只剩一条抽屉): 功能直接摊在场景上会把设施背景美术糊住,
//     而且再加第二个功能时不用重做骨架。
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
import { RULES } from "../engine";
import { CHARACTERS, getCharacter } from "../data";
import { useTownStore } from "../store/townStore";
import { CharacterPortrait } from "./CharacterPortrait";
import { prefersReducedMotion } from "./transitions";
import { useCountUp } from "./useCountUp";
import "./CryoScene.css";

// ===================== 常量 =====================

// 浮层滑出的时长。⚠ 这个数与 CryoScene.css 里 cryoPanelOut 的 duration 是**同一个值**,
// 改一处必须改两处 —— JS 靠它决定什么时候真正卸载面板, CSS 靠它播完滑出。
const PANEL_OUT_MS = 600;
const PANEL_OUT_REDUCED_MS = 180; // 「减少动态效果」下退化成一次短促淡出(见 CSS 末尾的降级块)

// 浮层尺寸(设计 px)。⚠ 除了给面板本体当 width/height, 还要以 CSS 变量的形式传给外层
// .cryo-modal —— 顶上那两根吊绳是 .cryo-modal 的伪元素, 靠这两个数算出「该垂到面板顶边的哪两点」
// (见 CSS 的 .cryo-modal::before / ::after)。改尺寸只改这里一处, 绳子会自己跟上。
// ★ 现在只剩唤醒一块浮层, 故不再是「浮层 id → 尺寸」的表; 将来再加浮层时改回 Record 即可。
const PANEL_SIZE = { w: 1180, h: 660 }; // 舱位是 2 列网格, 比一般列表面板宽一档

// 面板滑落到位所需的时间(= cryoPanelIn 的 600ms)。浮层内的内容从这之后才开始逐块浮现,
// 读作「面板落定 → 数据接通」。⚠ 这个数只用来算 CSS 里的 animation-delay 起点, 与
// PANEL_OUT_MS 无关 —— 那个是卸载时机, 改错会让面板提前消失。
const CONTENT_DELAY_MS = 560;
// 相邻两块内容之间的错峰间隔。⚠ 与 CryoScene.css 里 cryoContentIn 的 animation-delay 算式
// (var(--i) * 55ms)是同一个数, 改一处要改两处 —— JS 只有数值滚动的起跑时间要跟它对齐。
const STAGGER_MS = 55;

// 舱位阵列的格数(只在「冬眠唤醒」浮层里用)。已解封 + 休眠中的角色依次占位, 剩下的补成
// 「无信号」空舱 —— 空舱不是错误状态, 是「这排舱位本来就有这么多, 只是没人」的场景表达。
// ★ 角色多到超过这个数时列表照样能滚, 这里只是**至少**画几格。
const POD_SLOTS = 6;

// 密封舱详情的装饰读数。⚠ 纯文案, 不接任何数据 —— 休眠体在解封前本来就「身份未解析」。
// ★ num 的那两项会走 useCountUp 滚一遍(选中另一个舱位时重滚), 读起来像仪表在重新采样;
//   「标称 / 充足」这种非数值项没有 num, 直接原样出。
const VITALS: { label: string; num?: number; decimals?: number; unit?: string; text?: string }[] = [
  { label: "舱内温度", num: -196.4, decimals: 1, unit: "°C" },
  { label: "代谢速率", num: 0.3, decimals: 1, unit: "%" },
  { label: "舱压", text: "标称" },
  { label: "维生余量", text: "充足" },
];

// ===================== 图标 =====================
// 画法与大厅设施图标 / 控制终端图标统一: 48×48 视框、stroke="currentColor"、
// 外轮廓 strokeWidth 1.2 + opacity .38 当陪衬、主体 1.6。刻意不用 emoji。

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

// ===================== 氛围层 =====================

// 浮层背板上的常驻冷冻氛围: 冷凝雾(两团缓慢漂移的紫雾) + 扫描线 + 霜花微粒。
// ⚠ 它是 .cryo-panel 的**第一个子节点**, 不是祖先 —— 面板自己的 backdrop-filter 不受影响,
//   而这一层挂动画也不会把任何人变成 backdrop root(本文件反复在防的那条约束)。
// ⚠ 全部动画只动 transform, 透明度写死在各层背景色里 —— 项目对"闪烁型明暗变化"是禁止的
//   (RouteBoard 立的规矩), 呼吸式明暗在六格并排时会糊成一片闪。
// ★ 刻意不用 Canvas: ui/AmbienceLayer.tsx 那套是战斗场景的重型方案(双 canvas + rAF),
//   浮层里几团渐变 + 8 个光点用纯 CSS 就够, 也不必跟着面板开合去起停 rAF。
const MOTE_COUNT = 8;

function CryoAmbience() {
  return (
    <div className="cryo-ambience" aria-hidden>
      <span className="cryo-fog cryo-fog-a" />
      <span className="cryo-fog cryo-fog-b" />
      <span className="cryo-scanlines" />
      <span className="cryo-motes">
        {Array.from({ length: MOTE_COUNT }, (_, i) => (
          // --i 派生出各自的横向位置 / 大小 / 时长 / 延迟(算式在 CSS 里), 免得在 TSX 里
          // 撒一堆 magic number, 也免得每次渲染都重新随机(那会让微粒在重渲染时集体跳位)。
          <span key={i} className="cryo-mote" style={{ "--i": i } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}

// 错峰入场的序号。CSS 用 --i 算 animation-delay, 这里只负责把序号递给样式层。
const stagger = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

// ===================== 类型 =====================

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
  const awakened = useTownStore((s) => s.awakened);
  const loot = useTownStore((s) => s.loot);
  const awaken = useTownStore((s) => s.awaken);

  const [panel, setPanel] = useState(false); // 唤醒浮层开着没
  // 关窗**不能**直接卸载: 那样滑出动画根本没机会播(元素当场消失)。故先进 closing 态让 CSS 播滑出,
  // 播完再真的把面板卸载 —— 与 TownScreen 的 leaving 阶段是同一套「留到演出走完才卸载」的做法。
  const [closing, setClosing] = useState(false);
  const [podSlot, setPodSlot] = useState(0); // 唤醒浮层选中的舱位

  // 所有关窗路径(✕ / 点面板外空白 / Esc)都走这里, 保证一定播完滑出。
  // 滑出途中重复调用是安全的: 置同一个 true 不会触发重渲染, 下面的计时器也就不会被重置。
  const closePanel = useCallback(() => setClosing(true), []);

  // 滑出播完 → 真正卸载。⚠ 计时器挂在 effect 里而不是裸 setTimeout: 返回据点时本组件会被卸载,
  // 清理函数顺手把它清掉, 不会有卸载后 setState。
  useEffect(() => {
    if (!closing) return;
    const ms = prefersReducedMotion() ? PANEL_OUT_REDUCED_MS : PANEL_OUT_MS;
    const id = window.setTimeout(() => {
      setPanel(false);
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

      {/* ---- 右上: 两枚读数 chip ----
          ⚠ 原来还有一枚「上阵 n/N」—— 编队搬去全屏页后它在这里已无处可点, 留着只会让人
            以为冬眠仓还能编队, 故一并撤掉。 */}
      <div className="cryo-readout" style={{ right: "56px", top: "42px" }}>
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
          ★ 贴画布右缘(right:0): 常态这条砖大部分被推出画布, 超出的部分由 .town-splash 的
            overflow:hidden 裁掉; 鼠标悬浮时向左弹出完整宽度。
            这样设施背景美术(舱体阵列 / 冷凝管线)一个都不遮。
          ★ 只剩一条入口后 top 从 138 下移到 300, 让它落在画面竖向的中段 ——
            贴着读数 chip 挂一条孤零零的砖, 右上角会显得头重脚轻。 */}
      <div
        className="cryo-entries"
        style={
          {
            right: "0px", // ← 贴画布右缘: 抽屉收起时超出的部分被画布裁掉
            top: "300px", // ← 竖向中段
            width: "460px", // ← 完全弹出时的条宽
            gap: "10px", // ← 砖块之间的缝(只剩一条时无实际作用, 留着备用)
            gridTemplateRows: "88px", // ← 每条砖的高
            // ★ 本处唯一需要手调的旋钮: 收起时露在画布内的宽度。
            "--peek": "260px",
          } as CSSProperties
        }
      >
        <EntryTile
          icon={<AwakenIcon />}
          name="冬眠唤醒"
          desc={sealedCount > 0 ? `${sealedCount} 具休眠体待解封` : "无休眠体信号"}
          onClick={() => setPanel(true)}
        />
      </div>

      {/* ---- 浮层 ----
          ★ **没有全局遮罩**: 冬眠仓.png 是一张紫粉白的浅色场景, 压暗它换对比度会毁掉这张图的气质。
            面板本体是白紫毛玻璃, 靠模糊 + 重投影从场景里托起来(见 CSS 的 .cryo-panel)。
          外层 .cryo-modal 仍是一整层(只是完全透明): 点它关窗, 同时天然挡住底下的「返回据点」
          与抽屉 —— 不需要额外的禁用逻辑。⚠ 代价是那个按钮不再变暗, 看起来仍可点。
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
              "--panel-w": `${PANEL_SIZE.w}px`,
              "--panel-h": `${PANEL_SIZE.h}px`,
            } as CSSProperties
          }
        >
          {/* 点面板本体不该关窗, 故在这里截断冒泡 */}
          <section
            className="cryo-panel"
            onClick={(e) => e.stopPropagation()}
            style={
              {
                // 面板只给宽高(设计 px), 居中交给 .cryo-modal 的 flex —— 换尺寸不用回头算坐标。
                width: `${PANEL_SIZE.w}px`,
                height: `${PANEL_SIZE.h}px`,
                // 面板内所有错峰入场的公共起点(见 CSS 的 cryoContentIn)
                "--content-delay": `${CONTENT_DELAY_MS}ms`,
              } as CSSProperties
            }
          >
            {/* 常驻冷冻氛围。⚠ 必须是第一个子节点: 面板其余内容靠 CSS 抬到 z-index:1 压在它上面 */}
            <CryoAmbience />

            <AwakenPanel
              awakened={awakened}
              loot={loot}
              slot={podSlot}
              onSelect={setPodSlot}
              onAwaken={awaken}
              onClose={closePanel}
            />
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

      <div className="cryo-awaken-body" style={{ gridTemplateColumns: "440px 1fr" }}>
        {/* 舱位阵列: 2 列网格的**竖向舱体**(编号刻线 → 取景窗 → 状态灯 + 文案),
            比原来的横条更像"一排冬眠舱"。列数在 CSS 里, 不是旋钮。 */}
        <div className="cryo-rack">
          {pods.map((pod, i) => (
            <PodCard
              key={pod.kind === "empty" ? `empty-${i}` : pod.charId}
              pod={pod}
              index={i}
              selected={i === slot}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>

        {/* ★ key 换舱位就整块重挂: 右栏要跟着重播一次入场(与档案页换人同一套做法)。 */}
        <div className="cryo-pod-detail" key={slot}>
          {active?.kind === "sealed" ? (
            <>
              <div className="cryo-sealed-figure" aria-hidden>
                {/* 缓慢旋转的扫描环: 读作"仪器还在持续采样这具休眠体" */}
                <span className="cryo-scan-ring" />
                <SealedIcon />
              </div>
              <span className="cryo-kicker">DORMANT / {active.charId.toUpperCase()}</span>
              <h4 className="cryo-detail-name">休眠体 · 身份未解析</h4>
              <p className="cryo-sealed-desc">
                舱盖仍处于密封状态。解封前无法读取该冬眠体的档案 —— 只知道生命体征仍在。
              </p>
              <div className="cryo-vitals">
                {VITALS.map((v, i) => (
                  <VitalCell key={v.label} vital={v} index={i} />
                ))}
              </div>
            </>
          ) : active?.kind === "awake" ? (
            <>
              <div className="cryo-awake-figure cryo-vitrine">
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

// 一格舱位(竖向舱体卡)。三种状态共用一个外壳, 靠 is-* 类切视觉。
// 空舱也是 button 而**不是 div**: 它可选中、右栏会给出说明, 做成死块反而让人以为界面坏了。
// 结构: 舱盖灯带 + 编号刻线 → 取景窗(立绘/图标) → 状态灯 + 两行文案; 四角括号只在选中时张开。
function PodCard({
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
    <button className={cls} type="button" style={stagger(index)} onClick={onSelect}>
      <span className="cryo-pod-lid" aria-hidden />
      <span className="cryo-pod-frost" aria-hidden />
      <span className="cryo-pod-brackets" aria-hidden />
      <span className="cryo-pod-no">POD-{String(index + 1).padStart(2, "0")}</span>

      {pod.kind === "awake" ? (
        <>
          <span className="cryo-pod-figure cryo-vitrine">
            <CharacterPortrait
              characterId={pod.charId}
              emoji={getCharacter(pod.charId).emoji}
              alt={getCharacter(pod.charId).name}
              className="cryo-portrait"
            />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name">{getCharacter(pod.charId).name}</span>
            <span className="cryo-slot-meta">
              <i className="cryo-pod-led" aria-hidden />
              已解封
            </span>
          </span>
        </>
      ) : pod.kind === "sealed" ? (
        <>
          <span className="cryo-pod-figure cryo-pod-icon">
            <SealedIcon />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name">休眠体</span>
            <span className="cryo-slot-meta">
              <i className="cryo-pod-led" aria-hidden />
              密封 · 体征稳定
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="cryo-pod-figure cryo-pod-icon">
            <NoSignalIcon />
          </span>
          <span className="cryo-pod-text">
            <span className="cryo-slot-name is-mono">NO SIGNAL</span>
            <span className="cryo-slot-meta">
              <i className="cryo-pod-led" aria-hidden />
              空舱
            </span>
          </span>
        </>
      )}
    </button>
  );
}

// 一格装饰读数。数值项滚一遍(换舱位时右栏整块重挂 ⇒ 重滚), 文字项原样出。
function VitalCell({
  vital,
  index,
}: {
  vital: (typeof VITALS)[number];
  index: number;
}) {
  const shown = useCountUp(
    vital.num ?? 0,
    CONTENT_DELAY_MS + index * STAGGER_MS,
    460,
    vital.decimals ?? 0,
  );
  return (
    <div className="cryo-vital" style={stagger(index)}>
      <span className="cryo-attr-label">{vital.label}</span>
      <strong className="cryo-vital-value">
        {vital.num === undefined
          ? vital.text
          : `${shown.toFixed(vital.decimals ?? 0)} ${vital.unit ?? ""}`.trim()}
      </strong>
    </div>
  );
}
