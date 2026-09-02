// 编队态 ↔ 详情态「元素重组」的几何与时长旋钮 —— 唯一真相点。
//
// ★ 这一套取代了原先的原生 View Transition(app/viewTransition.global.css, 已删):
//   ::view-transition-* 伪元素挂在**文档根**上, 拿不到元素身上的 --i, 错峰只能靠一张手写
//   到 23 条的延迟表, 更做不出"卡阵按距离飞散 + 面板从卡边缘裂开生长"这类连续重组。
//   改成同一页内的两种态之后, 一切都是普通 DOM, 编排权回到自己手里。
//
// ⚠ 本文件里的坐标一律是**设计 px**(1920×1080 画布内的坐标), 与窗口分辨率无关。

import { STAGE } from "@/ui/hooks/stage";
import { prefersReducedMotion } from "@/ui/app/transitions";

/** 「减少动态效果」时所有时长归零 —— 与 DeckForgeOverlay/forgeChoreo.ts 同款包法。 */
const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

// ---- 时长 ----
export const MORPH_MS = duration(560); // 被点卡 → 立绘栏的飞行形变
export const SCATTER_MS = duration(320); // 其余卡飞散
export const SCATTER_STAGGER_MS = duration(26); // 按与被点卡的列距错峰
export const PANEL_DELAY_MS = duration(160); // 右侧工作区起裂时刻
export const PANEL_GROW_MS = duration(400); // 右侧工作区裂开生长
// ⚠⚠ PANEL_DELAY + PANEL_GROW 必须 ≤ MORPH_MS: 飞行一结束 phase 就回 idle, is-growing 类随之摘掉,
//   动画没播完就会被硬切到终态(表现为面板在最后一下"啪"地弹满)。160 + 400 = 560 正好收在飞行结束那一刻。
// ⚠ 工作区**内部**各面板的错峰(属性组、卡格)不在这里: 它们各自写在自己的 module.css 里,
//   与项目里别处的入场错峰同一范式, 且带自己的 prefers-reduced-motion 兜底。
export const BACK_MORPH_MS = duration(420); // 回程: 立绘 → 卡
export const BACK_GATHER_MS = duration(260); // 回程: 卡阵收拢

export const MORPH_EASE = "cubic-bezier(0.2, 0.72, 0.28, 1)";

// ---- 版面常量 ----
// 详情态左栏立绘的出血矩形。⚠ 它是**常量而不是测量值**: 版面由本域自己定死(见
// CharacterDetailView/FigureStage/FigureStage.module.css 的 .stage), 去程因此不需要等详情态布局完成再测一次。
export const FIGURE_RECT: Rect = { x: 0, y: 0, w: 780, h: 1080 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 把窗口 px 的 DOMRect 换算成画布内的设计 px。
 *
 * ⚠ 画布走的是 `zoom: var(--stage-scale)`(见 app/styles/stageCanvas.module.css), 故
 *   getBoundingClientRect() 拿到的是缩放后的窗口 px。缩放系数**不按 offsetWidth 反推** ——
 *   标准化后的 zoom 在各浏览器里对 offsetWidth 的口径并不一致; 画布宽恒为 STAGE.width 设计 px
 *   才是这里唯一稳的分母。
 */
export function designRectOf(el: HTMLElement): Rect | null {
  const canvas = el.closest<HTMLElement>("[data-stage-canvas]");
  if (!canvas) return null;
  const canvasRect = canvas.getBoundingClientRect();
  if (canvasRect.width <= 0) return null;
  const scale = canvasRect.width / STAGE.width;
  const rect = el.getBoundingClientRect();
  return {
    x: (rect.left - canvasRect.left) / scale,
    y: (rect.top - canvasRect.top) / scale,
    w: rect.width / scale,
    h: rect.height / scale,
  };
}
