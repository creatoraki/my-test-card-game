/**
 * 植物学家 · 食人花噬咬。以爆点为零点(t = hitTime()):
 *   绽冠  [-0.56, -0.40] 目标身后弹出一朵獠牙花冠(外圈荆叶纹带 + 双层 16 瓣带刺毛花瓣 + 中央血口), 纹带沿环长满一圈, 过冲后定住;
 *   窥伺  [-0.40, -0.14] 花冠随呼吸起伏、内外层反向慢转, 口沿两圈獠牙反向磨动, 喉心螺旋纹越转越亮;
 *   合口  [-0.14, 0]     血口急缩, 花瓣随口沿内收并扭成光圈状收拢, 两圈獠牙错开半齿交错扣死;
 *   爆点  0              花冠崩碎: 白核闪 + 14 道咬合裂光 + 三重冲击环 + 16 枚花瓣碎片飞散 + 汁液与碎叶四溅;
 *   咀嚼  [0, 0.46]      獠牙口仍扣在目标身上, 微张后在 CHEW2 再咬一次(第二声小冲击), 随后外弹淡去;
 *   消散  → 0.89         碎片落尽, 末尾整体淡出。
 */
export const GLSL_FLYTRAP_BITE = /* glsl */ `
const vec3 MAW_DARK = vec3(0.08, 0.01, 0.03);
const vec3 FANG = vec3(0.93, 0.87, 0.7);
const vec2 MAW_C = vec2(0.0, 8.0);
#define MOUTH_R 80.0
#define BAND_R 198.0
#define FANG_N 14.0
#define CHEW2 0.24

float crownScale(float t) {
  float u = prog(t, -0.56, -0.42);
  float pop = 1.0 + 0.14 * sin(u * PI) * (1.0 - u);
  return mix(0.45, 1.0, easeOut3(u)) * pop;
}

/** 合口进度: 0 张开 → 1 咬死(加速)。 */
float biteK(float t) {
  float u = prog(t, -0.14, 0.0);
  return u * u;
}

/**
 * 一枚花瓣(局部坐标: 瓣根在原点、沿 +x 伸出, 长 len、半宽 w): 墨绿瓣背 + 血红瓣心 + 人字脉,
 * 瓣缘一圈斜向瓣尖外翻的刺毛; lit 为蓄力亮度。
 */
void paintPetal(inout vec4 c, vec2 p, float len, float w, float k, float lit) {
  if (k <= 0.0 || p.x < -8.0 || p.x > len + 24.0 || abs(p.y) > w + 24.0) return;
  float ay = abs(p.y);
  float xk = (floor(p.x / 13.0) + 0.5) * 13.0;
  float uk = xk / len;
  if (uk > 0.1 && uk < 0.9) {
    vec2 b = vec2(xk, 4.0 * w * uk * (1.0 - uk) - 2.0);
    float dSpike = sdSegment(vec2(p.x, ay), b, b + vec2(7.0, 16.0 * sin(uk * PI))) - 1.0;
    float spike = fillAA(dSpike) * k;
    paint(c, mix(LEAF_MID, FANG, 0.45), spike * 0.9);
    emit(c, hotColor(0.4), spike * 0.3);
  }
  float d = sdAlmond(p - vec2(len * 0.5, 0.0), len * 0.5, w);
  if (d > 12.0) return;
  float u = clamp(p.x / len, 0.0, 1.0);
  float body = fillAA(d) * k;
  float inner = 1.0 - smoothstep(0.0, w * 0.8, ay);
  vec3 col = mix(LEAF_DARK, LEAF_MID, 0.25 + 0.5 * u);
  col = mix(col, uColor * 0.58, inner * (0.85 - 0.4 * u));
  col = mix(col, MAW_DARK, smoothstep(-12.0, 0.0, d) * 0.55);
  paint(c, col, body * 0.9);
  float rib = (1.0 - smoothstep(0.6, 1.8, ay)) * step(0.06, u) * (1.0 - u);
  float chev = (1.0 - smoothstep(0.6, 1.6, abs(fract((p.x - ay * 1.4) / 20.0) - 0.5) * 20.0)) * inner * step(0.12, u);
  emit(c, hotColor(0.2), (rib * 0.7 + chev * 0.4) * body * (0.45 + 0.8 * lit));
  emit(c, hotColor(0.35), fillAA(abs(d) - 0.9) * k * (0.45 + 0.45 * lit));
  emit(c, uColor, glowOf(max(d, 0.0), 5.0) * k * 0.2 * (0.6 + lit));
}

/** 一圈内向獠牙(FANG_N 颗, 牙根落在半径 R 的口沿上): 血红牙根 → 骨白牙尖 + 亮缘。 */
void fangRing(inout vec4 c, vec2 p, float R, float len, float base, float spin, float k) {
  if (k <= 0.0) return;
  vec2 f = polarFold(p, FANG_N, R, spin);
  vec2 tp = vec2(f.x, -f.y);
  if (tp.y < -6.0 || tp.y > len + 6.0) return;
  float d = sdThorn(tp, base, len);
  float along = clamp(tp.y / len, 0.0, 1.0);
  paint(c, mix(uColor * 0.35, FANG, smoothstep(0.1, 0.7, along)), fillAA(d) * k);
  emit(c, hotColor(0.6), fillAA(abs(d) - 0.7) * k * 0.5);
}

/** 口沿(暗红厚唇) + 上下两圈獠牙; gnash 为两圈的反向错动角, 0 时恰好错开半齿交错扣合。 */
void drawJaw(inout vec4 c, vec2 p, float R, float gnash, float k) {
  float r = length(p);
  float dLip = abs(r - R) - 4.0;
  paint(c, MAW_DARK, fillAA(dLip) * k * 0.85);
  emit(c, hotColor(0.3), fillAA(abs(dLip) - 0.8) * k * 0.7);
  emit(c, uColor, glowOf(max(dLip, 0.0), 6.0) * k * 0.5);
  float len = min(26.0, R * 0.75);
  float base = uSeed * 2.0;
  fangRing(c, p, R + 6.0, len + 6.0, 4.5, base + PI / FANG_N - gnash, k * 0.85);
  fangRing(c, p, R, len, 4.0, base + gnash, k);
}

/** 血口: 暗红喉腔 + 六条旋入喉心的螺旋纹 + 喉心血光。 */
void drawThroat(inout vec4 c, vec2 p, float R, float k, float charge) {
  float r = length(p);
  if (r > R + 2.0) return;
  float inside = fillAA(r - R);
  paint(c, MAW_DARK, inside * k * 0.62);
  float a = atan(p.y, p.x);
  float sw = sin(a * 6.0 + log(r + 1.0) * 7.0 - uPhase * 9.0);
  emit(c, uColor, smoothstep(0.55, 1.0, sw) * (r / R) * inside * k * (0.3 + 0.6 * charge));
  emit(c, hotColor(0.3), glowOf(r, 16.0) * inside * k * (0.25 + 0.9 * charge));
}

/** 外圈荆叶纹带: 双细环 + 16 片切向叶纹 + 叶间外向刺, 弹出时沿环长满一圈, 反向慢转。 */
void drawBand(inout vec4 c, vec2 p, float t, float k, float charge) {
  float r = length(p);
  if (abs(r - BAND_R) > 34.0) return;
  float grow = easeOut3(prog(t, -0.54, -0.36));
  float seg = fract(atan(p.y, p.x) / (2.0 * PI) - 0.25);
  float shown = max(1.0 - smoothstep(grow - 0.03, grow, seg), step(1.0, grow)) * k;
  if (shown <= 0.0) return;
  float spin = -0.3 * uPhase;
  paint(c, MAW_DARK, fillAA(abs(r - BAND_R) - 9.0) * shown * 0.5);
  float rings = fillAA(abs(r - BAND_R + 9.0) - 0.8) + fillAA(abs(r - BAND_R - 9.0) - 0.8);
  emit(c, hotColor(0.3), rings * shown * 0.8);
  emit(c, uColor, glowOf(abs(r - BAND_R), 10.0) * shown * (0.25 + 0.5 * charge));
  vec2 f = polarFold(p, 16.0, BAND_R, spin);
  paintLeaf(c, vec2(f.x + 15.0, f.y), 30.0, 6.5, LEAF_TINT, shown);
  vec2 g = polarFold(p, 16.0, BAND_R + 9.0, spin + PI / 16.0);
  paintThorn(c, g, 3.0, 12.0 + 6.0 * charge, shown);
}

void drawCrown(inout vec4 c, vec2 q, float t) {
  if (t < -0.56 || t > 0.0) return;
  float sc = crownScale(t);
  vec2 p = (q - MAW_C) / sc;
  if (length(p) > BAND_R + 40.0) return;
  float k = smoothstep(-0.56, -0.5, t);
  float bk = biteK(t);
  float charge = prog(t, -0.4, 0.0);
  float breathe = sin(uPhase * 8.0) * (1.0 - bk);
  float mouthR = mix(MOUTH_R, 24.0, bk) * (1.0 + 0.03 * breathe);

  drawBand(c, p, t, k, charge);
  // 外层瓣在后、内层瓣在前(错开半瓣); 合口时瓣根随口沿内收, 瓣身扭成光圈状收拢。
  for (int layer = 0; layer < 2; layer++) {
    float fl = float(layer);
    float dir = fl < 0.5 ? -1.0 : 1.0;
    float spin = dir * 0.22 * uPhase + fl * PI / 8.0 + uSeed * 2.0 + dir * bk;
    float rb = mouthR + (fl < 0.5 ? 6.0 : -4.0);
    float len = (fl < 0.5 ? 86.0 : 58.0) * (1.0 + 0.05 * breathe) * mix(1.0, 0.8, bk);
    float w = fl < 0.5 ? 30.0 : 21.0;
    float twist = dir * bk;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * (PI * 0.25) + spin;
      vec2 lp = rot(p - vec2(cos(a), sin(a)) * rb, -(a + twist));
      paintPetal(c, lp, len, w, k, charge);
    }
  }
  drawThroat(c, p, mouthR, k, charge);
  drawJaw(c, p, mouthR, 0.5 * uPhase * (1.0 - bk), k);
}

/** 咀嚼: 獠牙口扣在目标身上微张, 到 CHEW2 再咬一次, 随后外弹淡去。 */
void drawChew(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0 || t > 0.46) return;
  vec2 p = q - MAW_C;
  float k = 1.0 - prog(t, 0.3, 0.46);
  float R = 24.0 + 16.0 * sin(prog(t, 0.0, CHEW2) * PI) + 60.0 * easeOut3(prog(t, CHEW2 + 0.04, 0.46));
  drawJaw(c, p, R, 0.0, k);
}

void drawShatter(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  vec2 p = q - MAW_C;
  float r0 = length(p);
  emit(c, vec3(1.0), glowOf(r0, 40.0) * exp(-t * 10.0) * 1.8);
  emit(c, uColor, glowOf(r0, 170.0) * exp(-t * 6.0) * 0.8);
  emit(c, uColor, exp(-t * 16.0) * 0.22);
  // 14 道咬合裂光: 自齿缝放射, 长短交替。
  float kr = exp(-t * 7.0);
  for (int i = 0; i < 14; i++) {
    float a = float(i) * (2.0 * PI / FANG_N) + uSeed * 2.0 + PI / FANG_N * 0.5;
    float big = mod(float(i), 2.0) < 0.5 ? 1.0 : 0.6;
    emit(c, hotColor(0.6), rayAt(p, a, 320.0 * big, 2.0) * kr * big * step(0.0, dot(p, vec2(cos(a), sin(a)))) * 1.1);
  }
  shockRings(c, p, t, 290.0, 1.0, MAW_DARK, 10.0);
  shockRings(c, p, t - CHEW2, 200.0, 0.6, MAW_DARK, 6.0);
  emit(c, vec3(1.0), glowOf(r0, 24.0) * (t > CHEW2 ? exp(-(t - CHEW2) * 14.0) : 0.0) * 1.2);

  // 16 枚花瓣碎片: 自花冠各处向外飞散翻转, 墨绿瓣背 + 血红瓣心 + 亮缘。
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 5.3 + uSeed * 17.0);
    float h2 = hash11(fi * 8.9 + uSeed * 3.0);
    float life = 0.55 + 0.3 * h2;
    float lk = 1.0 - t / life;
    if (lk <= 0.0) continue;
    float a = fi * (2.0 * PI / 16.0) + (h1 - 0.5) * 0.4;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 pos = dir * (40.0 + 90.0 * h2) + dir * (400.0 + 360.0 * h1) * (1.0 - exp(-4.0 * t)) / 4.0 - vec2(0.0, 240.0 * t * t);
    vec2 lp = rot(p - pos, -(a + t * (5.0 + 8.0 * h1)));
    float size = 13.0 + 11.0 * h1;
    if (dot(lp, lp) > size * size * 2.0) continue;
    lp.y /= 0.35 + 0.65 * abs(sin(t * (7.0 + 5.0 * h2) + h1 * 6.0));
    float d = sdAlmond(lp, size, size * 0.38);
    float inner = 1.0 - smoothstep(0.0, size * 0.3, abs(lp.y));
    paint(c, mix(LEAF_DARK, uColor * 0.5, inner), fillAA(d) * lk);
    emit(c, hotColor(0.4), fillAA(abs(d) - 0.9) * lk);
    emit(c, uColor, glowOf(max(d, 0.0), 5.0) * lk * 0.4);
  }
  emit(c, hotColor(0.35), burst(p, t, uSeed, 14.0, 560.0, 0.55, 520.0, 0.0, 2.0 * PI));
  emit(c, uColor, burst(p, t, uSeed + 0.4, 12.0, 400.0, 0.5, 600.0, 0.3, 2.5) * 0.8);
  leafBurst(c, p, t, uSeed + 0.27, 9.0, 460.0, 0.85, 260.0, 0.0, 2.0 * PI);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 局部压暗: 合口时最深, 爆点后迅速退去。
  float dim = 0.3 * smoothstep(-0.56, -0.3, t) + 0.2 * prog(t, -0.14, 0.0);
  dim *= 1.0 - smoothstep(0.02, 0.45, t);
  paint(c, vec3(0.03, 0.0, 0.01), dim * (1.0 - smoothstep(170.0, 320.0, length(q - MAW_C))));

  drawCrown(c, q, t);
  drawShatter(c, q, t);
  drawChew(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
