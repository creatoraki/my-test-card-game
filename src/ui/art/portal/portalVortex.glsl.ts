/**
 * 悬空传送门内部：旋涡与上飘光粒。
 * 所有运动都由 uPhase 驱动(激活时宿主把相位推进速度平滑提升到 2 倍)，uActive 只负责提亮。
 * BOSS=1 时旋涡更快更乱，中心为暗眼并伴随闪烁的裂纹闪电，光粒换成余烬。
 */
export const GLSL_PORTAL_VORTEX = /* glsl */ `
#if BOSS
#define VORTEX_ARMS 5.0
#define VORTEX_SPEED 0.6
#define VORTEX_WARP 2.3
#define MOTE_SPEED 40.0
#else
#define VORTEX_ARMS 3.0
#define VORTEX_SPEED 0.3
#define VORTEX_WARP 1.6
#define MOTE_SPEED 26.0
#endif

/** v 为椭圆归一化坐标(边缘 r=1)，dRim 为到扰动边缘的距离(内部为负)。 */
vec3 vortex(vec2 v, float dRim) {
  float r = length(v);
  float ang = atan(v.y, v.x);
  float t = uPhase * VORTEX_SPEED + uSeed * 10.0;

  float arms = 0.5 + 0.5 * sin(VORTEX_ARMS * ang + 5.5 * log(r + 0.06) - t * 3.0);
  float sw = ang + t + VORTEX_WARP / (r + 0.45);
  vec2 pp = vec2(cos(sw), sin(sw)) * (r * 2.4 + 0.6);
  float n = fbm(pp * 1.6 + vec2(uSeed * 13.0, 0.0));
  float e = arms * 0.55 + n * 0.75 - r * 0.32;

  vec3 col = mix(uDeep, uMain, smoothstep(0.25, 0.78, e));
#if BOSS
  col *= smoothstep(0.04, 0.42, r);
  float n3 = fbm(pp * 2.6 - vec2(t * 0.5, 0.0));
  float flick = step(0.5, hash21(vec2(floor(uPhase * 9.0), uSeed)));
  float branch = smoothstep(0.55, 0.7, fbm(v * 1.3 + vec2(floor(uPhase * 3.0) * 1.7, uSeed)));
  float bolt = smoothstep(0.014, 0.0, abs(n3 - 0.5)) * smoothstep(0.15, 0.45, r) * branch;
  col += uCore * bolt * (0.3 + 0.7 * flick) * (0.8 + 0.4 * uActive);
  col = mix(col, uCore, smoothstep(0.85, 1.1, e) * 0.7);
#else
  col = mix(col, uCore, smoothstep(0.78, 1.1, e + (1.0 - r) * 0.2) * 0.85);
#endif
  col *= 0.82 + 0.3 * uActive;
  col += uRim * exp(dRim / 7.0) * (0.5 + 0.45 * uActive);
  return col;
}

/** 三层上飘光粒：门内全域 + 边缘外一圈。 */
void drawMotes(inout vec4 c, vec2 o, float dRim) {
  float inside = fillAA(dRim + 2.0);
  float outside = (1.0 - inside) * exp(-max(dRim, 0.0) / 16.0);
  float mask = inside + outside * 0.6;
  if (mask <= 0.001) return;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float cell = 16.0 + fi * 9.0;
    vec2 g = (o + vec2(fi * 31.7 + uSeed * 57.0, -uPhase * MOTE_SPEED * (0.7 + fi * 0.25))) / cell;
    vec2 id = floor(g);
    float h = hash21(id + fi * 7.13 + uSeed);
    vec2 jitter = vec2(hash21(id + 3.1), hash21(id + 8.7)) - 0.5;
    vec2 f = fract(g) - 0.5 - jitter * 0.6;
    float rad = 1.0 + 1.3 * hash21(id + 5.3);
    float d = length(f * cell) - rad;
    float tw = 0.55 + 0.45 * sin(uPhase * (2.0 + h * 4.0) + h * 40.0);
    float on = step(0.74, h) * tw * mask;
    float k = clamp(0.5 - d / uAA, 0.0, 1.0) + exp(-max(d, 0.0) / 2.5) * 0.35;
    emit(c, mix(uMain, uCore, h), k * on * (0.85 + 0.3 * uActive));
  }
}
`;
