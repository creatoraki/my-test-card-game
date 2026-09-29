import { GLSL_COMMON, type GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON } from "./glslHitCommon.glsl";
import { GLSL_HIT_BUFF } from "./shaders/buff.glsl";
import { GLSL_HIT_DEBUFF } from "./shaders/debuff.glsl";
import { GLSL_HIT_FIRE } from "./shaders/fire.glsl";
import { GLSL_HIT_HEAL } from "./shaders/heal.glsl";
import { GLSL_HIT_LIGHTNING } from "./shaders/lightning.glsl";
import { GLSL_HIT_POISON } from "./shaders/poison.glsl";
import { GLSL_HIT_SHIELD } from "./shaders/shield.glsl";
import { GLSL_HIT_SHOT } from "./shaders/shot.glsl";
import { GLSL_HIT_SLASH } from "./shaders/slash.glsl";
import { GLSL_HIT_SMASH } from "./shaders/smash.glsl";

/** 与 CardAnim 同名的 GLSL 命中特效种类(攻击系 + 辅助系 + 减益)。 */
export type GlslHitKind =
  | "slash"
  | "smash"
  | "shot"
  | "fire"
  | "lightning"
  | "poison"
  | "heal"
  | "buff"
  | "debuff"
  | "shield";

export interface GlslHitSpec {
  program: GlslProgramDef;
  /** 画布设计 px 尺寸；命中点固定在画布中心。 */
  width: number;
  height: number;
  /** 挂载 → 完全淡出的总时长(ms)。爆点由 ANIM[*].proc.impactMs 决定，两者须一起调。 */
  totalMs: number;
  /** 目标为我方时垂直翻转(弹道类：画面按「自下而上」绘制)。 */
  flipOnPlayer?: boolean;
}

function program(kind: GlslHitKind, body: string): GlslProgramDef {
  return { key: `hit.${kind}`, fragment: [GLSL_COMMON, GLSL_HIT_COMMON, body].join("\n") };
}

export const GLSL_HIT_SPECS: Record<GlslHitKind, GlslHitSpec> = {
  slash: { program: program("slash", GLSL_HIT_SLASH), width: 260, height: 260, totalMs: 620 },
  smash: { program: program("smash", GLSL_HIT_SMASH), width: 260, height: 260, totalMs: 650 },
  shot: { program: program("shot", GLSL_HIT_SHOT), width: 260, height: 260, totalMs: 640, flipOnPlayer: true },
  fire: { program: program("fire", GLSL_HIT_FIRE), width: 260, height: 260, totalMs: 760 },
  lightning: { program: program("lightning", GLSL_HIT_LIGHTNING), width: 260, height: 340, totalMs: 600 },
  poison: { program: program("poison", GLSL_HIT_POISON), width: 260, height: 260, totalMs: 800 },
  // 辅助系: 光柱/光纹向上走, 画布加高; 方向语义(受益向上)不随阵营翻转。
  heal: { program: program("heal", GLSL_HIT_HEAL), width: 260, height: 340, totalMs: 1050 },
  buff: { program: program("buff", GLSL_HIT_BUFF), width: 260, height: 340, totalMs: 950 },
  debuff: { program: program("debuff", GLSL_HIT_DEBUFF), width: 260, height: 300, totalMs: 880 },
  shield: { program: program("shield", GLSL_HIT_SHIELD), width: 260, height: 260, totalMs: 1000 },
};
