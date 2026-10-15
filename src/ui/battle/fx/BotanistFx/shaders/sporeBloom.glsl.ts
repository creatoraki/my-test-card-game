/**
 * 植物学家 · 毒孢菌爆。以爆点为零点(t = hitTime()):
 *   展盘  [-0.50, -0.38] 目标身后弹出一面菌褶盘(仰视的菌盖底: 波浪盖缘 + 64 道长短菌褶 + 菌柄孔), 过冲后定住;
 *   蔓生  [-0.48, -0.10] 盘外菌丝光环向外蔓生; 盘面慢转, 光带自盘心向外逐层点亮菌褶;
 *   吸气  [-0.36, -0.04] 盘上 8 枚孢子囊鼓胀发亮, 三道波纹毒环自外向内收拢;
 *   压拍  [-0.06, 0]     盘面微缩蓄力, 孢子囊亮到极点;
 *   爆点  0              盘面破裂: 紫白核闪 + 8 道孢子喷流自各囊射出 + 三重波纹毒环 + 12 枚菌褶碎片飞散;
 *   余爆  0.28           第二轮小一号的毒环;
 *   毒雾  [0, 1.05]      环状毒云翻涌外扩并变稀, 毒泡在目标四周鼓起后破成小光环, 孢子光点上飘;
 *   消散  → 1.10         末尾整体淡出。
 */
export const GLSL_SPORE_BLOOM = /* glsl */ `
const vec3 SPORE_DARK = vec3(0.06, 0.02, 0.09);
const vec2 GILL_C = vec2(0.0, 8.0);
#define GILL_R 150.0
#define POD_R 104.0
#define POD_N 8.0
#define SPIN 0.35
#define ECHO 0.28

float gillScale(float t) {
  float u = prog(t, -0.5, -0.38);
  float pop = 1.0 + 0.12 * sin(u * PI) * (1.0 - u);
  float squeeze = 1.0 - 0.07 * easeOut3(prog(t, -0.06, 0.0));
  return mix(0.4, 1.0, easeOut3(u)) * pop * squeeze;
}

/** 第 i 枚孢子囊在 phase 时刻的盘面角(随盘面顺时针慢转)。 */
float podAngle(float fi, float phase) {
  return fi * (2.0 * PI / POD_N) + PI / POD_N - phase * SPIN;
}

/** 盘外菌丝光环: 自盖缘向外蔓生的发光菌丝网, 脉冲自内向外流动。 */
void drawHyphae(inout vec4 c, vec2 p, float r, float t, float k) {
  float grow = easeOut3(prog(t, -0.48, -0.1));
  float outer = GILL_R + 10.0 + 80.0 * grow;
  float mask = smoothstep(GILL_R - 4.0, GILL_R + 12.0, r) * (1.0 - smoothstep(outer - 30.0, outer, r));
  if (mask <= 0.0) return;
  float n = vnoise(p * 0.04 + uSeed * 9.0);
  float n2 = vnoise(p * 0.09 + uSeed * 4.0 + 7.0);
  float lines = (1.0 - smoothstep(0.0, 0.035, abs(n - 0.5))) + 0.6 * (1.0 - smoothstep(0.0, 0.03, abs(n2 - 0.5)));
  float pulse = 0.65 + 0.35 * sin(r * 0.06 - uPhase * 12.0);
  emit(c, uColor, lines * mask * k * pulse * 0.75);
}

/** 吸气毒环: 三道虚线波纹环自外向内收拢, 循环往复。 */
void drawInhale(inout vec4 c, float r, float a, float t) {
  float k = window4(t, -0.36, -0.28, -0.08, -0.02);
  if (k <= 0.0) return;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float u = fract((t + 0.36) / 0.28 + fi / 3.0);
    float R = mix(250.0, 40.0, u * u);
    float wav = 4.0 * sin(a * 9.0 + fi * 2.0 + uPhase * 6.0);
    float dash = step(0.35, fract(a / (2.0 * PI) * 24.0 + fi * 0.3));
    float fade = smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.7, 1.0, u));
    emit(c, uColor, glowOf(abs(r - R - wav), 1.6) * fade * dash * k * 0.9);
  }
}

void drawGills(inout vec4 c, vec2 q, float t) {
  if (t < -0.5 || t > 0.0) return;
  float sc = gillScale(t);
  vec2 p = (q - GILL_C) / sc;
  float r = length(p);
  if (r > 260.0) return;
  float k = smoothstep(-0.5, -0.44, t);
  float charge = prog(t, -0.36, 0.0);
  float a0 = atan(p.y, p.x);
  float a = a0 + uPhase * SPIN;

  drawInhale(c, r, a0, t);
  drawHyphae(c, p, r, t, k);

  // 盘面: 暗紫半透, 波浪盖缘一圈亮边。
  float rim = GILL_R + 6.0 * sin(a * 14.0) + 3.0 * sin(a * 31.0 + 1.3);
  float dDisk = r - rim;
  paint(c, SPORE_DARK, fillAA(dDisk * sc) * k * 0.66);
  emit(c, uColor, glowOf(abs(dDisk), 7.0) * k * (0.45 + 0.8 * charge));
  emit(c, hotColor(0.45), fillAA((abs(dDisk) - 1.0) * sc) * k);

  // 64 道菌褶(长褶自菌柄孔起、短褶自半径 70 起), 光带自盘心向外扫过时逐层点亮。
  float g64 = a / (2.0 * PI) * 64.0;
  float u64 = fract(g64) - 0.5;
  float r0 = mod(floor(g64), 2.0) < 1.0 ? 30.0 : 70.0;
  float dGill = max(abs(u64) * (2.0 * PI * r / 64.0) - 0.8, max(r0 - r, r - rim + 6.0));
  float front = 30.0 + GILL_R * easeOut3(prog(t, -0.4, -0.1));
  float lit = 0.35 + 0.9 * (1.0 - smoothstep(0.0, 40.0, abs(r - front))) + 0.4 * step(r, front);
  emit(c, uColor, fillAA(dGill * sc) * k * lit * 0.8);

  // 菌柄孔。
  paint(c, vec3(0.0), fillAA((r - 22.0) * sc) * k * 0.5);
  emit(c, hotColor(0.5), fillAA((abs(r - 24.0) - 2.0) * sc) * k);

  // 孢子囊: 环上 8 枚, 之间以虚线菌索相连; 吸气时鼓胀发亮, 压拍时亮到极点。
  if (abs(r - POD_R) > 40.0) return;
  float dash = step(0.5, fract(a / (2.0 * PI) * 48.0));
  emit(c, uColor, fillAA((abs(r - POD_R) - 1.0) * sc) * dash * k * 0.6);
  vec2 f = polarFold(p, POD_N, POD_R, PI / POD_N - uPhase * SPIN);
  float swell = easeOut3(prog(t, -0.36, -0.08));
  float pr = mix(6.0, 17.0, swell) * (1.0 + 0.08 * sin(uPhase * 20.0)) * (1.0 + 0.12 * prog(t, -0.06, 0.0));
  float dPod = length(f) - pr;
  paint(c, SPORE_DARK, fillAA((dPod - 2.5) * sc) * k);
  emit(c, uColor, fillAA(dPod * sc) * k * (0.5 + charge));
  emit(c, hotColor(0.85), glowOf(length(f - vec2(-pr * 0.3, pr * 0.3)), 1.5 + 2.0 * charge) * fillAA(dPod) * k);
  emit(c, uColor, glowOf(max(dPod, 0.0), 4.0 + 10.0 * charge) * k * charge);
}

void drawRupture(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  vec2 p = q - GILL_C;
  float r0 = length(p);
  emit(c, vec3(1.0), glowOf(r0, 40.0) * exp(-t * 10.0) * 1.8);
  emit(c, uColor, glowOf(r0, 170.0) * exp(-t * 6.0) * 0.8);
  emit(c, uColor, exp(-t * 16.0) * 0.22);

  // 8 道孢子喷流: 自各孢子囊沿径向射出, 越远越宽, 边缘噪声翻卷。
  float jk = exp(-t * 5.0);
  for (int i = 0; i < 8; i++) {
    float a = podAngle(float(i), uImpact);
    vec2 lp = rot(p - vec2(cos(a), sin(a)) * POD_R, -a);
    float len = 40.0 + 260.0 * easeOut3(prog(t, 0.0, 0.35));
    if (lp.x < -20.0 || lp.x > len + 40.0 || abs(lp.y) > 40.0) continue;
    float w = 6.0 + 18.0 * clamp(lp.x / len, 0.0, 1.0);
    float n = vnoise(vec2(lp.x * 0.05 - t * 8.0, lp.y * 0.08) + float(i) * 3.1 + uSeed * 7.0);
    float along = smoothstep(-10.0, 10.0, lp.x) * (1.0 - smoothstep(len - 20.0, len + 20.0, lp.x));
    float body = (1.0 - smoothstep(w * 0.5, w, abs(lp.y) + (n - 0.5) * 14.0)) * along;
    paint(c, SPORE_DARK, body * jk * 0.45);
    emit(c, uColor, body * jk * (0.5 + 0.5 * n));
    emit(c, hotColor(0.7), glowOf(abs(lp.y), 2.0) * along * (1.0 - clamp(lp.x / len, 0.0, 1.0)) * jk);
  }
  shockRings(c, p, t, 300.0, 1.0, SPORE_DARK, 18.0);
  shockRings(c, p, t - ECHO, 210.0, 0.55, SPORE_DARK, 12.0);

  // 12 枚菌褶碎片: 菱形暗片带褶纹, 自盘面向外飞散旋转。
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 5.3 + uSeed * 17.0);
    float h2 = hash11(fi * 8.9 + uSeed * 3.0);
    float life = 0.55 + 0.3 * h2;
    float lk = 1.0 - t / life;
    if (lk <= 0.0) continue;
    float a = fi * (2.0 * PI / 12.0) + (h1 - 0.5) * 0.4;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 pos = dir * GILL_R * (0.4 + 0.5 * h2) + dir * (400.0 + 340.0 * h1) * (1.0 - exp(-4.0 * t)) / 4.0 - vec2(0.0, 200.0 * t * t);
    vec2 lp = rot(p - pos, -(a + t * (4.0 + 8.0 * h1)));
    float size = 14.0 + 12.0 * h1;
    vec2 aq = abs(lp);
    float d = (aq.x / size + aq.y / (size * 0.55) - 1.0) * size * 0.45;
    if (d > 8.0) continue;
    float stripe = 1.0 - smoothstep(0.15, 0.4, abs(fract(lp.y * 0.22) - 0.5));
    paint(c, SPORE_DARK, fillAA(d) * lk);
    emit(c, uColor, stripe * fillAA(d) * lk * 0.55);
    emit(c, hotColor(0.5), fillAA(abs(d) - 0.9) * lk);
  }
  emit(c, hotColor(0.6), burst(p, t, uSeed, 14.0, 620.0, 0.5, 120.0, 0.0, 2.0 * PI));
}

/** 环状毒云: 爆点后自盘心外扩翻涌, 后段变稀散去。 */
void drawCloud(inout vec4 c, vec2 q, float t) {
  float k = window4(t, 0.0, 0.08, 0.5, 1.05);
  if (k <= 0.0) return;
  vec2 p = q - GILL_C;
  float r = length(p);
  float ex = prog(t, 0.0, 0.9);
  float R = 70.0 + 150.0 * easeOut3(ex);
  float w = 40.0 + 30.0 * ex;
  float band = 1.0 - smoothstep(w * 0.4, w, abs(r - R));
  if (band <= 0.0) return;
  float n = fbm(p * 0.016 + vec2(0.0, -uPhase * 0.8) + uSeed * 5.0) + band * 0.35;
  float thin = 0.2 * prog(t, 0.4, 1.05);
  float body = smoothstep(0.42 + thin, 0.62 + thin, n) * band;
  paint(c, SPORE_DARK, body * k * 0.55);
  float edge = smoothstep(0.38 + thin, 0.45 + thin, n) * (1.0 - smoothstep(0.45 + thin, 0.52 + thin, n)) * band;
  emit(c, uColor, (edge * 0.6 + body * 0.25) * k);
}

/** 毒泡: 10 个泡在目标四周依次鼓起上浮, 胀满后破成小光环。 */
void drawBubbles(inout vec4 c, vec2 q, float t) {
  if (t <= 0.05 || t > 1.0) return;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.7 + uSeed * 13.0);
    float h2 = hash11(fi * 9.1 + uSeed * 5.0);
    float h3 = hash11(fi * 1.3 + uSeed * 29.0);
    float lt = t - (0.08 + 0.5 * h1);
    float popT = 0.22 + 0.12 * h3;
    if (lt <= 0.0 || lt > popT + 0.14) continue;
    float a = h2 * 2.0 * PI;
    vec2 bp = q - GILL_C - vec2(cos(a), sin(a)) * (60.0 + 120.0 * h3) - vec2(0.0, lt * 70.0);
    float R = (8.0 + 12.0 * h1) * easeOut3(prog(lt, 0.0, popT));
    if (dot(bp, bp) > (R * 2.5 + 8.0) * (R * 2.5 + 8.0)) continue;
    if (lt < popT) {
      float d = length(bp) - R;
      paint(c, SPORE_DARK, fillAA(d) * 0.35);
      emit(c, uColor, fillAA(abs(d) - 1.0) * 0.9 + glowOf(max(d, 0.0), 3.0) * 0.3);
      emit(c, hotColor(0.85), glowOf(length(bp - vec2(-R * 0.35, R * 0.35)), 1.3) * fillAA(d));
    } else {
      float pk = prog(lt, popT, popT + 0.14);
      emit(c, hotColor(0.5), fillAA(abs(length(bp) - R * (1.0 + 1.2 * pk)) - 1.0) * (1.0 - pk));
    }
  }
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 局部压暗: 压拍时最深, 毒雾段慢慢退去。
  float dim = 0.3 * smoothstep(-0.5, -0.3, t) + 0.2 * prog(t, -0.06, 0.0);
  dim *= 1.0 - smoothstep(0.1, 0.8, t);
  paint(c, vec3(0.02, 0.0, 0.03), dim * (1.0 - smoothstep(170.0, 330.0, length(q - GILL_C))));

  drawGills(c, q, t);
  drawCloud(c, q, t);
  drawRupture(c, q, t);
  drawBubbles(c, q, t);

  // 毒雾中上飘的孢子光点。
  float mk = window4(t, 0.05, 0.2, 0.6, 1.05) * (1.0 - smoothstep(150.0, 240.0, length(q - GILL_C)));
  if (mk > 0.0) emit(c, hotColor(0.55), (pollen(q, 20.0, t * 80.0, uSeed) + 0.7 * pollen(q * 0.7, 22.0, t * 40.0, uSeed + 0.5)) * mk);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
