// ============================================================================
// 雷走 · 迅雷斩(thunder-run)的时间轴 —— 唯一真相点。
//   impact / total 与 animations.ts 的 "thunder-run".proc.impactMs、hold 同源;
//   其余各拍以**爆点为零点**(负值 = 爆点之前), 由 thunderRun.glsl.ts 拼成 #define 注入着色器;
//   全屏层 ScreenFxLayer 的 thunderScreen 关键帧按 total 换算百分比(25% = 爆点, 37.5% = 复闪)。
// ============================================================================

export const THUNDER_TIMELINE = {
  /** 挂载 → 爆点(ms): 第二刀刀头恰好掠过目标中心, 掉血/飘字/受击都锚在这一拍。 */
  impact: 200,
  /** 挂载 → 完全淡出(ms)。 */
  total: 780,
  /** 蓄电: 目标周围细碎静电 + 局部压暗渐起。 */
  charge: { start: -200, end: -40 },
  /** 第一刀: 左下 → 右上, 刀头掠过全程。 */
  cutA: { start: -120, dur: 60 },
  /** 第二刀: 左上 → 右下, 刀头掠过中心时 = 爆点。 */
  cutB: { start: -35, dur: 70 },
  /** 雷鸣复闪: 两道斩痕换形重亮一次。 */
  restrike: 100,
} as const;
