// ============================================================================
// 植物学家攻击特效的时间轴 —— 唯一真相点。
//   impact = 挂载 → 爆点(ms), 与 animations.ts 的 ANIM[*].proc.impactMs 同源, 掉血/飘字/受击都锚在这一拍;
//   total  = 挂载 → 完全淡出(ms), ANIM[*].hold 须盖住 max(total, impact + floatMs);
//   着色器内各拍以爆点为零点写死在 shaders/*.glsl.ts 的注释与常量里。
// 纯数据文件: choreo/botanistAnimPresets.ts 只引这里, 不牵连着色器与组件。
// ============================================================================

/** 植物学家特效种类(与 CardAnim 同名)。 */
export type BotanistFxKind =
  | "thorn-arrow"
  | "thorn-whip"
  | "flytrap-bite"
  | "spore-bloom"
  | "vine-tide";

export interface BotanistFxTiming {
  impact: number;
  total: number;
}

export const BOTANIST_TIMELINE: Record<BotanistFxKind, BotanistFxTiming> = {
  "thorn-arrow": { impact: 300, total: 1150 },
  "thorn-whip": { impact: 380, total: 1200 },
  "flytrap-bite": { impact: 560, total: 1450 },
  "spore-bloom": { impact: 500, total: 1600 },
  "vine-tide": { impact: 680, total: 1700 },
};
