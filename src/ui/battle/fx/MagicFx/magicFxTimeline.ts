// ============================================================================
// 魔法攻击特效(预言家 / 咒术师)的时间轴 —— 唯一真相点。
//   impact = 挂载 → 爆点(ms), 与 animations.ts 的 ANIM[*].proc.impactMs 同源, 掉血/飘字/受击都锚在这一拍;
//   total  = 挂载 → 完全淡出(ms), ANIM[*].hold 须盖住 max(total, impact + floatMs);
//   着色器内各拍以爆点为零点写死在 shaders/*.glsl.ts 的注释与常量里。
// 纯数据文件: animations.ts 只引这里, 不牵连着色器与组件。
// ============================================================================

/** 魔法特效种类(与 CardAnim 同名)。 */
export type MagicFxKind =
  | "star-shard"
  | "twin-orbit"
  | "meteor-fall"
  | "astral-verdict"
  | "gravity-lens"
  | "star-curtain"
  | "curse-nail"
  | "talisman-seal"
  | "binding-hex"
  | "doom-clock"
  | "soul-rend"
  | "spirit-tide";

export interface MagicFxTiming {
  impact: number;
  total: number;
}

export const MAGIC_TIMELINE: Record<MagicFxKind, MagicFxTiming> = {
  "star-shard": { impact: 260, total: 950 },
  "twin-orbit": { impact: 500, total: 1200 },
  "meteor-fall": { impact: 450, total: 1150 },
  "astral-verdict": { impact: 700, total: 1400 },
  "gravity-lens": { impact: 600, total: 1400 },
  "star-curtain": { impact: 750, total: 1700 },
  "curse-nail": { impact: 340, total: 1300 },
  "talisman-seal": { impact: 400, total: 1300 },
  "binding-hex": { impact: 620, total: 1450 },
  "doom-clock": { impact: 550, total: 1350 },
  "soul-rend": { impact: 500, total: 1450 },
  "spirit-tide": { impact: 700, total: 1750 },
};
