// ============================================================================
// 1 阶通用模组的徽记 —— 分层与配色口径完全沿用 moduleGlyphs.tsx(外框断线 → core →
// 细节 → 呼吸核心), 只是因为通用模组清单会一直加长, 单独拆一个文件, 主表不再膨胀。
//
// 配色按「这件模组改的是哪一项」分色, 而不是按角色分色: 通用模组不属于任何角色。
// 同名不同阶将来共用同一套图形, 靠稀有度描边区分(见《通用模组设计.md》§8)。
// ============================================================================

import type { ReactNode } from "react";
import type { ModuleTheme } from "./moduleGlyphs";
import s from "./moduleGlyphs.module.css";

interface ArtProps {
  coreId: string;
}

/** 四角断线外框 —— 与角色模组同一份几何, 保证两类模组摆在一起时框线对齐。 */
const FRAME = "M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9";

export const GENERIC_T1_MODULE_THEMES: Record<string, ModuleTheme> = {
  // 攻击力 = 赤红。伤害向的基准色。
  "attack-module-t1": { hue: "#ff7a5c", deep: "#8f3120", ink: "#ffe0d2" },
  // 治愈力 = 翠绿。治疗/护盾一侧。
  "healpower-module-t1": { hue: "#6fe08c", deep: "#22713f", ink: "#ddffe6" },
  // 穿甲 = 钢青。破防是「金属对金属」。
  "armorpen-module-t1": { hue: "#8fb6cc", deep: "#3a5a6d", ink: "#e6f4ff" },
  // 暴击 = 琥珀金。爆发一侧最亮的一档。
  "crit-module-t1": { hue: "#ffc857", deep: "#8a5f14", ink: "#fff3cf" },
  // 精准 = 冷蓝。命中/瞄准语义。
  "precision-module-t1": { hue: "#6fc8ff", deep: "#1f5e8c", ink: "#dcf1ff" },
  // 淬毒 = 毒紫绿。
  "poison-module-t1": { hue: "#a6e05c", deep: "#456b1c", ink: "#eeffd0" },
  // 燃烧 = 焰橙。
  "burn-module-t1": { hue: "#ff9436", deep: "#93460d", ink: "#ffe6cb" },
};

export const GENERIC_T1_MODULE_ART: Record<string, (props: ArtProps) => ReactNode> = {
  // 攻击力: 向上的刃尖 + 增幅横杠。
  "attack-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="m24 9 8 14-8 6-8-6 8-14Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M24 29v10M17 34h14" stroke="var(--mg-hue)" strokeWidth="1.6" />
      <circle className={s.breathe} cx="24" cy="22" r="3" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 治愈力: 医疗十字外套一圈脉冲环。
  "healpower-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <circle className={s.core} cx="24" cy="24" r="12" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.6" />
      <path d="M24 15v18M15 24h18" stroke="var(--mg-hue)" strokeWidth="3.2" />
      <path d="M13 30c4 3 18 3 22 0" stroke="var(--mg-deep)" strokeWidth="1.4" opacity=".8" />
      <circle className={s.breathe} cx="24" cy="24" r="2.8" fill="var(--mg-ink)" />
    </>
  ),
  // 穿甲: 一支箭穿透裂开的盾。
  "armorpen-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="M24 10l11 4v10c0 7-5 12-11 14-6-2-11-7-11-14V14l11-4Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.6" />
      <path d="M12 34 36 14" stroke="var(--mg-ink)" strokeWidth="2" />
      <path d="M31 13h6v6" stroke="var(--mg-ink)" strokeWidth="1.6" />
      <circle className={s.breathe} cx="24" cy="24" r="2.6" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 暴击: 四角爆闪。
  "crit-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="M24 8c2 9 7 14 16 16-9 2-14 7-16 16-2-9-7-14-16-16 9-2 14-7 16-16Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M13 13 17 17M35 13l-4 4M13 35l4-4M35 35l-4-4" stroke="var(--mg-deep)" strokeWidth="1.5" opacity=".85" />
      <circle className={s.breathe} cx="24" cy="24" r="3.2" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 精准: 准星与刻度。
  "precision-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <circle className={s.core} cx="24" cy="24" r="12" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M24 8v7M24 33v7M8 24h7M33 24h7" stroke="var(--mg-hue)" strokeWidth="1.8" />
      <circle cx="24" cy="24" r="5.5" stroke="var(--mg-ink)" strokeWidth="1.2" />
      <circle className={s.breathe} cx="24" cy="24" r="2.2" fill="var(--mg-ink)" />
    </>
  ),
  // 淬毒: 滴落的毒液与骨点。
  "poison-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="M24 9c6 8 10 13 10 18a10 10 0 0 1-20 0c0-5 4-10 10-18Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M20 25h1M27 25h1M21 31c2-2 4-2 6 0" stroke="var(--mg-ink)" strokeWidth="1.8" />
      <circle className={s.breathe} cx="24" cy="27" r="2.6" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.1" />
    </>
  ),
  // 燃烧: 双层火舌。
  "burn-module-t1": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path className={s.core} d="M24 8c8 8 12 13 12 20a12 12 0 0 1-24 0c0-4 2-7 5-11 1 3 3 5 5 6-1-6 0-11 2-15Z" fill={`url(#${coreId})`} stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M24 22c4 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9Z" stroke="var(--mg-ink)" strokeWidth="1.4" />
      <circle className={s.breathe} cx="24" cy="31" r="2.4" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.1" />
    </>
  ),
};
