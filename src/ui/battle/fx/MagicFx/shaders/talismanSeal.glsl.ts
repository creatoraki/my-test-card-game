/**
 * 咒术师 · 符咒。以爆点为零点(t = hitTime()):
 *   飞符  [-0.40, -0.04] 黄符自左侧翻飞而来, 边飞边旋, 末段减速摆正;
 *   贴符  [-0.04, 0]     黄符拍到目标身上, 微微过冲放大;
 *   爆点  0              符文点亮成青光 + 方印双环外扩 + 四角锁链短线 + 青火星;
 *   焚符  [0.30, 0.95]   黄符自边缘起青火焚尽, 灰烬上飘, 末尾整体淡出。
 */
export const GLSL_TALISMAN_SEAL = /* glsl */ `
const vec3 PAPER = vec3(0.93, 0.84, 0.58);
const vec3 INK = vec3(0.55, 0.08, 0.06);
const vec2 PAPER_HALF = vec2(30.0, 66.0);

/** 符面局部坐标 → 符文笔画距离(抽象的「敕令」样式: 竖笔 + 横笔 + 回环 + 底钩)。 */
float glyphDist(vec2 p) {
  float d = sdSegment(p, vec2(0.0, 50.0), vec2(0.0, -40.0));
  d = min(d, sdSegment(p, vec2(-16.0, 40.0), vec2(16.0, 40.0)));
  d = min(d, sdSegment(p, vec2(-12.0, 26.0), vec2(12.0, 26.0)));
  d = min(d, abs(length(p - vec2(0.0, 4.0)) - 11.0));
  d = min(d, sdSegment(p, vec2(-14.0, -18.0), vec2(14.0, -18.0)));
  d = min(d, sdSegment(p, vec2(0.0, -40.0), vec2(-12.0, -52.0)));
  d = min(d, sdSegment(p, vec2(-18.0, -30.0), vec2(-8.0, -36.0)));
  d = min(d, sdSegment(p, vec2(18.0, -30.0), vec2(8.0, -36.0)));
  return d - 1.6;
}

/** 符纸位置/旋转/缩放: 飞行段沿弧线前进并翻转, 贴上后定住。 */
void paperPose(float t, out vec2 pos, out float ang, out float scale) {
  float u = prog(t, -0.4, -0.04);
  float e = 1.0 - (1.0 - u) * (1.0 - u);
  pos = mix(vec2(-340.0, 70.0), vec2(0.0, 6.0), e) + vec2(0.0, sin(e * PI) * 50.0);
  ang = (1.0 - e) * (1.0 - e) * 7.5 - 0.08;
  float slap = prog(t, -0.04, 0.0);
  scale = mix(0.7, 1.0, e) * (1.0 + 0.18 * sin(slap * PI));
}

void drawPaper(inout vec4 c, vec2 q, float t) {
  if (t < -0.4 || t > 0.95) return;
  vec2 pos;
  float ang;
  float scale;
  paperPose(t, pos, ang, scale);
  vec2 p = rot(q - pos, -ang) / scale;
  // 飞行时符纸绕竖轴翻面: 横向压缩模拟翻转。
  float flip = t < -0.04 ? abs(cos((t + 0.4) * 22.0)) * 0.75 + 0.25 : 1.0;
  p.x /= flip;
  float dBox = sdBox(p, PAPER_HALF);
  // 焚符: 噪声阈值自边缘向内推进, 阈值带上是青火。
  float burn = prog(t, 0.3, 0.92);
  float edgeN = vnoise(p * 0.09 + uSeed * 9.0) * 0.6 + 0.4 * (1.0 - clamp(-dBox / 30.0, 0.0, 1.0));
  float alive = 1.0 - smoothstep(edgeN - 0.04, edgeN, burn * 1.15);
  float fireBand = smoothstep(edgeN - 0.16, edgeN - 0.04, burn * 1.15) * alive;
  float inside = fillAA(dBox * scale);
  paint(c, PAPER * (0.85 + 0.15 * vnoise(p * 0.3)), inside * alive);
  // 朱砂边框与符文: 爆点后符文转为发光青色。
  float dFrame = abs(sdBox(p, PAPER_HALF - 5.0)) - 1.0;
  paint(c, INK, fillAA(dFrame * scale) * inside * alive);
  float dGlyph = glyphDist(p);
  float lit = t > 0.0 ? 1.0 : 0.0;
  paint(c, mix(INK, hotColor(0.3), lit), fillAA(dGlyph * scale) * inside * alive);
  emit(c, uColor, glowOf(max(dGlyph, 0.0), 5.0) * inside * alive * lit * (0.6 + 0.8 * exp(-t * 6.0)));
  emit(c, hotColor(0.5), fireBand * inside * 1.4);
  emit(c, uColor, glowOf(max(dBox, 0.0), 6.0) * lit * alive * exp(-t * 5.0) * 0.8);
}

void drawSeal(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, hotColor(0.7), glowOf(r0, 26.0) * exp(-t * 14.0) * 1.2);
  // 方印双环: 正方 + 斜方外扩。
  float k = prog(t, 0.0, 0.42);
  float R = 40.0 + 130.0 * easeOut3(k);
  float d1 = abs(sdBox(q, vec2(R))) - mix(2.5, 0.5, k);
  float d2 = abs(sdBox(rot(q, PI * 0.25), vec2(R * 0.85))) - mix(2.0, 0.5, k);
  float d = min(d1, d2);
  emit(c, uColor, (fillAA(d) + 0.5 * glowOf(max(d, 0.0), 6.0)) * (1.0 - k));
  // 四角锁链: 从方印四角向外伸出的虚线, 读作「定住」。
  float kc = window4(t, 0.02, 0.08, 0.35, 0.6);
  if (kc > 0.0) {
    vec2 a = abs(q);
    vec2 diag = normalize(vec2(1.0));
    float along = dot(a, diag);
    float off = abs(dot(a, vec2(-diag.y, diag.x)));
    float reach = 60.0 + 120.0 * easeOut3(prog(t, 0.02, 0.2));
    float dash = step(0.45, fract(along / 14.0 - t * 2.0));
    float dChain = max(off - 1.6, max(70.0 - along, along - reach));
    emit(c, hotColor(0.4), (fillAA(dChain) * dash + 0.3 * glowOf(max(dChain, 0.0), 4.0)) * kc);
  }
  emit(c, hotColor(0.6), burst(q, t, uSeed, 12.0, 420.0, 0.4, 100.0, 0.0, 2.0 * PI));
}

/** 灰烬: 焚符时自符纸处上飘的青色余烬。 */
void drawAsh(inout vec4 c, vec2 q, float t) {
  float k = window4(t, 0.35, 0.45, 0.8, 1.05);
  if (k <= 0.0) return;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 4.1 + uSeed * 13.0);
    float h2 = hash11(fi * 9.7 + uSeed * 5.0);
    float lt = t - 0.35 - h2 * 0.3;
    if (lt <= 0.0) continue;
    vec2 pos = vec2((h1 - 0.5) * 60.0 + sin(lt * 8.0 + fi) * 10.0, (h2 - 0.5) * 120.0 + lt * (90.0 + 60.0 * h1));
    float d = length(q - pos) - 1.5;
    emit(c, hotColor(0.5), (fillAA(d) + glowOf(max(d, 0.0), 3.0) * 0.6) * k * (1.0 - smoothstep(0.3, 0.6, lt)));
  }
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.25 * smoothstep(-0.4, -0.1, t) * (1.0 - smoothstep(0.1, 0.5, t));
  paint(c, vec3(0.0, 0.02, 0.03), dim * (1.0 - smoothstep(100.0, 250.0, length(q))));

  drawSeal(c, q, t);
  drawPaper(c, q, t);
  drawAsh(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
