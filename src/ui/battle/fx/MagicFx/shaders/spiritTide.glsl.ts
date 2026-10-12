/**
 * 咒术师 · 怨灵潮(全屏群攻)。以爆点为零点(t = hitTime()), 全部目标同一爆点;
 * 暗幕与怨灵群的横带围绕目标行高度(stageRowY)铺开:
 *   起潮  [-0.70, -0.40] 全场压暗, 一层暗幕横贯中段, 青色风痕自左向右掠过;
 *   百鬼  [-0.65, 0.35]  十八只拖尾怨灵从施法者身后呼啸而出, 波浪状横扫全场;
 *   扑咬  [-0.30, 0]     每个目标各被一只大怨灵加速扑中;
 *   爆点  0              巨型白核闪 + 三道青白爪痕斜撕 + 厚冲击环 + 怨灵炸成魂屑 + 全场青闪;
 *   退潮  → 1.75         爪痕与暗幕消散, 末尾整体淡出。
 */
export const GLSL_SPIRIT_TIDE = /* glsl */ `
const vec3 TIDE_DARK = vec3(0.01, 0.03, 0.05);
#define CASTER_X 220.0
#define CASTER_Y 260.0

/**
 * 怨灵 SDF(头朝右): 圆头 + 向左拖出的波浪渐细尾。p 以头心为原点, r 为头半径。
 * 返回 (身体距离, 五官距离)。
 */
vec2 wraith(vec2 p, float r, float wavePh) {
  float head = length(p * vec2(1.0, 1.08)) - r;
  float len = r * 5.0;
  float along = clamp(-p.x / len, 0.0, 1.0);
  float wave = sin(p.x * 0.09 / (r / 18.0) + wavePh) * r * 0.45 * along;
  float tailW = r * (1.0 - along) * (1.0 - along) * 0.95;
  float tail = max(abs(p.y - wave) - tailW, max(p.x, -p.x - len));
  float body = min(head, tail);
  // 五官: 两只斜眼 + 张开的嘴。
  vec2 e1 = (p - vec2(r * 0.1, r * 0.22)) / vec2(r * 0.16, r * 0.24);
  vec2 e2 = (p - vec2(r * 0.55, r * 0.18)) / vec2(r * 0.14, r * 0.22);
  vec2 m = (p - vec2(r * 0.38, -r * 0.35)) / vec2(r * 0.2, r * 0.3);
  float face = min(min(length(e1), length(e2)), length(m)) - 1.0;
  return vec2(body, face * r * 0.16);
}

/** 在 s 处叠加一只怨灵(颜色、透明度按体型分档)。 */
void drawWraith(inout vec4 c, vec2 s, vec2 pos, float r, float wavePh, float k) {
  vec2 p = s - pos;
  if (p.x > r * 1.6 || p.x < -r * 6.5 || abs(p.y) > r * 3.0) return;
  vec2 w = wraith(p, r, wavePh);
  float tailFade = 1.0 - clamp(-p.x / (r * 5.0), 0.0, 1.0);
  float body = fillAA(w.x) * k;
  emit(c, uColor, body * (0.25 + 0.45 * tailFade));
  emit(c, hotColor(0.6), fillAA(abs(w.x) - 1.0) * k * (0.4 + 0.6 * tailFade));
  emit(c, uColor, glowOf(max(w.x, 0.0), r * 0.4) * k * 0.35 * tailFade);
  paint(c, vec3(0.0), fillAA(w.y) * body * 0.95);
}

void drawVeil(inout vec4 c, vec2 s, float t) {
  float k = window4(t, -0.7, -0.45, 0.35, 1.1);
  if (k <= 0.0) return;
  float n = fbm(vec2(s.x * 0.004 - uPhase * 1.2, s.y * 0.01) + uSeed * 3.0);
  float row = stageRowY();
  float band = smoothstep(row - 260.0, row - 120.0, s.y) * (1.0 - smoothstep(row + 140.0, row + 280.0, s.y + (n - 0.5) * 140.0));
  paint(c, TIDE_DARK, band * k * (0.3 + 0.3 * n));
  // 风痕: 每 12px 一行, 各行速度/长度不同的横向细线。
  float lane = floor(s.y / 12.0);
  float h = hash11(lane * 1.7 + uSeed * 5.0);
  float x = s.x - uPhase * (1300.0 + 900.0 * h) - h * 900.0;
  float seg = fract(x / (420.0 + 300.0 * h));
  float line = smoothstep(0.0, 0.08, seg) * (1.0 - smoothstep(0.08, 0.32, seg));
  float thin = 1.0 - smoothstep(0.6, 1.6, abs(fract(s.y / 12.0) - 0.5) * 12.0);
  emit(c, uColor, line * thin * step(0.55, h) * band * k * 0.5);
}

/** 怨灵群: 18 只, 自施法者身后依次涌出, 沿各自的波浪路径横扫全场。 */
void drawHorde(inout vec4 c, vec2 s, float t) {
  if (t < -0.65 || t > 0.45) return;
  float row = stageRowY();
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.1 + uSeed * 7.0);
    float h2 = hash11(fi * 7.7 + uSeed * 2.0);
    float h3 = hash11(fi * 5.3 + uSeed * 9.0);
    float lt = t - (-0.65 + h1 * 0.85);
    if (lt <= 0.0) continue;
    float speed = 1500.0 + 900.0 * h2;
    float x = CASTER_X - 80.0 + speed * lt;
    if (x > uSize.x + 300.0) continue;
    float yBase = mix(CASTER_Y, row - 190.0 + 380.0 * h3, smoothstep(0.0, 0.25, lt));
    float y = yBase + sin(lt * 9.0 + fi) * 26.0;
    float r = 12.0 + 12.0 * h2;
    float k = smoothstep(0.0, 0.06, lt);
    drawWraith(c, s, vec2(x, y), r, -uPhase * 22.0 + fi, k * (0.55 + 0.45 * h3));
  }
}

void drawTarget(inout vec4 c, vec2 s, float t, vec2 tp, float idx) {
  vec2 q = s - tp;
  // 大怨灵扑咬: 自施法者处起, 弧线加速扑向目标中心, 爆点时头部撞进目标。
  if (t > -0.3 && t <= 0.02) {
    float u = prog(t, -0.3, 0.0);
    float e = u * u * (0.3 + 0.7 * u);
    vec2 from = vec2(CASTER_X + 40.0, CASTER_Y + 30.0 + idx * 40.0);
    vec2 pos = mix(from, tp, e) + vec2(0.0, sin(e * PI) * (120.0 - idx * 50.0));
    float r = mix(26.0, 46.0, e);
    drawWraith(c, s, pos, r, -uPhase * 28.0 + idx * 2.0, smoothstep(-0.3, -0.24, t) * (1.0 - step(0.0, t)));
  }
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 36.0) * exp(-t * 11.0) * 2.0);
  emit(c, uColor, glowOf(r0, 150.0) * exp(-t * 6.0) * 0.7);

  // 三道爪痕: 斜向撕开, 40ms 内拉满, 白芯青边, 缓慢冷却。
  float grow = easeOut3(t / 0.05);
  float kc = 1.0 - smoothstep(0.15, 0.6, t);
  vec2 p = rot(q, 0.95);
  for (int i = 0; i < 3; i++) {
    float off = (float(i) - 1.0) * 30.0;
    float clawLen = 120.0 - abs(float(i) - 1.0) * 26.0;
    float x = p.x;
    float bow = 0.0016 * x * x;
    float along = clamp(abs(x) / clawLen, 0.0, 1.0);
    float w = 5.0 * (1.0 - along * along) * (1.0 - 0.5 * smoothstep(0.0, 0.5, t));
    float d = max(abs(p.y - off - bow) - w, abs(x + clawLen * (1.0 - grow)) - clawLen * grow);
    emit(c, vec3(1.0), fillAA(d) * kc * 1.2);
    emit(c, uColor, glowOf(max(d, 0.0), 7.0) * kc);
  }
  // 厚冲击环。
  float k = prog(t, 0.0, 0.4);
  float R = 26.0 + 200.0 * easeOut3(k);
  float w = mix(16.0, 2.0, k);
  paint(c, TIDE_DARK, fillAA(abs(r0 - R) - w) * (1.0 - k) * 0.55);
  emit(c, hotColor(0.6), fillAA(abs(r0 - R - w) - 1.6) * (1.0 - k));
  emit(c, uColor, glowOf(abs(r0 - R - w), 8.0) * (1.0 - k) * 0.6);
  // 怨灵炸成魂屑: 顺扑咬方向前冲。
  emit(c, hotColor(0.6), burst(q, t, uSeed + idx * 0.37, 14.0, 620.0, 0.45, 60.0, -0.6, 1.2)
                       + burst(q, t, uSeed + idx * 0.71 + 0.2, 10.0, 360.0, 0.4, 120.0, 0.0, 2.0 * PI) * 0.7);
}

void main() {
  vec2 s = stageCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  paint(c, vec3(0.0, 0.01, 0.025), 0.32 * smoothstep(-0.7, -0.35, t) * (1.0 - smoothstep(0.15, 0.9, t)));

  drawVeil(c, s, t);
  drawHorde(c, s, t);
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uCount) break;
    drawTarget(c, s, t, stageTarget(i), float(i));
  }
  // 首击全场青闪。
  emit(c, uColor, t > 0.0 ? exp(-t * 14.0) * 0.16 : 0.0);

  gl_FragColor = finalize(c * hitEndFade() * stageEdge(s));
}
`;
