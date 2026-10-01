// ============================================================================
// 房间图骨架 —— 只描述「哪些格子有房间、相邻格子之间是否打通」, 不涉及房间内容。
//
// 约束与 dungeon/types.ts 一致: 每格至多 3 条路(左、右、一条纵向), 纵向(上或下)至多一条。
// 因此骨架天然由若干「横向走廊」+「纵向楼梯」拼成, 各原型只是在这条规则下摆出不同的轮廓。
// ============================================================================

import type { PortalDir } from "../dungeon/types";

export type LayoutRng = { rngState: number };

export interface SkelCell {
  x: number;
  y: number;
  /** 已打通的方向; 目标格就是该方向上的相邻格。 */
  links: Set<PortalDir>;
}

export interface Skeleton {
  cells: Map<string, SkelCell>;
  /** 目标房间数; 达到后一切生长立即停止。 */
  target: number;
  /** 轮廓上限: 宽(列数)与高(行数)。兜底生长时可以放宽。 */
  maxCols: number;
  maxRows: number;
}

export interface LayoutResult {
  cells: SkelCell[];
  start: SkelCell;
  boss: SkelCell;
  /** 本日抽中的骨架原型, 便于调试日志。 */
  archetype: string;
}
