// 事件面板的形状变量。
//
// 面板的外形靠 clip-path 裁出(形状见 panelShape.ts), 开场与关闭动画也复用同一份顶点。
import type { CSSProperties } from "react";
import { BUMP, OUTER, buildOutline, projectToSlit, toPolygon } from "./panelShape";

/** 裁切用的原始轮廓。 */
const OUTLINE = buildOutline(0);

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
