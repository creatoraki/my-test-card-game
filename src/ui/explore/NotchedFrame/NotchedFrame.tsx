// 事件面板的不规则外轮廓描边层。
//
// 为什么要单独一层: 面板靠 clip-path 裁出凹凸外形, 而 clip-path 会把 CSS border 一并切掉 ——
// 凹凸的那些边上就没有描边了。于是把轮廓交给 SVG 画: 与裁切用的是同一份顶点(panelShape.ts),
// 描线永远贴着裁切边。同时再画一条内缩 5px 的"回声"轮廓, 给外框做出层次。
import type { CSSProperties } from "react";
import { BUMP, OUTER, buildOutline, projectToSlit, toPath, toPolygon } from "./panelShape";
import s from "./NotchedFrame.module.css";

/** 裁切用的原始轮廓。 */
const OUTLINE = buildOutline(0);
/** 描边用的轮廓内缩半个线宽 —— 否则 1px 线的外半边会被面板自己的 clip-path 切掉。 */
const STROKE = buildOutline(0.5);
const ECHO = buildOutline(5);

const SHAPE_VARS = {
  "--panel-bump": `${BUMP}px`,
  "--panel-outer-w": `${OUTER.w}px`,
  "--panel-outer-h": `${OUTER.h}px`,
  "--panel-shape": toPolygon(OUTLINE),
  "--panel-shape-line": toPolygon(projectToSlit(OUTLINE, "line")),
  "--panel-shape-seed": toPolygon(projectToSlit(OUTLINE, "seed")),
} as CSSProperties;

/**
 * 面板外壳需要的形状变量。挂在面板元素的 inline style 上 ——
 * explorePanel.module.css 的 clip-path 与开场/关闭 keyframes 都读这几个变量,
 * 不定义它们的浮层(奖励/拾取/交易/背包)继续吃默认的切角矩形。
 */
export function eventPanelShapeVars(): CSSProperties {
  return SHAPE_VARS;
}

/** 轮廓描边。放在面板内部, 会被面板自身的 clip-path 一起裁切, 因而与开场动画同步长出来。 */
export function NotchedFrame() {
  return (
    <svg className={s.frame} viewBox={`0 0 ${OUTER.w} ${OUTER.h}`} preserveAspectRatio="none" aria-hidden focusable="false">
      <path className={s.echo} d={toPath(ECHO)} />
      <path className={s.line} d={toPath(STROKE)} />
    </svg>
  );
}
