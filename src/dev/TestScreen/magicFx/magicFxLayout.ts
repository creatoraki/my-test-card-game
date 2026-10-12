import type { MagicFxSpec } from "./magicFxSpecs";

export { SINGLE_FX } from "@/ui/battle/fx/MagicFx";

/** 演示舞台设计尺寸(px)；整块按可用区域等比缩放，所有坐标都以左上角为原点。 */
export const STAGE = { width: 1280, height: 640 } as const;

export interface StagePoint {
  x: number;
  y: number;
}

export const CASTER: StagePoint = { x: 220, y: 380 };

const SINGLE_TARGET: StagePoint = { x: 900, y: 330 };
const GROUP_TARGETS: readonly StagePoint[] = [
  { x: 760, y: 300 },
  { x: 950, y: 370 },
  { x: 1120, y: 290 },
];

/** 当前演示的目标位置：单体特效固定一个；全屏特效按目标数取 1 或 3 个。 */
export function targetsFor(spec: MagicFxSpec, count: number): readonly StagePoint[] {
  if (spec.mode === "single" || count <= 1) return [SINGLE_TARGET];
  return GROUP_TARGETS.slice(0, count);
}
