import { THUNDER_TIMELINE as TL } from "../thunderRunTimeline";

// 带括号: 负值宏展开进 `t - T_CUT_A` 之类的表达式时不会粘成别的记号。
const sec = (ms: number) => `(${(ms / 1000).toFixed(3)})`;

/**
 * 雷走 · 迅雷斩主程序。以爆点为零点(t = hitTime()):
 *   蓄电  [-0.20, -0.04] 局部压暗 + 目标周围细碎静电噼啪;
 *   一刀  [-0.12, -0.06] 左下 → 右上, 浅 ∩ 弧, 刃光拖月牙残影, 留下缠电斩痕;
 *   二刀  [-0.035, 0.035] 左上 → 右下, 刀头掠过中心即爆点, 与一刀交成 X;
 *   爆点  0      两道斩痕同时充能爆亮 + 白核闪光 + 四芒星 + 电光冲击环 + 顺刀势火花 + 分叉放电;
 *   复闪  0.10   斩痕换形再亮一次(雷鸣回响);
 *   余电  → 0.58 斩痕与电弧衰减, 末尾 0.12s 整体淡出。
 */
export const GLSL_THUNDER_RUN = /* glsl */ `
#define T_CHARGE_IN ${sec(TL.charge.start)}
#define T_CHARGE_OUT ${sec(TL.charge.end)}
#define T_CUT_A ${sec(TL.cutA.start)}
#define DUR_CUT_A ${sec(TL.cutA.dur)}
#define T_CUT_B ${sec(TL.cutB.start)}
#define DUR_CUT_B ${sec(TL.cutB.dur)}
#define T_RESTRIKE ${sec(TL.restrike)}
#define BEND_A (-0.00045)
#define BEND_B 0.00038

/** 自原点沿 a 方向伸出的细长星芒(两端对称)。 */
float starRay(vec2 q, float a, float len, float w) {
  vec2 r = rot(q, -a);
  return glowOf(abs(r.y), w) * (1.0 - smoothstep(0.0, len, abs(r.x)));
}

/** 蓄电段: 目标周围 4 处细碎静电, 20fps 跳位。 */
void drawStatic(inout vec4 c, vec2 q, float t) {
  float k = smoothstep(T_CHARGE_IN, T_CHARGE_IN + 0.07, t) * (1.0 - smoothstep(T_CHARGE_OUT - 0.04, T_CHARGE_OUT, t));
  if (k <= 0.0) return;
  float frame = floor(uPhase * 20.0);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 center = (vec2(hash11(fi * 2.1 + frame * 1.7 + uSeed), hash11(fi * 6.3 + frame * 0.9 + uSeed)) - 0.5) * vec2(160.0, 130.0);
    float ang = hash11(fi * 4.4 + frame + uSeed) * 2.0 * PI;
    float len = 12.0 + 16.0 * hash11(fi * 8.8 + frame);
    vec2 p = rot(q - center, -ang);
    if (abs(p.x) > len) continue;
    float jag = (vnoise(vec2(p.x * 0.3, fi * 7.0 + frame)) - 0.5) * 8.0;
    float d = abs(p.y - jag) - 0.5;
    float tip = 1.0 - abs(p.x) / len;
    emit(c, hotColor(0.6), fillAA(d) * k * tip);
    emit(c, uColor, glowOf(max(d, 0.0), 3.0) * k * tip * 0.6);
  }
}

/** 爆点: 白核闪光 + 四芒星 + 锯齿电光冲击环 + 火花。 */
void drawImpact(inout vec4 c, vec2 q, float t, float aA, float aB) {
  if (t <= 0.0) return;
  float r0 = length(q);
  float kf = exp(-t * 16.0);
  emit(c, vec3(1.0), glowOf(r0, 22.0) * kf * 1.3);
  emit(c, thunderGlow(), glowOf(r0, 70.0) * kf * 0.5);

  float bis = (aA + aB) * 0.5;
  float ks = exp(-t * 11.0);
  emit(c, vec3(1.0), (starRay(q, bis, 170.0, 1.6) + starRay(q, bis + PI * 0.5, 110.0, 1.6)) * ks);
  emit(c, uColor, (starRay(q, bis + PI * 0.25, 60.0, 1.2) + starRay(q, bis - PI * 0.25, 60.0, 1.2)) * ks * 0.7);

  // 冲击环: 略压扁的椭圆, 边缘按角度噪声抖成锯齿电光, 越扩越细越平。
  float k = clamp(t / 0.3, 0.0, 1.0);
  vec2 qe = q * vec2(1.0, 1.3);
  float frame = floor(uPhase * 30.0);
  vec2 dir = qe / max(length(qe), 0.0001);
  float wob = (vnoise(dir * 3.0 + frame * 1.7) - 0.5) * 18.0 * (1.0 - k);
  float dRing = abs(length(qe) - (16.0 + 140.0 * easeOut3(k)) - wob) - mix(2.0, 0.4, k);
  emit(c, hotColor(0.5), (fillAA(dRing) + 0.6 * glowOf(max(dRing, 0.0), 6.0)) * (1.0 - k) * 0.9);

  // 火花: 一束顺着第二刀的去势前冲, 一圈四散。
  float sp = burst(q, t, uSeed, 14.0, 660.0, 0.34, 240.0, aB - 0.45, 0.9)
           + burst(q, t, uSeed + 0.37, 10.0, 380.0, 0.28, 160.0, 0.0, 2.0 * PI) * 0.7;
  emit(c, hotColor(0.8), sp);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float aA = 0.38 + (uSeed - 0.5) * 0.14;
  float aB = -0.62 + (fract(uSeed * 7.31) - 0.5) * 0.14;
  vec2 rA = rot(q, -aA);
  vec2 rB = rot(q, -aB);

  // 局部压暗: 让细亮的刀光与电弧从立绘上跳出来, 爆点后迅速退去; 边缘提前归零不出方框。
  float dim = 0.28 * smoothstep(T_CHARGE_IN, T_CUT_A, t) * (1.0 - smoothstep(0.02, 0.3, t));
  float dimMask = 1.0 - smoothstep(80.0, 230.0, length(q * vec2(0.8, 1.15)));
  paint(c, vec3(0.0, 0.015, 0.05), dim * dimMask);

  drawStatic(c, q, t);

  float flare = t > 0.0 ? exp(-t * 14.0) : 0.0;
  float restrike = t > T_RESTRIKE ? 0.75 * exp(-(t - T_RESTRIKE) * 18.0) : 0.0;
  float charge = flare + restrike;
  drawCut(c, rA, BEND_A, t - T_CUT_A, DUR_CUT_A, charge, uSeed * 31.0);
  drawCut(c, rB, BEND_B, t - T_CUT_B, DUR_CUT_B, charge, uSeed * 57.0 + 11.0);
  drawBranches(c, rA, BEND_A, t, uSeed * 13.0);
  drawBranches(c, rB, BEND_B, t, uSeed * 29.0 + 5.0);

  drawImpact(c, q, t, aA, aB);

  // 画布边缘 48px 内渐隐: 大半径光晕不会在矩形边界上切出硬边。
  float edge = smoothstep(0.0, 48.0, min(uSize.x * 0.5 - abs(q.x), uSize.y * 0.5 - abs(q.y)));
  gl_FragColor = finalize(c * hitEndFade() * edge);
}
`;
