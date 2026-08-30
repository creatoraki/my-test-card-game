// ============================================================================
// 场景过场动效预设表(纯 UI 表现层)。
// 与 animations.ts 同一套哲学: 时长常量的唯一真相在 TS, 视觉在 app/ScreenTransition/ScreenTransition.module.css;
// JS 只负责挂载/卸载与时序编排, 不引入任何动画库。
//
// 一次切换 = 旧界面出场(exit) → 黑场停顿(hold) → 新界面入场(enter), 串行执行。
// 出场与入场各自独立可配, 见 TransitionSpec。
//
// ★ 例外: 标了 viewTransition 的路线走**原生 View Transitions API**, 不适用上面这条模型 ——
//   没有 exit/hold/enter 三段, 也没有任何 JS 定时器(收尾靠 transition.finished)。
//   那类路线的**时长与画面一律在 CSS 里**(app/viewTransition.global.css), "时长唯一真相在 TS"
//   这条规矩对它们不成立: 动的是 ::view-transition-* 伪元素, TS 根本够不着。
// ============================================================================

import type { Screen } from "@/store/runStore";

// 总开关: 置 false 即彻底关闭过场, 退回瞬移式切换。
export const TRANSITIONS_ENABLED = true;

// 单个出/入场特效。name 对应 app/ScreenTransition/ScreenTransition.module.css 里的 .screen-fx-<name>,
// ms 同时用于内联 animationDuration 与 JS 定时 —— 单一真相, 不会两头对不上。
export interface ScreenFx {
  name: string;
  ms: number;
}

export interface TransitionSpec {
  exit: ScreenFx; // 旧界面出场
  enter: ScreenFx; // 新界面入场
  hold: number; // ms: 出场结束到入场开始之间的黑场停顿
  curtain?: string; // 可选全屏幕布层特效名 → .screen-curtain.curtain-<name>
  /**
   * 走原生 View Transitions API(document.startViewTransition)。
   * ⚠ 置 true 后 exit/enter/hold 全部**不生效** —— 界面交换是一次原子提交, 中间没有三段式,
   *   动画由 app/viewTransition.global.css 里的 ::view-transition-* 规则负责。
   * 用于「共享元素」型过场: 两页各自给对应元素挂同名 view-transition-name, 浏览器自动配对形变。
   */
  viewTransition?: boolean;
}

// 探索 → 战斗专用演出严格分三段：场景玻璃受击 → 裂纹停留 → 黑色涟漪吞没旧场景。
// 旧路线图由 View Transition 快照承担玻璃主体，BattleTransitionCurtain 负责表面裂痕与冲击反馈。
export const BATTLE_CRACK_DRAW_MS = 1000;
export const BATTLE_CRACK_HOLD_MS = 500;
export const BATTLE_SHATTER_SFX_MS = 2900;
export const BATTLE_RIPPLE_START_MS = BATTLE_CRACK_DRAW_MS + BATTLE_CRACK_HOLD_MS;
export const BATTLE_RIPPLE_MS = BATTLE_SHATTER_SFX_MS - BATTLE_RIPPLE_START_MS;
export const BATTLE_RIPPLE_EXIT_MS = BATTLE_SHATTER_SFX_MS;

// ── 可用特效登记处 ──
// 新增一种特效 = 这里加一项 + app/ScreenTransition/ScreenTransition.module.css 加一段同名 keyframes。
//
// ⚠ transform 类特效(zoomIn/slideUp)慎用在 battle 的入场上: BattleScreen 的
// computeCamera 靠 getBoundingClientRect() 算相机仿射变换, 要求测量时祖先链上无
// transform(见 BattleScreen.tsx 里的测量约束注释)。过场包裹层正是 battle 的祖先,
// 故默认动效刻意只用 opacity —— 它不影响 getBoundingClientRect。
export const FX = {
  none: { name: "none", ms: 0 },
  fadeOut: { name: "fade-out", ms: 240 },
  fadeIn: { name: "fade-in", ms: 240 },
  endSettleOut: { name: "end-settle-out", ms: 720 },
  endSettleIn: { name: "end-settle-in", ms: 780 },
  zoomIn: { name: "zoom-in", ms: 280 },
  zoomOut: { name: "zoom-out", ms: 220 },
  slideUp: { name: "slide-up", ms: 280 },
  // 只出时长、不出画面的档位(CSS 里 .screen-fx-stay 是个刻意的空规则): 探索→战斗那条路线
  // 要让包裹层原样停在屏幕上, 由 BattleTransitionCurtain 在它**之上**演裂纹, 包裹层一淡出
  // 裂纹底下的探索画面就跟着没了。
  battleRippleOut: { name: "stay", ms: BATTLE_RIPPLE_EXIT_MS },
} as const satisfies Record<string, ScreenFx>;

// 全局默认: 淡出 → 短暂黑场 → 淡入。
// 这里的"黑场"不需要幕布层 —— 旧界面淡到 opacity 0 后露出的就是页面本身的深色底。
export const DEFAULT_TRANSITION: TransitionSpec = {
  exit: FX.fadeOut,
  enter: FX.fadeIn,
  hold: 60,
};

// ── 按界面配置(第二优先级) ──
// 某个界面无论从哪来/往哪去, 都用自己声明的出场或入场。
// 例: battle: { enter: FX.zoomIn } —— 但见上文对 transform 类特效的警告。
export const SCREEN_FX: Partial<Record<Screen, Partial<TransitionSpec>>> = {};

// ── 按路线配置(最高优先级) ──
// 键为 `${from}>${to}`。例:
//   "town>battle": { exit: FX.zoomOut, hold: 220 },
//   "battle>reward": { enter: FX.slideUp },
export const ROUTE_FX: Partial<Record<`${Screen}>${Screen}`, Partial<TransitionSpec>>> = {
  "sortie>elevator": DEFAULT_TRANSITION,
  "elevator>explore": { ...DEFAULT_TRANSITION, hold: 500 },

  // 探索牌桌 → 战斗: 路线图保持清晰成为玻璃，点击处炸出中性白/黑的冲击断裂网格（碎片留在原位），随后黑色涟漪从同一点替换为战斗。
  // 包裹层必须 stay: 它是 BattleScreen 的祖先，不能挂 transform；旧场景快照只做极轻微外扩。
  "explore>battle": {
    exit: FX.battleRippleOut,
    enter: FX.none,
    hold: 0,
    curtain: "battle-ripple",
  },
  "reward>explore": { hold: 140 },

  "victory>town": { exit: FX.endSettleOut, enter: FX.endSettleIn, hold: 420 },
  "defeat>town": { exit: FX.endSettleOut, enter: FX.endSettleIn, hold: 420 },

  // ★ 编队 ↔ 角色详情: **原生 View Transition 的共享元素过场**, 不是全屏特效。
  //   两页背景是同一张冬眠仓.png ⇒ 未命名的一切落进 root 快照, 它的默认交叉淡化因此
  //   完全看不见, "底图不动、只有元素重组"的错觉自然成立。
  //     被点的卡面板/立绘/角色名 与 详情页的立绘栏/展示柜/大标题 **同名** ⇒ 浏览器自动形变;
  //     两页各自独有的元素(标题、读数、其余卡、属性栏、卡组栏)各挂各的名 ⇒ 各演各的飞出/飞入。
  //   编排见 app/ScreenTransition/ScreenTransition.tsx 的 viewTransition 分支, 画面见 app/viewTransition.global.css。
  //   ⚠ exit/enter/hold 在这条分支里不读, 填 none/0 只是为了满足类型。
  //   ⚠ 两条路线刻意同参: 来回对称, 空间关系才立得住。
  "formation>charDetail": { exit: FX.none, enter: FX.none, hold: 0, viewTransition: true },
  "charDetail>formation": { exit: FX.none, enter: FX.none, hold: 0, viewTransition: true },
};

const NO_TRANSITION: TransitionSpec = { exit: FX.none, enter: FX.none, hold: 0 };

// 系统级「减少动态效果」无障碍设置。每次读取而非缓存 —— 用户可能中途改系统设置。
// 导出供其他有自建时序编排的界面复用(如 TownScreen 的进设施运镜), 免得各写一份。
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 解析一次跳转该用的过场。优先级: 路线 > 界面自身声明 > 全局默认。
// 出场归「来源」界面, 入场归「目标」界面 —— 这是 SCREEN_FX 的语义。
export function resolveTransition(from: Screen, to: Screen): TransitionSpec {
  if (!TRANSITIONS_ENABLED || prefersReducedMotion()) return NO_TRANSITION;

  const route = ROUTE_FX[`${from}>${to}`];
  return {
    exit: route?.exit ?? SCREEN_FX[from]?.exit ?? DEFAULT_TRANSITION.exit,
    enter: route?.enter ?? SCREEN_FX[to]?.enter ?? DEFAULT_TRANSITION.enter,
    hold: route?.hold ?? DEFAULT_TRANSITION.hold,
    curtain: route?.curtain ?? DEFAULT_TRANSITION.curtain,
    viewTransition: route?.viewTransition ?? SCREEN_FX[to]?.viewTransition,
  };
}
