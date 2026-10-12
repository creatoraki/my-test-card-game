/**
 * 预言家 · 引力透镜。以爆点为零点(t = hitTime()):
 *   成核  [-0.60, -0.15] 目标中心撕开一点黑核并长大, 外围光子环 + 倾斜吸积盘旋转发亮;
 *                        两条对数螺旋星臂把四周星尘卷进来(星河倒灌);
 *   坍缩  [-0.15, 0]     吸积盘与星臂急速收进黑核, 黑核缩成一点;
 *   爆点  0              白紫闪光 + 爱因斯坦环(双色描边)外扩 + 星尘反向喷出;
 *   余波  → 1.40         两道引力涟漪扩散, 末尾整体淡出。
 */
export const GLSL_GRAVITY_LENS = /* glsl */ `
float coreRadius(float t) {
  float grow = easeOut3(prog(t, -0.6, -0.2));
  float collapse = pow(prog(t, -0.15, 0.0), 1.5);
  return 36.0 * grow * (1.0 - collapse);
}

void drawSpiral(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.6, -0.4, -0.06, 0.0);
  if (k <= 0.0) return;
  float suck = pow(prog(t, -0.15, 0.0), 1.4);
  vec2 p = q / mix(1.0, 0.15, suck);
  float r = length(p);
  float a = atan(p.y, p.x);
  float spin = (t + 0.6) * (2.0 + 6.0 * (t + 0.6));
  // 两条对数螺旋臂: 角度随 log(r) 偏移。
  float arm = cos(2.0 * (a - log(max(r, 1.0)) * 2.2 + spin));
  float armMask = smoothstep(0.35, 0.95, arm) * smoothstep(40.0, 70.0, r) * (1.0 - smoothstep(150.0, 260.0, r));
  float dust = fbm(vec2(a * 3.0 + spin * 2.0, r * 0.05 - spin));
  emit(c, uColor, armMask * (0.25 + 0.6 * dust) * k);
  // 臂上的亮星点。
  vec2 cell = vec2(a * 12.0 + spin * 6.0, r * 0.12);
  float star = smoothstep(0.86, 0.97, hash21(floor(cell)) ) * smoothstep(0.35, 0.0, length(fract(cell) - 0.5));
  emit(c, hotColor(0.7), star * armMask * k * 1.4);
}

void drawCore(inout vec4 c, vec2 q, float t) {
  float R = coreRadius(t);
  if (R <= 0.3) return;
  float k = window4(t, -0.6, -0.5, -0.02, 0.0);
  float r = length(q);
  float spin = (t + 0.6) * (3.0 + 10.0 * (t + 0.6));
  // 吸积盘: 倾斜椭圆带, 噪声流纹, 近侧(下半)更亮。
  vec2 pd = rot(q, -0.3);
  vec2 rad = vec2(R * 2.6, R * 0.7);
  float e = length(pd / rad);
  float band = smoothstep(0.55, 0.75, e) * (1.0 - smoothstep(0.95, 1.25, e));
  float ang = atan(pd.y / rad.y, pd.x / rad.x);
  float flow = fbm(vec2(ang * 2.0 - spin * 2.0, e * 4.0));
  float near = pd.y < 0.0 ? 1.0 : 0.55;
  // 黑核挡住盘的后半圈。
  float behind = pd.y > 0.0 ? smoothstep(R - 1.0, R + 1.0, r) : 1.0;
  emit(c, mix(uColor, vec3(1.0, 0.8, 0.95), flow * 0.6), band * (0.5 + flow) * near * behind * k * 1.1);
  // 黑核 + 光子环。
  paint(c, vec3(0.0), fillAA(r - R) * k);
  float dRing = abs(r - R - 1.5) - 1.2;
  emit(c, hotColor(0.65), (fillAA(dRing) + glowOf(max(dRing, 0.0), 5.0) * 0.8) * k);
  emit(c, uColor, glowOf(max(r - R, 0.0), 18.0) * k * 0.45);
}

void drawRelease(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 30.0) * exp(-t * 12.0) * 1.5);
  emit(c, uColor, glowOf(r0, 120.0) * exp(-t * 6.0) * 0.6);
  // 爱因斯坦环: 内紫外白两道描边, 环上有被拉长的星像弧段。
  float k = prog(t, 0.0, 0.5);
  float R = 30.0 + 180.0 * easeOut3(k);
  float w = mix(3.0, 0.6, k);
  float dIn = abs(r0 - R + 3.0) - w;
  float dOut = abs(r0 - R - 3.0) - w * 0.7;
  float arcs = 0.55 + 0.45 * smoothstep(0.2, 0.8, vnoise(vec2(atan(q.y, q.x) * 3.0, uSeed * 10.0)));
  emit(c, uColor, (fillAA(dIn) + 0.6 * glowOf(max(dIn, 0.0), 6.0)) * (1.0 - k) * arcs);
  emit(c, vec3(1.0, 0.9, 0.95), fillAA(dOut) * (1.0 - k) * arcs);
  // 两道淡涟漪。
  for (int i = 0; i < 2; i++) {
    float lt = t - 0.1 - float(i) * 0.14;
    float kr = prog(lt, 0.0, 0.6);
    if (lt <= 0.0 || kr >= 1.0) continue;
    float dR = abs(r0 - (50.0 + 230.0 * easeOut3(kr))) - 0.8;
    emit(c, uColor, (fillAA(dR) * 0.6 + 0.4 * glowOf(max(dR, 0.0), 8.0)) * (1.0 - kr) * 0.7);
  }
  float sp = burst(q, t, uSeed, 14.0, 600.0, 0.5, 0.0, 0.0, 2.0 * PI)
           + burst(q, t, uSeed + 0.61, 12.0, 380.0, 0.6, 0.0, 0.3, 2.0 * PI) * 0.7;
  emit(c, hotColor(0.6), sp);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.38 * smoothstep(-0.6, -0.25, t) * (1.0 - smoothstep(0.05, 0.45, t));
  paint(c, vec3(0.02, 0.0, 0.05), dim * (1.0 - smoothstep(120.0, 290.0, length(q))));

  drawSpiral(c, q, t);
  drawCore(c, q, t);
  drawRelease(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
