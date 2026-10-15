// ============================================================================
// 植物学家攻击特效的时间轴与主色 —— 唯一真相点(目前仅测试页演示, 尚未接入战斗)。
//   impact = 挂载 → 爆点(ms), 接入战斗时与 ANIM[*].proc.impactMs 同源;
//   total  = 挂载 → 完全淡出(ms);
//   color  = 特效主色, 接入战斗时搬进 ANIM[*].color;
//   着色器内各拍以爆点为零点写死在 shaders/*.glsl.ts 的注释与常量里。
// ============================================================================

/** 植物学家特效种类(接入战斗时与 CardAnim 同名)。 */
export type BotanistFxKind =
  | "thorn-arrow"
  | "thorn-whip"
  | "flytrap-bite"
  | "spore-bloom"
  | "vine-tide";

export interface BotanistFxTiming {
  impact: number;
  total: number;
  color: string;
}

export const BOTANIST_TIMELINE: Record<BotanistFxKind, BotanistFxTiming> = {
  "thorn-arrow": { impact: 300, total: 1150, color: "#8fd45a" },
  "thorn-whip": { impact: 380, total: 1200, color: "#b8e04c" },
  "flytrap-bite": { impact: 560, total: 1450, color: "#e8506e" },
  "spore-bloom": { impact: 500, total: 1600, color: "#b07ae8" },
  "vine-tide": { impact: 680, total: 1700, color: "#5fd27c" },
};
