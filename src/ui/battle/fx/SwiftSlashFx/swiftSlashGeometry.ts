// ============================================================================
// 瞬斩(swift-slash)的时间轴与几何表 —— 唯一真相点。
//
// 坐标系: 以目标受击点为原点, 整层先旋转 BLADE.angle, 此后一律在「刀路坐标」里作图:
//   +X = 刀势前进方向(右上 → 左下那一刀的去向), Y = 刀路法线。
// 火花只往 +X 一侧的窄扇区喷 —— 「顺着刀势冲出去」, 与 basic-slash 的双侧对称炸开区分。
// 随机量用固定种子在模块加载时烘一次, 每次重播布局逐 px 相同。
// ============================================================================

import { seededRange } from "@/ui/battle/fx/shared/fxKit";

/** 时间轴(ms)。impact 与 animations.ts 的 "swift-slash".proc.impactMs 同源。 */
export const SWIFT_TIMELINE = {
  glint: 0, // 刀路起点一粒闪光
  blade: 40, // 刃光开始划出
  impact: 110, // 划到底 → 斩线裂开 + 十字闪
  total: 420,
} as const;

/** 刀身: 148° 让刃光从目标右上斜劈向左下。 */
export const BLADE = {
  length: 520,
  angle: 148,
} as const;

/** 速度线: 平行于刀路的细线, 法线方向错开, 刃光划出时一起向前滑走。 */
export const SPEED_LINES = [
  { offset: -46, length: 240, delay: 0 },
  { offset: -24, length: 320, delay: 12 },
  { offset: 30, length: 280, delay: 6 },
  { offset: 58, length: 200, delay: 18 },
] as const;

export interface SwiftSpark {
  angle: number; // 相对刀势方向的偏角(deg)
  distance: number; // 飞行距离(px)
  length: number; // 火花条长度(px)
  delay: number; // 相对爆点的延迟(ms)
  tone: "white" | "steel";
}

const range = seededRange(0x5a1f7);

export const SPARKS: SwiftSpark[] = Array.from({ length: 12 }, (_, index) => ({
  angle: range(-30, 30),
  distance: range(110, 240),
  length: range(16, 40),
  delay: range(0, 36),
  tone: index % 3 === 0 ? "white" : "steel",
}));
