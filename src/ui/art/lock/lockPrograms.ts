import { GLSL_COMMON, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_PADLOCK, GLSL_PADLOCK_UNIFORMS } from "./padlock.glsl";

/** 绘制顺序：刻度环 → 轮廓外晕 → 锁梁 → 锁身(含锁孔) → 扫描线 → 拒绝闪光。 */
const MAIN = /* glsl */ `
void main() {
  vec2 p = vUv * uSize - uSize * 0.5;
  float t = uPhase;
  float deny = uActive;
  vec3 glow = mix(uGlow, uAlert, deny);
  float lit = 0.9 + 0.1 * vnoise(vec2(uTime * 9.0, uSeed * 13.0));
  // 常态缓慢上下浮动；拒绝时横向急抖
  p.y -= sin(uTime * 1.4 + uSeed * 6.28) * 3.0;
  p.x += deny * sin(uTime * 58.0) * 5.0;
  float dAll = min(sdRoundBox(p - vec2(0.0, BODY_Y), BODY_HALF, 8.0), sdShackle(p - vec2(0.0, SHACKLE_Y)));
  vec4 c = vec4(0.0);
  drawRings(c, p, glow, t, lit * (1.0 + deny * 0.8));
  drawShackle(c, p);
  drawBody(c, p, glow, t);
  drawHolo(c, p, dAll, glow, t, lit);
  emit(c, uAlert, deny * 0.22 * fillAA(dAll));
  gl_FragColor = finalize(c);
}
`;

/** 未开放建筑的锁头。 */
export const PADLOCK_PROGRAM: GlslProgramDef = {
  key: "town.padlock",
  fragment: [GLSL_PADLOCK_UNIFORMS, GLSL_COMMON, GLSL_PADLOCK, MAIN].join("\n"),
};

/** 画布几何(设计 px)：锁头居中，外圈刻度环半径约 75。 */
export const PADLOCK_GEOMETRY = { width: 180, height: 180 } as const;

/** 常态琥珀警示色、拒绝时的告警红。 */
export const PADLOCK_UNIFORMS: GlslUniforms = {
  uGlow: [1.0, 0.62, 0.2],
  uAlert: [1.0, 0.2, 0.14],
};
