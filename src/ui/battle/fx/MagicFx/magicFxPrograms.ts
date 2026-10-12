import { GLSL_COMMON, type GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON } from "@/ui/battle/fx/GlslHitFx";
import type { MagicFxKind } from "./magicFxTimeline";
import { GLSL_MAGIC_COMMON } from "./shaders/magicCommon.glsl";
import { GLSL_MAGIC_STAGE } from "./shaders/magicStage.glsl";
import { GLSL_STAR_SHARD } from "./shaders/starShard.glsl";
import { GLSL_TWIN_ORBIT } from "./shaders/twinOrbit.glsl";
import { GLSL_STARFALL } from "./shaders/starfall.glsl";
import { GLSL_ASTRAL_VERDICT } from "./shaders/astralVerdict.glsl";
import { GLSL_GRAVITY_LENS } from "./shaders/gravityLens.glsl";
import { GLSL_STAR_CURTAIN } from "./shaders/starCurtain.glsl";
import { GLSL_CURSE_NAIL } from "./shaders/curseNail.glsl";
import { GLSL_TALISMAN_SEAL } from "./shaders/talismanSeal.glsl";
import { GLSL_BINDING_HEX } from "./shaders/bindingHex.glsl";
import { GLSL_DOOM_CLOCK } from "./shaders/doomClock.glsl";
import { GLSL_SOUL_REND } from "./shaders/soulRend.glsl";
import { GLSL_SPIRIT_TIDE } from "./shaders/spiritTide.glsl";

/**
 * single = 单体画布(SINGLE_FX 尺寸，中心对齐受击锚点)；
 * stage = 全场画布(铺满战斗画布，目标坐标走 uT0~uT2 / uCount，见 shaders/magicStage.glsl.ts)。
 */
export interface MagicFxProgram {
  program: GlslProgramDef;
  mode: "single" | "stage";
  /** 需要采样目标立绘(uTex + uFig)。 */
  texture?: boolean;
}

/** 单体画布设计尺寸(px)：着色器按受击目标主体高 256 设计，四周留给飞行物与冲击环。 */
export const SINGLE_FX = { width: 720, height: 600 } as const;

const single = (kind: MagicFxKind, body: string, texture?: boolean): MagicFxProgram => ({
  program: { key: `magic.${kind}`, fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_MAGIC_COMMON, body].join("\n") },
  mode: "single",
  texture,
});

const stage = (kind: MagicFxKind, body: string): MagicFxProgram => ({
  program: { key: `magic.${kind}`, fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_MAGIC_COMMON, GLSL_MAGIC_STAGE, body].join("\n") },
  mode: "stage",
});

export const MAGIC_PROGRAMS: Record<MagicFxKind, MagicFxProgram> = {
  "star-shard": single("star-shard", GLSL_STAR_SHARD),
  "twin-orbit": single("twin-orbit", GLSL_TWIN_ORBIT),
  "meteor-fall": single("meteor-fall", GLSL_STARFALL),
  "astral-verdict": single("astral-verdict", GLSL_ASTRAL_VERDICT),
  "gravity-lens": single("gravity-lens", GLSL_GRAVITY_LENS),
  "star-curtain": stage("star-curtain", GLSL_STAR_CURTAIN),
  "curse-nail": single("curse-nail", GLSL_CURSE_NAIL),
  "talisman-seal": single("talisman-seal", GLSL_TALISMAN_SEAL),
  "binding-hex": single("binding-hex", GLSL_BINDING_HEX),
  "doom-clock": single("doom-clock", GLSL_DOOM_CLOCK),
  "soul-rend": single("soul-rend", GLSL_SOUL_REND, true),
  "spirit-tide": stage("spirit-tide", GLSL_SPIRIT_TIDE),
};
