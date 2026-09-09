// ============================================================================
// 精算师模组的徽记 —— 急诊模组与回响模组。
//
// 分层与配色口径沿用 moduleGlyphs.tsx(外框断线 → core → 细节 → 呼吸核心)，
// 拆成独立文件的理由与 moduleGlyphsGenericT1 一致：主表不随角色数量膨胀。
// ============================================================================

import type { ReactNode } from "react";
import type { ModuleTheme } from "./moduleGlyphs";
import s from "./moduleGlyphs.module.css";

interface ArtProps {
  coreId: string;
}

/** 四角断线外框 —— 与其余模组同一份几何，保证摆在一起时框线对齐。 */
const FRAME = "M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9";

export const ACTUARY_MODULE_THEMES: Record<string, ModuleTheme> = {
  // 急诊 = 急救红。与治愈力模组的翠绿刻意拉开：这件不是治疗量，是「抢救窗口」。
  "emergency-module": { hue: "#ff5f6d", deep: "#8c2030", ink: "#ffdde1" },
  // 回响 = 回响紫。声波语义取冷紫，与卫星的靛蓝、弃牌的品红各留一档间距。
  "echo-module": { hue: "#a07dff", deep: "#3f2a8c", ink: "#e6dcff" },
};

export const ACTUARY_MODULE_ART: Record<string, (props: ArtProps) => ReactNode> = {
  // 急诊模组: 医疗十字被一条斜绷带盖住 —— 伤是假的，抢救窗口是真的。
  "emergency-module": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path
        className={s.core}
        d="M20 10h8v10h10v8H28v10h-8V28H10v-8h10V10Z"
        fill={`url(#${coreId})`}
        stroke="var(--mg-hue)"
        strokeWidth="1.7"
      />
      <path d="M11 33 33 11" stroke="var(--mg-deep)" strokeWidth="3.2" opacity=".8" />
      <path d="M13 30h4.5M30.5 14H35" stroke="var(--mg-ink)" strokeWidth="1.4" />
      <circle
        className={s.breathe}
        cx="24"
        cy="24"
        r="3"
        fill={`url(#${coreId})`}
        stroke="var(--mg-ink)"
        strokeWidth="1.2"
      />
    </>
  ),
  // 回响模组: 一个声源向右荡出三道渐弱的波纹，左侧留一道回弹的小弧。
  "echo-module": ({ coreId }) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <circle
        className={s.core}
        cx="18"
        cy="24"
        r="9"
        fill={`url(#${coreId})`}
        stroke="var(--mg-hue)"
        strokeWidth="1.7"
      />
      <path d="M28 16c3.5 4 3.5 12 0 16" stroke="var(--mg-hue)" strokeWidth="1.7" />
      <path d="M33 12c5.5 6 5.5 18 0 24" stroke="var(--mg-hue)" strokeWidth="1.4" opacity=".8" />
      <path d="M38 9c7 8 7 22 0 30" stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".7" />
      <path d="M9 20c-2 2.5-2 5.5 0 8" stroke="var(--mg-deep)" strokeWidth="1.4" opacity=".85" />
      <circle
        className={s.breathe}
        cx="18"
        cy="24"
        r="3"
        fill={`url(#${coreId})`}
        stroke="var(--mg-ink)"
        strokeWidth="1.2"
      />
    </>
  ),
};
