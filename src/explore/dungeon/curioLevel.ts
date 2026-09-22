// ============================================================================
// 物件等级投放 —— 地图给出等级区间, 房间越深越接近区间上限, 再叠一点随机浮动。
// 同一间房的物件各自掷浮动, 所以同房物件等级可能相差 1 级。
// ============================================================================

import { rngFloat } from "../../engine/rng";
import { clampCurioLevel } from "../../data/curios/levelRules";
import type { CurioLevel } from "../../data/curios/types";
import type { ExploreState } from "../types";

/** 浮动分布: −1 / 0 / +1 各占 20% / 60% / 20%。 */
const JITTER = [
  { delta: -1, until: 0.2 },
  { delta: 0, until: 0.8 },
  { delta: 1, until: 1 },
] as const;

export function rollCurioLevel(
  s: ExploreState,
  range: readonly [CurioLevel, CurioLevel],
  depth: number,
  maxDepth: number,
): CurioLevel {
  const [min, max] = range;
  if (min >= max || depth <= 0) return min;
  const progress = maxDepth > 0 ? Math.min(1, depth / maxDepth) : 0;
  const base = min + (max - min) * progress;
  const roll = rngFloat(s);
  const delta = JITTER.find((step) => roll < step.until)?.delta ?? 0;
  return clampCurioLevel(Math.max(min, Math.min(max, Math.round(base) + delta)));
}
