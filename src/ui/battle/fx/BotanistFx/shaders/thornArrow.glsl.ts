/**
 * 植物学家 · 棘藤箭。以爆点为零点(t = hitTime()):
 *   瞄准  [-0.30, -0.04] 目标四周浮现六叶准星环, 旋转收拢锁定;
 *   飞箭  [-0.14, 0]     木杆棘刺箭自左侧疾射, 叶羽尾翼, 两道藤丝螺旋缠绕箭后, 沿途落叶;
 *   爆点  0              箭头钉入: 绿白闪 + 冲击环 + 九根尖刺自命中点放射绽出 + 飞叶前冲四溅;
 *   残留  [0, 0.45]      箭身余震, 尖刺挺立后回缩;
 *   消散  [0.40, 0.85]   箭身溶解成绿色光点, 花粉上飘, 末尾整体淡出。
 */
export const GLSL_THORN_ARROW = /* glsl */ `
#define ARROW_ANG 0.05
#define ARROW_LEN 170.0
#define FLIGHT 0.14

vec2 arrowDir() {
  return vec2(cos(ARROW_ANG), sin(ARROW_ANG));
}

/** 箭尖位置: 飞行段加速推进, 爆点后定在目标中心略前处并余震抖动。 */
vec2 arrowTip(float t) {
  vec2 dir = arrowDir();
  float u = prog(t, -FLIGHT, 0.0);
  vec2 tip = dir * mix(-560.0, 18.0, u * (0.3 + 0.7 * u));
  if (t > 0.0) {
    vec2 perp = vec2(-dir.y, dir.x);
    tip += perp * sin(t * 90.0) * 4.0 * exp(-t * 9.0) - dir * 7.0 * exp(-t * 28.0);
  }
  return tip;
}

void drawReticle(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.3, -0.22, -0.05, 0.04);
  if (k <= 0.0) return;
  float u = easeOut3(prog(t, -0.3, -0.06));
  float R = mix(160.0, 72.0, u);
  float spin = u * 2.2 + uSeed * 6.0;
  emit(c, uColor, glowOf(abs(length(q) - R), 1.6) * k * 0.45);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * (PI / 3.0) + spin;
    vec2 pos = R * vec2(cos(a), sin(a));
    // 叶尖朝向圆心, 叶柄落在准星环上。
    paintLeaf(c, rot(q - pos, -(a + PI)), 30.0, 8.0, LEAF_TINT, k);
  }
  float lock = t > -0.08 ? exp(-(t + 0.08) * 20.0) : 0.0;
  emit(c, hotColor(0.6), glowOf(length(q), 10.0) * k * (0.2 + lock));
}

/** 箭后两道螺旋藤丝(只在飞行段)。 */
void drawTrail(inout vec4 c, vec2 r, float t) {
  float k = (1.0 - smoothstep(0.0, 0.07, t)) * step(-FLIGHT, t);
  if (k <= 0.0) return;
  float speed = prog(t, -FLIGHT, 0.0);
  float L = 90.0 + 320.0 * speed;
  float x = -r.x - ARROW_LEN * 0.4;
  if (x < 0.0 || x > L) return;
  float f = 1.0 - x / L;
  float amp = 5.0 + 12.0 * (x / L);
  float ph = x * 0.07 - uPhase * 34.0;
  float d1 = abs(r.y - amp * sin(ph));
  float d2 = abs(r.y + amp * sin(ph));
  float strands = glowOf(min(d1, d2), 1.6) + fillAA(min(d1, d2) - 1.0);
  emit(c, uColor, strands * f * f * k * 0.85);
  emit(c, uColor, glowOf(abs(r.y), 6.0 + 8.0 * (1.0 - f)) * f * f * k * 0.3);
}

/** 沿途落叶: 五片叶在飞行中依次从箭尾脱落, 下坠并左右飘摆。 */
void drawShedLeaves(inout vec4 c, vec2 q, float t) {
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float ts = -FLIGHT + 0.025 + fi * 0.022;
    float lt = t - ts;
    if (lt <= 0.0 || lt > 0.7) continue;
    float h = hash11(fi * 9.1 + uSeed * 13.0);
    vec2 spawn = arrowTip(ts) - arrowDir() * ARROW_LEN;
    vec2 pos = spawn + vec2(-40.0 + 30.0 * h, 30.0 * h) * lt - vec2(0.0, 150.0 * lt * lt);
    pos.x += sin(lt * 9.0 + fi * 2.0) * 10.0;
    vec2 p = q - pos;
    if (dot(p, p) > 400.0) continue;
    float spin = lt * (5.0 + 6.0 * h) + h * 6.0;
    float k = 1.0 - smoothstep(0.4, 0.7, lt);
    paintLeaf(c, rot(p, -spin) + vec2(10.0, 0.0), 20.0, 5.0 + 2.0 * abs(sin(lt * 11.0 + h * 5.0)), LEAF_TINT, k);
  }
}

void drawArrow(inout vec4 c, vec2 q, float t) {
  if (t < -FLIGHT || t > 0.86) return;
  vec2 r = rot(q - arrowTip(t), -ARROW_ANG);
  drawTrail(c, r, t);
  if (r.x > 6.0 || r.x < -ARROW_LEN - 50.0 || abs(r.y) > 40.0) return;

  // 溶解: 自箭尾向箭尖推进的噪声阈值。
  float dis = prog(t, 0.4, 0.8);
  float n = vnoise(r * 0.1 + uSeed * 7.0) * 0.7 + 0.3 * clamp(-r.x / ARROW_LEN, 0.0, 1.0);
  float alive = 1.0 - smoothstep(n - 0.06, n, dis * 1.1);
  float ember = smoothstep(n - 0.14, n - 0.06, dis * 1.1) * alive;
  // 爆点后箭头一截没入目标, 稍作淡化。
  float sink = t > 0.0 ? 1.0 - 0.6 * smoothstep(-34.0, 0.0, r.x) : 1.0;
  float k = alive * sink;

  // 叶羽: 箭尾上下各一片, 飞行中高频抖动。
  float flutter = t < 0.0 ? sin(uPhase * 60.0) * 0.08 : sin(t * 50.0) * 0.12 * exp(-t * 6.0);
  vec2 fl = vec2(r.x + ARROW_LEN - 10.0, abs(r.y));
  paintLeaf(c, rot(fl, -(PI - 0.42 + flutter)), 38.0, 9.0, LEAF_TINT, k);

  // 箭杆: 木色, 上缘一线受光。
  float dShaft = sdBox(r - vec2(-ARROW_LEN * 0.5 - 14.0, 0.0), vec2(ARROW_LEN * 0.5 - 14.0, 2.6));
  paint(c, BARK * 1.4, fillAA(dShaft) * k);
  emit(c, mix(BARK, LEAF_TINT, 0.6), fillAA(abs(dShaft) - 0.6) * k * 0.6);

  // 杆上小刺: 每 24px 一对, 刺尖朝外后方。
  float idx = clamp(floor((-r.x - 46.0) / 24.0 + 0.5), 0.0, 4.0);
  vec2 tp = vec2(r.x + 46.0 + idx * 24.0, abs(r.y) - 2.0);
  paintThorn(c, rot(tp, -0.65), 2.8, 10.0, k);

  // 箭头: 尖刺形, 亮绿刃口。
  vec2 hp = vec2(r.y, r.x + 32.0);
  float dHead = sdThorn(hp, 9.0, 32.0);
  paint(c, LEAF_DARK, fillAA(dHead) * k);
  emit(c, hotColor(0.45), (fillAA(abs(dHead) - 1.0) + 0.4 * glowOf(max(dHead, 0.0), 4.0)) * k);
  emit(c, hotColor(0.8), glowOf(length(r), 3.0) * k * 0.8);

  emit(c, uColor, glowOf(max(min(dShaft, dHead), 0.0), 7.0) * k * 0.35);
  emit(c, hotColor(0.6), ember * 1.4);
}

/** 尖刺绽放: 九根尖刺自命中点放射长出, 挺立片刻后回缩。 */
void drawThornBloom(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0 || t > 0.55) return;
  float grow = easeOut3(t / 0.07) * (1.0 - smoothstep(0.3, 0.52, t));
  float k = 1.0 - smoothstep(0.42, 0.55, t);
  vec2 o = q - vec2(10.0, 0.0);
  if (dot(o, o) > 160.0 * 160.0) return;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 4.7 + uSeed * 19.0);
    float h2 = hash11(fi * 8.3 + uSeed * 5.0);
    float a = fi * (2.0 * PI / 9.0) + (h1 - 0.5) * 0.45 + uSeed * 4.0;
    vec2 p = rot(o, -(a - PI * 0.5));
    p.y -= 12.0;
    p.x += (h2 - 0.5) * 0.004 * p.y * p.y;
    float h = (62.0 + 60.0 * h2) * grow;
    paintThorn(c, p, 6.0 + 4.0 * h1, h, k);
  }
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, hotColor(0.75), glowOf(r0, 24.0) * exp(-t * 14.0) * 1.3);
  float k = prog(t, 0.0, 0.36);
  float R = 20.0 + 190.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(r0 - R), 2.5 + 6.0 * (1.0 - k)) * (1.0 - k) * 0.9);
  emit(c, hotColor(0.5), burst(q, t, uSeed, 14.0, 560.0, 0.34, 150.0, ARROW_ANG - 0.7, 1.4));
  leafBurst(c, q, t, uSeed + 0.37, 9.0, 620.0, 0.8, 220.0, ARROW_ANG - 1.1, 2.2);
  leafBurst(c, q, t, uSeed + 0.81, 4.0, 300.0, 0.7, 200.0, PI - 0.6, 1.2);
}

void drawPollen(inout vec4 c, vec2 q, float t) {
  float k = window4(t, 0.05, 0.2, 0.55, 0.85);
  if (k <= 0.0) return;
  float mask = 1.0 - smoothstep(60.0, 200.0, length(q));
  emit(c, hotColor(0.55), pollen(q, 22.0, t * 90.0, uSeed) * mask * k);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.25 * smoothstep(-0.3, -0.1, t) * (1.0 - smoothstep(0.1, 0.5, t));
  paint(c, vec3(0.0, 0.03, 0.01), dim * (1.0 - smoothstep(100.0, 270.0, length(q))));

  drawReticle(c, q, t);
  drawThornBloom(c, q, t);
  drawShedLeaves(c, q, t);
  drawArrow(c, q, t);
  drawImpact(c, q, t);
  drawPollen(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
