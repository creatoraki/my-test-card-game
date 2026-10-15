import { GLSL_COMMON } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON } from "@/ui/battle/fx/GlslHitFx";
import type { MagicFxProgram } from "@/ui/battle/fx/MagicFx";
import { GLSL_MAGIC_COMMON } from "@/ui/battle/fx/MagicFx/shaders/magicCommon.glsl";
import { GLSL_MAGIC_STAGE } from "@/ui/battle/fx/MagicFx/shaders/magicStage.glsl";
import type { BotanistFxKind } from "./botanistFxTimeline";
import { GLSL_BOTANIST_COMMON } from "./shaders/botanistCommon.glsl";
import { GLSL_THORN_ARROW } from "./shaders/thornArrow.glsl";
import { GLSL_THORN_WHIP } from "./shaders/thornWhip.glsl";
import { GLSL_FLYTRAP_BITE } from "./shaders/flytrapBite.glsl";
import { GLSL_SPORE_BLOOM } from "./shaders/sporeBloom.glsl";
import { GLSL_VINE_TIDE } from "./shaders/vineTide.glsl";

/**
 * 植物学家特效的着色器程序表。画布约定与魔法特效完全一致(复用 MagicFxProgram):
 * single = 单体画布(SINGLE_FX 尺寸，中心对齐受击锚点)；stage = 全场画布(目标坐标走 uT0~uT2 / uCount)。
 */
const single = (kind: BotanistFxKind, body: string): MagicFxProgram => ({
  program: { key: `botanist.${kind}`, fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_MAGIC_COMMON, GLSL_BOTANIST_COMMON, body].join("\n") },
  mode: "single",
});

const stage = (kind: BotanistFxKind, body: string): MagicFxProgram => ({
  program: {
    key: `botanist.${kind}`,
    fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_MAGIC_COMMON, GLSL_MAGIC_STAGE, GLSL_BOTANIST_COMMON, body].join("\n"),
  },
  mode: "stage",
});

export const BOTANIST_PROGRAMS: Record<BotanistFxKind, MagicFxProgram> = {
  "thorn-arrow": single("thorn-arrow", GLSL_THORN_ARROW),
  "thorn-whip": single("thorn-whip", GLSL_THORN_WHIP),
  "flytrap-bite": single("flytrap-bite", GLSL_FLYTRAP_BITE),
  "spore-bloom": single("spore-bloom", GLSL_SPORE_BLOOM),
  "vine-tide": stage("vine-tide", GLSL_VINE_TIDE),
};
