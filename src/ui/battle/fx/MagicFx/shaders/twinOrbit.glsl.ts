/**
 * 预言家 · 双星轨。以爆点为零点(t = hitTime()):
 *   起轨  [-0.50, -0.40] 画布左侧一金一紫两颗星互绕现身;
 *   逼近  [-0.40, 0]     双星绕公共质心互旋前进, 轨道半径收窄、转速飙升, 各拖一段轨迹;
 *   合星  0              双星撞合: 白闪 + 两道倾斜的轨道环交叉外扩 + 星火四散;
 *   余辉  → 1.20         残留的两条轨道弧慢慢淡去, 末尾整体淡出。
 */
export const GLSL_TWIN_ORBIT = /* glsl */ `
#define ORBIT_START (-0.5)
const vec2 ORBIT_FROM = vec2(-320.0, 10.0);

vec2 orbitCenter(float t) {
  float u = prog(t, ORBIT_START, 0.0);
  float e = u * (0.3 + 0.7 * u);
  return mix(ORBIT_FROM, vec2(0.0), e) + vec2(0.0, sin(e * PI) * 60.0);
}

float orbitRadius(float t) {
  float u = prog(t, ORBIT_START, 0.0);
  return mix(58.0, 0.0, u * u);
}

/** 互旋角: 半径越小转得越快(角速度积分的近似闭式)。 */
float orbitAngle(float t) {
  float u = prog(t, ORBIT_START, 0.0);
  return u * 9.0 + u * u * u * 16.0 + uSeed * 6.0;
}

/** 第 i 颗星(0 金 / 1 紫)在时刻 t 的位置; 轨道面略倾斜, 读作有纵深的互绕。 */
vec2 starPos(float t, float side) {
  float a = orbitAngle(t) + side * PI;
  vec2 o = vec2(cos(a), sin(a) * 0.45) * orbitRadius(t);
  return orbitCenter(t) + rot(o, 0.35);
}

void drawStars(inout vec4 c, vec2 q, float t) {
  if (t < ORBIT_START || t > 0.0) return;
  float kin = prog(t, ORBIT_START, ORBIT_START + 0.1);
  for (int s = 0; s < 2; s++) {
    float side = float(s);
    vec3 col = s == 0 ? mix(vec3(1.0, 0.85, 0.5), uColor, 0.15) : uColor;
    // 轨迹: 回溯 10 个历史位置。
    for (int i = 0; i < 10; i++) {
      float fi = float(i);
      float t0 = t - fi * 0.014;
      float t1 = t - (fi + 1.0) * 0.014;
      if (t1 < ORBIT_START) break;
      float d = sdSegment(q, starPos(t0, side), starPos(t1, side));
      float f = 1.0 - fi / 10.0;
      emit(c, col, (fillAA(d - 1.8 * f) * 0.9 + glowOf(max(d, 0.0), 5.0) * 0.4) * f * kin);
    }
    vec2 p = q - starPos(t, side);
    // 位于轨道后半圈的星略暗略小。
    float depth = 0.75 + 0.25 * sin(orbitAngle(t) + side * PI);
    emit(c, vec3(1.0), twinkle(rot(p, uPhase * 8.0), 18.0 * depth) * kin);
    emit(c, col, glowOf(length(p), 14.0 * depth) * kin * 0.9);
  }
}

void drawMerge(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 28.0) * exp(-t * 12.0) * 1.5);
  emit(c, mix(vec3(1.0, 0.85, 0.5), uColor, 0.5), glowOf(r0, 100.0) * exp(-t * 7.0) * 0.55);
  float ks = exp(-t * 9.0);
  emit(c, vec3(1.0), (rayAt(q, 0.35, 200.0, 1.4) + rayAt(q, 0.35 + PI * 0.5, 120.0, 1.4)) * ks);

  // 两道倾斜轨道环交叉外扩: 一金一紫。
  float k = prog(t, 0.0, 0.5);
  for (int s = 0; s < 2; s++) {
    float side = float(s);
    vec3 col = s == 0 ? vec3(1.0, 0.85, 0.5) : uColor;
    vec2 p = rot(q, -(0.5 - side * 1.0));
    float R = 24.0 + 200.0 * easeOut3(k);
    float d = abs(sdEllipse(p, vec2(R, R * 0.36))) - mix(2.5, 0.6, k);
    emit(c, mix(col, vec3(1.0), 0.3), (fillAA(d) + 0.5 * glowOf(max(d, 0.0), 6.0)) * (1.0 - k));
  }
  float sp = burst(q, t, uSeed, 14.0, 520.0, 0.5, 200.0, 0.0, 2.0 * PI)
           + burst(q, t, uSeed + 0.29, 10.0, 420.0, 0.42, 120.0, -0.5, 1.0) * 0.8;
  emit(c, hotColor(0.7), sp);
}

/** 余辉: 两颗星的残影绕原点再转半圈后散成光尘。 */
void drawAfterglow(inout vec4 c, vec2 q, float t) {
  float k = window4(t, 0.05, 0.12, 0.45, 0.8);
  if (k <= 0.0) return;
  float R = 40.0 + 60.0 * prog(t, 0.05, 0.8);
  for (int s = 0; s < 2; s++) {
    float side = float(s);
    float a = t * 5.0 + side * PI + uSeed * 6.0;
    vec2 pos = rot(vec2(cos(a), sin(a) * 0.45) * R, 0.35);
    vec3 col = s == 0 ? vec3(1.0, 0.85, 0.5) : uColor;
    emit(c, col, twinkle(q - pos, 9.0) * k * 0.9);
  }
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.25 * smoothstep(-0.5, -0.2, t) * (1.0 - smoothstep(0.05, 0.4, t));
  paint(c, vec3(0.03, 0.01, 0.08), dim * (1.0 - smoothstep(100.0, 260.0, length(q))));

  drawStars(c, q, t);
  drawMerge(c, q, t);
  drawAfterglow(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
