import { GLSL_COMMON, type GlslProgramDef } from "@/ui/common/fx/GlslSprite";
import { GLSL_PORTAL_RIM, GLSL_PORTAL_UNIFORMS } from "./portalRim.glsl";
import { GLSL_PORTAL_VORTEX } from "./portalVortex.glsl";

/** 绘制顺序：地面光斑 → 外晕 → 边缘触须 → 门内旋涡 → 亮边 → 光粒。 */
const MAIN = /* glsl */ `
void main() {
  vec2 p = vUv * uSize;
  vec2 q = vec2(p.x - uSize.x * 0.5, p.y - uGround);
  float bob = sin(uTime * 1.1 + uSeed * 6.0) * uOval.w;
  vec2 o = q - vec2(0.0, uOval.z + uOval.y + bob);
  vec2 v = o / uOval.xy;
  float fl = fbm(o * vec2(0.03, 0.022) - vec2(0.0, uPhase * FLAME_RISE) + uSeed * 7.0);
  float dRim = sdEllipse(o, uOval.xy) + (fl - 0.5) * RIM_WOBBLE;
  vec4 c = vec4(0.0);
  drawGround(c, q, bob);
  drawHalo(c, p, dRim);
  drawFlame(c, dRim, fl);
  if (dRim < 1.0) paint(c, vortex(v, dRim), fillAA(dRim));
  drawRim(c, dRim);
  drawMotes(c, o, dRim);
  gl_FragColor = finalize(c);
}
`;

function portalFragment(boss: boolean): string {
  return [
    `#define BOSS ${boss ? 1 : 0}`,
    GLSL_PORTAL_UNIFORMS,
    GLSL_COMMON,
    GLSL_PORTAL_RIM,
    GLSL_PORTAL_VORTEX,
    MAIN,
  ].join("\n");
}

/** 房间传送门：悬空能量门。 */
export const ROOM_PORTAL_PROGRAM: GlslProgramDef = { key: "portal.room", fragment: portalFragment(false) };
/** 首领红门：更大的悬空血红门，暗眼旋涡 + 闪电 + 更猛烈的边缘触须。 */
export const BOSS_GATE_PROGRAM: GlslProgramDef = { key: "portal.boss", fragment: portalFragment(true) };
