/**
 * 悬空传送门外围：主题/几何 uniform、地面光斑、外晕、边缘火焰状触须与亮边。
 * 坐标：q 以地面接触线为 y=0、画布中线为 x=0；o 以悬浮椭圆中心为原点。
 * 随激活变速的动画一律用 uPhase(宿主积分的相位)，uActive 只用来提亮。
 */
export const GLSL_PORTAL_UNIFORMS = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uMain;
uniform vec3 uCore;
uniform vec3 uRim;
uniform float uGround;
/** 悬浮椭圆：横半轴、竖半轴、底部离地高度、上下浮动幅度。 */
uniform vec4 uOval;

#if BOSS
#define FLAME_RISE 0.9
#define FLAME_REACH 26.0
#define RIM_WOBBLE 14.0
#else
#define FLAME_RISE 0.5
#define FLAME_REACH 15.0
#define RIM_WOBBLE 7.0
#endif
`;

export const GLSL_PORTAL_RIM = /* glsl */ `
/** 门下方地面的柔和光斑，门浮低时略亮。 */
void drawGround(inout vec4 c, vec2 q, float bob) {
  float lift = 1.0 - bob / max(uOval.w, 0.001) * 0.18;
  float e = length((q - vec2(0.0, 5.0)) / vec2(uOval.x * 1.3, 12.0));
  emit(c, uMain, exp(-e * e * 2.2) * (0.3 + 0.22 * uActive) * lift);
  emit(c, uCore, exp(-e * e * 9.0) * (0.1 + 0.12 * uActive) * lift);
  // 门底到地面之间的一缕淡光
  float gap = uOval.z + bob;
  float beam = smoothstep(uOval.x * 0.6, 0.0, abs(q.x)) * smoothstep(gap + 12.0, 0.0, q.y) * step(0.0, q.y);
  emit(c, uMain, beam * (0.07 + 0.08 * uActive));
}

/** 门外柔光，只在边缘以外可见。 */
void drawHalo(inout vec4 c, vec2 p, float dRim) {
  float edge = smoothstep(0.0, 44.0, min(min(p.x, uSize.x - p.x), min(p.y, uSize.y - p.y)));
  float reach = 16.0 + 10.0 * uActive;
  emit(c, uMain, exp(-max(dRim, 0.0) / reach) * (0.16 + 0.3 * uActive) * step(0.0, dRim) * edge);
}

/** 边缘向外、向上飘动的火焰状触须。fl 为随相位上移的噪声场。 */
void drawFlame(inout vec4 c, float dRim, float fl) {
  float dist = max(dRim, 0.0);
  float tongue = smoothstep(0.36, 0.78, fl + 0.3 - dist / FLAME_REACH);
  emit(c, mix(uMain, uRim, 0.5), tongue * step(0.0, dRim) * (0.55 + 0.35 * uActive));
}

/** 边缘亮线：细的亮芯 + 宽一些的边光。 */
void drawRim(inout vec4 c, float dRim) {
  float d = abs(dRim + 1.5);
  emit(c, uCore, exp(-d / 1.6) * (0.85 + 0.35 * uActive));
  emit(c, uRim, exp(-d / 5.0) * (0.5 + 0.4 * uActive));
}
`;
