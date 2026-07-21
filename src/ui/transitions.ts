// ============================================================================
// 场景过场动效预设表(纯 UI 表现层)。
// 与 animations.ts 同一套哲学: 时长常量的唯一真相在 TS, 视觉在 styles.css;
// JS 只负责挂载/卸载与时序编排, 不引入任何动画库。
//
// 一次切换 = 旧界面出场(exit) → 黑场停顿(hold) → 新界面入场(enter), 串行执行。
// 出场与入场各自独立可配, 见 TransitionSpec。
// ============================================================================

import type { Screen } from "../store/runStore";

// 总开关: 置 false 即彻底关闭过场, 退回瞬移式切换。
export const TRANSITIONS_ENABLED = true;

// 单个出/入场特效。name 对应 styles.css 里的 .screen-fx-<name>,
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
}

// ── 可用特效登记处 ──
// 新增一种特效 = 这里加一项 + styles.css 加一段同名 keyframes。
//
// ⚠ transform 类特效(zoomIn/slideUp)慎用在 battle 的入场上: BattleScreen 的
// computeCamera 靠 getBoundingClientRect() 算相机仿射变换, 要求测量时祖先链上无
// transform(见 BattleScreen.tsx 里的测量约束注释)。过场包裹层正是 battle 的祖先,
// 故默认动效刻意只用 opacity —— 它不影响 getBoundingClientRect。
export const FX = {
  none: { name: "none", ms: 0 },
  fadeOut: { name: "fade-out", ms: 240 },
  fadeIn: { name: "fade-in", ms: 240 },
  zoomIn: { name: "zoom-in", ms: 280 },
  zoomOut: { name: "zoom-out", ms: 220 },
  slideUp: { name: "slide-up", ms: 280 },
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
  // 探索牌桌 ↔ 战斗: 一「下潜」一「上浮」。牌桌是俯瞰整片区域的抽象层, 战斗是钻进其中一个点,
  // 两者尺度差得远, 所以给比默认更长的黑场, 让切换有下沉感而不是页面跳转。
  "explore>battle": { hold: 200 },
  "reward>explore": { hold: 140 },
};

const NO_TRANSITION: TransitionSpec = { exit: FX.none, enter: FX.none, hold: 0 };

// 系统级「减少动态效果」无障碍设置。每次读取而非缓存 —— 用户可能中途改系统设置。
function prefersReducedMotion(): boolean {
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
  };
}
