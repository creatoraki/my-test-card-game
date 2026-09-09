// ============================================================================
// 炼金术士模组的徽记 —— 组装模组 A/B/C/D。
//
// 分层与配色口径完全沿用 moduleGlyphs.tsx(外框断线 → core → 细节 → 呼吸核心)，
// 单独拆一个文件是因为这一组会随组装部件一起加长，主表不该跟着膨胀。
//
// ★ 图形直接复用组装 BUFF 的炼金三角(见 engine/squadBuff.ts 的 emoji)：
//   A=风(正三角加横杠) B=火(正三角) C=土(倒三角加横杠) D=水(倒三角)。
//   战斗里看到的部件徽章与背包里看到的模组徽记是同一套形，玩家不用再记一层对应关系。
// ============================================================================

import type { ReactNode } from "react";
import {
  ASSEMBLE_MODULE_LETTERS,
  assembleModuleItemId,
  type AssembleModuleLetter,
} from "@/data/items/modules";
import type { ModuleTheme } from "./moduleGlyphs";
import s from "./moduleGlyphs.module.css";

interface ArtProps {
  coreId: string;
}

/** 四角断线外框 —— 与其余模组同一份几何，保证摆在一起时框线对齐。 */
const FRAME = "M8 17V8h9M31 8h9v9M40 31v9h-9M17 40H8v-9";

/** 三处卡榫 —— 组装成功要集齐 3 种部件，图形上用三个接口点出这层规则。 */
const SOCKETS = "M24 6v4M11 39l3-3M37 39l-3-3";

const UP_TRIANGLE = "M24 11 38 34H10Z";
const DOWN_TRIANGLE = "M24 37 10 14h28Z";

interface AssembleShape {
  core: string;
  bar?: string;
  coreY: number;
}

const SHAPES: Record<AssembleModuleLetter, AssembleShape> = {
  A: { core: UP_TRIANGLE, bar: "M15 29.5h18", coreY: 25 },
  B: { core: UP_TRIANGLE, coreY: 26 },
  C: { core: DOWN_TRIANGLE, bar: "M15 19h18", coreY: 24 },
  D: { core: DOWN_TRIANGLE, coreY: 22 },
};

// 四件部件按炼金四元素分色：风=青、火=红、土=赭、水=蓝。同族但两两拉得开，
// 缩到背包格子大小时也能只凭颜色分辨手上是哪一件。
const THEMES: Record<AssembleModuleLetter, ModuleTheme> = {
  A: { hue: "#7fe3ff", deep: "#1f6f8f", ink: "#e6faff" },
  B: { hue: "#ff7a4f", deep: "#8f3416", ink: "#ffe0cf" },
  C: { hue: "#d8a95c", deep: "#6f4d1c", ink: "#ffeecb" },
  D: { hue: "#6fa8ff", deep: "#24468f", ink: "#dbe9ff" },
};

function assembleArt(letter: AssembleModuleLetter) {
  const { core, bar, coreY } = SHAPES[letter];
  return ({ coreId }: ArtProps) => (
    <>
      <path d={FRAME} stroke="var(--mg-deep)" strokeWidth="1.3" opacity=".55" />
      <path d={SOCKETS} stroke="var(--mg-deep)" strokeWidth="1.6" opacity=".85" />
      <path
        className={s.core}
        d={core}
        fill={`url(#${coreId})`}
        stroke="var(--mg-hue)"
        strokeWidth="1.7"
      />
      {bar && <path d={bar} stroke="var(--mg-ink)" strokeWidth="1.6" />}
      <circle
        className={s.breathe}
        cx="24"
        cy={coreY}
        r="2.8"
        fill={`url(#${coreId})`}
        stroke="var(--mg-ink)"
        strokeWidth="1.2"
      />
    </>
  );
}

export const ALCHEMIST_MODULE_THEMES: Record<string, ModuleTheme> = Object.fromEntries(
  ASSEMBLE_MODULE_LETTERS.map((letter) => [assembleModuleItemId(letter), THEMES[letter]]),
);

export const ALCHEMIST_MODULE_ART: Record<string, (props: ArtProps) => ReactNode> =
  Object.fromEntries(
    ASSEMBLE_MODULE_LETTERS.map((letter) => [assembleModuleItemId(letter), assembleArt(letter)]),
  );
