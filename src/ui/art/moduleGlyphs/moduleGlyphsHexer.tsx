// ============================================================================
// 咒术师模组的徽记 —— 恶毒模组与后发模组。
//
// 分层与配色口径沿用 moduleGlyphs.tsx(外框断线 → core → 细节 → 呼吸核心)，
// 与精算师模组一样拆成独立文件，主表不随角色数量膨胀。
// ============================================================================

import type { ReactNode } from "react";
import type { ModuleTheme } from "./moduleGlyphs";
import s from "./moduleGlyphs.module.css";

interface ArtProps {
  coreId: string;
}

/** 四角断线外框 —— 与其余模组同一份几何，保证摆在一起时框线对齐。 */
const FRAME = "M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9";

export const HEXER_MODULE_THEMES: Record<string, ModuleTheme> = {
  // 恶毒 = 咒怨暗紫红。缠满咒的目标被一眼看穿，取偏冷的血色。
  "venom-module": { hue: "#e05a8a", deep: "#7a1f45", ink: "#ffd9e8" },
  // 后发 = 琥珀金。与咒术师立绘的咒光同色，表示「等时辰」。
  "late-module": { hue: "#f0b14a", deep: "#7d5414", ink: "#fff0c8" },
};

export const HEXER_MODULE_ART: Record<string, (props: ArtProps) => ReactNode> = {
  // 恶毒模组: 咒眼被三道咒纹缠住，眼下垂一滴。
  "venom-module": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path
        className={s.core}
        d="M8 24c5-8 11-11 16-11s11 3 16 11c-5 8-11 11-16 11S13 32 8 24Z"
        fill={`url(#${coreId})`}
        stroke="var(--mg-hue)"
        strokeWidth="1.7"
      />
      <path d="M12 16l5 4M36 16l-5 4M24 8v5" stroke="var(--mg-deep)" strokeWidth="1.5" opacity=".85" />
      <path d="M24 35c-1.6 2.4-1.6 4 0 5 1.6-1 1.6-2.6 0-5Z" stroke="var(--mg-ink)" strokeWidth="1.3" />
      <circle className={s.breathe} cx="24" cy="24" r="4" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
  // 后发模组: 沙漏上半已空，两道时刻刻痕向下推进。
  "late-module": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path
        className={s.core}
        d="M15 9h18M15 39h18M17 9c0 8 7 11 7 15s-7 7-7 15M31 9c0 8-7 11-7 15s7 7 7 15"
        fill={`url(#${coreId})`}
        stroke="var(--mg-hue)"
        strokeWidth="1.7"
      />
      <path d="M19 35h10" stroke="var(--mg-ink)" strokeWidth="2" />
      <path d="M38 18v5M38 27v5" stroke="var(--mg-deep)" strokeWidth="1.6" opacity=".9" />
      <circle className={s.breathe} cx="24" cy="24" r="2.8" fill={`url(#${coreId})`} stroke="var(--mg-ink)" strokeWidth="1.2" />
    </>
  ),
};
