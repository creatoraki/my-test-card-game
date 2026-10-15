// ============================================================================
// 植物学家攻击 · 战斗挂载表。组件复用魔法特效的 GLSL 宿主(MagicHitFx / MagicStageFx), 这里只按种类配程序与总长。
//   · 单体四种进 HitFxLayer 的 PROC_FX;
//   · 藤蔓缠绕为全场级(AnimPreset.stage), 由 ScreenFxLayer 挂一份, 各目标只留受击反应与飘字。
// ============================================================================

import { glslHitFxTable, type StageFxDef } from "@/ui/battle/fx/MagicFx";
import { BOTANIST_PROGRAMS } from "./botanistFxPrograms";
import { BOTANIST_TIMELINE, type BotanistFxKind } from "./botanistFxTimeline";

/** 与 CardAnim 同名的单体组件表。 */
export const BOTANIST_HIT_FX = glslHitFxTable<Exclude<BotanistFxKind, "vine-tide">>(
  ["thorn-arrow", "thorn-whip", "flytrap-bite", "spore-bloom"],
  BOTANIST_PROGRAMS,
  BOTANIST_TIMELINE,
);

/** 全场级特效定义表。 */
export const BOTANIST_STAGE_FX = {
  "vine-tide": { spec: BOTANIST_PROGRAMS["vine-tide"], totalMs: BOTANIST_TIMELINE["vine-tide"].total },
} satisfies Record<string, StageFxDef>;
