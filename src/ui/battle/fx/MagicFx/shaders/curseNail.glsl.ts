/**
 * 咒术师 · 咒钉。以爆点为零点(t = hitTime()):
 *   起咒  [-0.34, 0]    目标周围秽气旋绕成环, 方印咒阵自噪声中显形;
 *   飞钉  [-0.10, 0]    黑芯青边的长咒钉自左上疾射, 身后拖残影;
 *   爆点  0             咒钉钉入目标: 暗色冲击 + 青光裂纹七道放射 + 顺势火星;
 *   残留  [0, 0.55]     咒钉余震抖动, 头顶厄运之眼弹出;
 *   消散  [0.50, 0.85]  咒钉按噪声溶解成青色余烬, 末尾整体淡出。
 */
export const GLSL_CURSE_NAIL = /* glsl */ `
#define NAIL_ANG (-0.22)
#define NAIL_LEN 150.0
const vec3 CURSE_DARK = vec3(0.05, 0.015, 0.08);

void drawMiasma(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.34, -0.15, 0.25, 0.7);
  if (k <= 0.0) return;
  float r = length(q);
  float a = atan(q.y, q.x);
  float sm = fbm(vec2(a * 1.6 + uPhase * 2.2 + uSeed * 9.0, r * 0.018 - uPhase * 0.9));
  float band = smoothstep(40.0, 80.0, r) * (1.0 - smoothstep(150.0, 210.0, r));
  float body = smoothstep(0.42, 0.62, sm) * band;
  paint(c, CURSE_DARK, body * k * 0.6);
  float rim = smoothstep(0.4, 0.46, sm) * (1.0 - smoothstep(0.46, 0.54, sm)) * band;
  emit(c, uColor, rim * k * 0.55);
}

void drawSeal(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.34, -0.12, 0.08, 0.5);
  if (k <= 0.0) return;
  float spin = (t + 0.34) * 0.9;
  vec2 p = rot(q, -spin);
  // 噪声溶解式显形。
  float n = vnoise(q * 0.05 + uSeed * 13.0);
  float reveal = prog(t, -0.34, -0.1) * 1.1;
  float shown = smoothstep(n - 0.12, n, reveal);
  float dDiamond = abs(sdBox(rot(p, PI * 0.25), vec2(86.0))) - 1.0;
  float dSquare = abs(sdBox(p, vec2(86.0))) - 0.8;
  float dCircle = abs(length(p) - 128.0) - 1.0;
  float dInner = abs(length(p) - 60.0) - 0.7;
  float d = min(min(dDiamond, dSquare), min(dCircle, dInner));
  float flash = t > 0.0 ? 1.0 + 1.5 * exp(-t * 14.0) : 1.0;
  emit(c, uColor, (fillAA(d) * 0.8 + 0.35 * glowOf(max(d, 0.0), 4.0)) * shown * k * flash);
  // 八角各缀一个小符点。
  float a8 = (floor((atan(p.y, p.x) + PI) / (2.0 * PI) * 8.0) + 0.5) * (PI * 0.25) - PI;
  float dDot = length(p - 128.0 * vec2(cos(a8), sin(a8))) - 4.0;
  emit(c, hotColor(0.6), (fillAA(dDot) + 0.5 * glowOf(max(dDot, 0.0), 4.0)) * shown * k);
}

/** 钉尖位置: 飞行段沿钉轴加速推进, 爆点后定在目标中心略深处并余震抖动。 */
vec2 nailTip(float t) {
  vec2 dir = vec2(cos(NAIL_ANG), sin(NAIL_ANG));
  float u = prog(t, -0.1, 0.0);
  vec2 tip = dir * mix(-470.0, 16.0, u * (0.35 + 0.65 * u));
  if (t > 0.0) {
    vec2 perp = vec2(-dir.y, dir.x);
    tip += perp * sin(t * 95.0) * 5.0 * exp(-t * 9.0) - dir * 6.0 * exp(-t * 30.0);
  }
  return tip;
}

void drawNail(inout vec4 c, vec2 q, float t) {
  if (t < -0.1 || t > 0.86) return;
  vec2 r = rot(q - nailTip(t), -NAIL_ANG);
  // 溶解: 自钉头向钉尖推进的噪声阈值。
  float dis = prog(t, 0.5, 0.82);
  float n = vnoise(r * 0.11 + uSeed * 7.0) * 0.7 + 0.3 * clamp(-r.x / NAIL_LEN, 0.0, 1.0);
  float alive = 1.0 - smoothstep(n - 0.06, n, dis * 1.1);
  float ember = smoothstep(n - 0.14, n - 0.06, dis * 1.1) * alive;

  // 钉身: 自钉尖向后渐宽的长三角; 钉头: 圆环 + 一道横档。
  float wHalf = 1.0 + 6.0 * clamp(-r.x / NAIL_LEN, 0.0, 1.0);
  float dBlade = max(abs(r.y) - wHalf, max(r.x, -NAIL_LEN - r.x));
  float dRing = abs(length(r - vec2(-NAIL_LEN - 9.0, 0.0)) - 8.0) - 2.2;
  float dGuard = sdBox(r - vec2(-NAIL_LEN + 4.0, 0.0), vec2(2.5, 13.0));
  float d = min(dBlade, min(dRing, dGuard));
  // 爆点后钉尖一截没入目标, 稍作淡化。
  float sink = t > 0.0 ? 1.0 - 0.55 * smoothstep(-40.0, 0.0, r.x) : 1.0;

  float body = fillAA(d) * alive * sink;
  paint(c, CURSE_DARK, body * 0.95);
  emit(c, hotColor(0.35), glowOf(abs(d), 1.6) * alive * sink * 0.9);
  emit(c, uColor, glowOf(max(d, 0.0), 8.0) * alive * sink * 0.45);
  float dSpine = max(abs(r.y) - 0.6, max(r.x + 8.0, -NAIL_LEN + 6.0 - r.x));
  emit(c, hotColor(0.7), fillAA(dSpine) * alive * sink * 0.7);
  emit(c, hotColor(0.6), ember * 1.4);

  // 飞行残影: 钉头后方一条渐隐的拖尾。
  if (t <= 0.0) {
    float speed = prog(t, -0.1, 0.0);
    float tailLen = 60.0 + 240.0 * speed;
    float x = -NAIL_LEN - r.x;
    if (x > 0.0 && x < tailLen) {
      float f = 1.0 - x / tailLen;
      emit(c, uColor, glowOf(abs(r.y), 2.0 + 4.0 * (1.0 - f)) * f * f * 0.8);
    }
  }
}

void drawCracks(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float grow = easeOut3(t / 0.08);
  float k = 1.0 - smoothstep(0.35, 0.78, t);
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float a = fi * (2.0 * PI / 7.0) + (hash11(fi * 4.3 + uSeed * 11.0) - 0.5) * 0.6 + uSeed * 3.0;
    float len = (70.0 + 70.0 * hash11(fi * 7.9 + uSeed * 3.0)) * grow;
    vec2 p = rot(q, -a);
    if (p.x < -4.0 || p.x > len + 4.0) continue;
    float along = clamp(p.x / max(len, 1.0), 0.0, 1.0);
    float jag = (vnoise(vec2(p.x * 0.09, fi * 5.3 + uSeed * 20.0)) - 0.5) * 18.0 * along;
    float d = abs(p.y - jag) - 1.6 * (1.0 - along) - 0.3;
    paint(c, CURSE_DARK, fillAA(d - 0.8) * k * 0.9);
    emit(c, uColor, glowOf(max(d, 0.0), 3.5) * (1.0 - along * 0.6) * k * 0.9);
  }
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, hotColor(0.7), glowOf(r0, 20.0) * exp(-t * 14.0) * 1.2);
  // 暗色冲击环: 黑芯外扩, 外缘青光。
  float k = prog(t, 0.0, 0.38);
  float R = 18.0 + 170.0 * easeOut3(k);
  float dRing = abs(r0 - R) - mix(8.0, 1.0, k);
  paint(c, CURSE_DARK, fillAA(dRing) * (1.0 - k) * 0.7);
  emit(c, uColor, glowOf(abs(r0 - R - mix(8.0, 1.0, k)), 3.0) * (1.0 - k));
  // 顺钉势前冲的火星 + 少量逆溅。
  float sp = burst(q, t, uSeed, 14.0, 520.0, 0.36, 160.0, NAIL_ANG - 0.5, 1.0)
           + burst(q, t, uSeed + 0.71, 8.0, 260.0, 0.3, 120.0, PI + NAIL_ANG - 0.6, 1.2) * 0.6;
  emit(c, hotColor(0.6), sp);
}

/** 厄运之眼: 爆点后在目标头顶弹出, 瞳孔竖缝, 一闭眼收场。 */
void drawDoomEye(inout vec4 c, vec2 q, float t) {
  float k = window4(t, 0.06, 0.14, 0.62, 0.78);
  if (k <= 0.0) return;
  float pop = easeOut3(prog(t, 0.06, 0.2));
  float open = (1.0 - smoothstep(0.55, 0.7, t)) * pop;
  vec2 p = (q - vec2(0.0, 150.0)) / mix(0.6, 1.0, pop);
  float dEye = sdAlmond(p, 30.0, 13.0 * open + 0.5);
  float dOutline = abs(dEye) - 1.2;
  paint(c, CURSE_DARK, fillAA(dEye) * k * 0.9);
  emit(c, uColor, (fillAA(dOutline) + 0.5 * glowOf(max(dOutline, 0.0), 5.0)) * k);
  float dIris = abs(length(p) - 8.0) - 1.2;
  float dPupil = sdAlmond(p.yx, 8.0, 2.2);
  float inside = fillAA(dEye);
  emit(c, hotColor(0.4), fillAA(dIris) * inside * k);
  emit(c, hotColor(0.8), fillAA(dPupil) * inside * k * (0.7 + 0.3 * sin(uPhase * 20.0)));
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.3 * smoothstep(-0.34, -0.1, t) * (1.0 - smoothstep(0.1, 0.55, t));
  paint(c, vec3(0.0, 0.02, 0.03), dim * (1.0 - smoothstep(100.0, 270.0, length(q))));

  drawMiasma(c, q, t);
  drawSeal(c, q, t);
  drawCracks(c, q, t);
  drawImpact(c, q, t);
  drawNail(c, q, t);
  drawDoomEye(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
