import { GLSL_COMMON, type GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { GLSL_SHADOW_FIGURE, GLSL_SHADOW_UNIFORMS } from "./shadowFigure.glsl";

/** 绘制顺序：黑泥 → 触须 → 黑烟 → 人形 → 光眼。 */
const MAIN = /* glsl */ `
void main() {
  vec2 p = vUv * uSize;
  vec2 q = vec2(p.x - uSize.x * 0.5, p.y - uGround);
  float t = uPhase;
  float grow = smoothstep(uStart, uStart + 0.55, t);
  float rise = t < uRise.x ? 0.0 : riseAmount(t);
  vec4 c = vec4(0.0);
  drawPool(c, q, t, grow);
  drawTendrils(c, q, t, grow * (0.45 + 0.55 * clamp(rise, 0.0, 1.0)));
  drawWisps(c, q, t, rise);
  drawFigure(c, q, t, rise);
  drawEyes(c, q, t, rise);
  gl_FragColor = finalize(c);
}
`;

/** 遇敌黑影：地面黑泥涌起、凝成扭曲人形、睁开红色光眼。 */
export const SHADOW_ENCOUNTER_PROGRAM: GlslProgramDef = {
  key: "shadow.encounter",
  fragment: [GLSL_SHADOW_UNIFORMS, GLSL_COMMON, GLSL_SHADOW_FIGURE, MAIN].join("\n"),
};

/** 画布几何(设计 px)。chestY 为胸口离地高度，进战斗的玻璃碎裂以此为圆心。 */
export const SHADOW_FIGURE_GEOMETRY = {
  width: 440,
  height: 480,
  groundInset: 44,
  chestY: 170,
} as const;
