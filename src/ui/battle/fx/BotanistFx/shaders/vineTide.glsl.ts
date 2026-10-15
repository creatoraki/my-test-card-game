/**
 * 植物学家 · 藤蔓缠绕(全屏群攻)。以爆点为零点(t = hitTime()), 全部目标同一爆点:
 *   催生  [-0.68, -0.45] 全场压暗, 施法者脚下展开种子法阵(双环 + 生命之花六瓣纹 + 12 枚叶纹刻度)并缓转, 花粉光点上升;
 *   根脉  [-0.60, -0.28] 每个目标一道发光根脉自法阵贴地蜿蜒疾走、沿途分出根须, 抵达时点亮目标脚下的小法阵;
 *   缚环  [-0.50, -0.14] 三道倾斜的荆棘藤环自远处收拢到目标周围, 沿环流动着生长, 背面半透, 环上倒刺与叶片渐次长出;
 *   勒紧  [-0.12, 0]     藤环急勒到目标身上, 越勒越亮;
 *   爆点  0              绿白闪 + 倒刺齐弹 + 目标身上绽开六瓣封印花 + 冲击环 + 地面法阵外扩冲击 + 飞叶;
 *   崩环  [0, 0.55]      藤环断成碎段向外弹散并枯黄;
 *   余印  → 1.02         封印花收拢消散, 末尾整体淡出。
 */
export const GLSL_VINE_TIDE = /* glsl */ `
#define CASTER_X 220.0
#define CASTER_Y 260.0
#define FOOT 125.0
#define SQUASH 3.2
const vec2 BIND_C = vec2(0.0, 10.0);

vec2 casterFoot() {
  return vec2(CASTER_X, CASTER_Y - 110.0);
}

/** 种子法阵(g 为地面平面坐标, 调用方已按透视纵向拉伸): 内外双环 + 生命之花六瓣纹 + 12 枚叶纹刻度, 返回亮度。 */
float seedSigil(vec2 g, float R, float spin) {
  float r = length(g);
  if (r > R + 24.0) return 0.0;
  float v = glowOf(abs(r - R), 1.6) + 0.7 * glowOf(abs(r - R * 0.8), 1.2);
  vec2 gr = rot(g, -spin);
  float h = R * 0.4;
  float flower = abs(length(gr) - h);
  for (int i = 0; i < 6; i++) {
    float a = float(i) * (PI / 3.0);
    flower = min(flower, abs(length(gr - vec2(cos(a), sin(a)) * h) - h));
  }
  v += 0.75 * glowOf(flower, 1.1) * step(r, R * 0.8 + 1.0);
  vec2 f = polarFold(gr, 12.0, R * 0.9, 0.0);
  float dLeaf = sdAlmond(vec2(f.y, f.x), R * 0.075, R * 0.028);
  return v + glowOf(abs(dLeaf), 1.0) + fillAA(dLeaf) * 0.35;
}

void drawCasterSigil(inout vec4 c, vec2 s, float t) {
  float k = window4(t, -0.68, -0.5, -0.1, 0.3);
  if (k <= 0.0) return;
  vec2 foot = casterFoot();
  vec2 g = vec2(s.x - foot.x, (s.y - foot.y) * SQUASH);
  float R = 130.0 * easeOut3(prog(t, -0.68, -0.45));
  emit(c, uColor, seedSigil(g, max(R, 1.0), -uPhase * 1.5) * k);
  emit(c, uColor, glowOf(length(g), 60.0) * k * 0.3);
  // 法阵上方升起的花粉光点。
  float up = s.y - foot.y;
  float m = (1.0 - smoothstep(70.0, 130.0, abs(s.x - foot.x))) * smoothstep(-10.0, 20.0, up) * (1.0 - smoothstep(80.0, 240.0, up));
  if (m > 0.0) emit(c, hotColor(0.5), pollen(s, 20.0, uPhase * 90.0, uSeed) * m * k);
}

/** 第 i 道根脉: 自法阵贴地蜿蜒到目标脚下, 发光芯 + 流动光晕 + 沿途斜向根须 + 根梢光点。 */
void drawRoot(inout vec4 c, vec2 s, float t, vec2 foot, float fi) {
  float k = window4(t, -0.6, -0.55, 0.0, 0.3);
  if (k <= 0.0) return;
  vec2 a = casterFoot() + vec2(60.0, 0.0);
  vec2 ab = foot - a;
  float L = length(ab);
  vec2 dir = ab / max(L, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 rel = s - a;
  float x = dot(rel, dir);
  float y = dot(rel, nrm);
  if (x < -20.0 || x > L + 20.0 || abs(y) > 50.0) return;
  float hu = L * easeOut3(prog(t, -0.6 + fi * 0.04, -0.28));
  float ph0 = fi * 1.3 + uSeed * 6.0;
  float xc = clamp(x, 0.0, L);
  float env = sin(xc / max(L, 1.0) * PI);
  float off = sin(xc / 48.0 + ph0) * 16.0 * env;
  float slope = cos(xc / 48.0 + ph0) * 16.0 * env / 48.0;
  float d = abs(y - off) / sqrt(1.0 + slope * slope);
  float shown = 1.0 - smoothstep(hu - 4.0, hu, x);
  float flow = 0.5 + 0.5 * sin(x * 0.08 - uPhase * 26.0);
  emit(c, hotColor(0.6), fillAA(d - 1.2) * shown * k);
  emit(c, uColor, glowOf(d, 3.0 + 3.0 * flow) * shown * k * (0.5 + 0.5 * flow));
  // 根须: 每 44px 一根, 两侧交替斜向分出, 根梢经过后长出。
  float li = floor(x / 44.0);
  float lx = (li + 0.5) * 44.0;
  float side = mod(li, 2.0) < 1.0 ? 1.0 : -1.0;
  float offL = sin(lx / 48.0 + ph0) * 16.0 * sin(clamp(lx / max(L, 1.0), 0.0, 1.0) * PI);
  float pop = clamp((hu - lx) / 60.0, 0.0, 1.0) * step(lx, L - 20.0);
  float dTw = sdSegment(vec2(x - lx, (y - offL) * side), vec2(0.0), vec2(14.0, 12.0) * pop);
  emit(c, uColor, glowOf(dTw, 1.2) * pop * k * 0.7);
  if (t < -0.2) {
    vec2 head = a + dir * hu + nrm * sin(hu / 48.0 + ph0) * 16.0 * sin(clamp(hu / max(L, 1.0), 0.0, 1.0) * PI);
    emit(c, hotColor(0.7), glowOf(length(s - head), 7.0) * (1.0 - step(L - 2.0, hu)) * 1.3);
  }
}

/** 目标脚下的小法阵: 根脉抵达时展开, 爆点瞬间爆亮并外扩一圈。 */
void drawTargetSigil(inout vec4 c, vec2 p, float t, float ti) {
  float t0 = -0.34 + ti * 0.04;
  float k = window4(t, t0, -0.22, 0.2, 0.55);
  if (k <= 0.0) return;
  vec2 g = vec2(p.x, (p.y + FOOT) * SQUASH);
  float R = 96.0 * easeOut3(prog(t, t0, -0.2)) + 24.0 * easeOut3(prog(t, 0.0, 0.3));
  float flare = 1.0 + 1.5 * exp(-max(t, 0.0) * 8.0) * step(0.0, t);
  emit(c, uColor, seedSigil(g, max(R, 1.0), uPhase * 1.2 + ti) * k * 0.9 * flare);
  emit(c, uColor, glowOf(length(g), 40.0) * k * 0.25);
}

float ringTilt(int i) {
  if (i == 0) return 0.32;
  if (i == 1) return -0.48;
  return 1.4;
}

/** 藤环半径: 自远处收拢 → 勒紧 → 崩散外弹。 */
float ringRadius(float t, float fi) {
  float gather = easeOut3(prog(t, -0.5 + fi * 0.05, -0.14));
  float r = mix(340.0, 128.0 + fi * 10.0, gather);
  r = mix(r, 78.0 + fi * 8.0, pow(prog(t, -0.12, 0.0), 2.0));
  if (t > 0.0) r = 78.0 + fi * 8.0 + 210.0 * easeOut3(t / 0.5);
  return r;
}

/** 第 ti 个目标的三道荆棘藤环; front=1 画前半圈(压在目标前), 0 画背后半圈(暗、半透)。 */
void drawRings(inout vec4 c, vec2 p, float t, float ti, float front) {
  if (t < -0.5 || t > 0.55) return;
  float cinch = prog(t, -0.12, 0.0);
  float snapK = t > 0.0 ? 1.0 - prog(t, 0.05, 0.55) : 1.0;
  float wither = prog(t, 0.04, 0.4);
  float thornLen = mix(5.0, 10.0, cinch) + 12.0 * easeOut3(prog(t, 0.0, 0.06));
  float leafPop = easeOut3(prog(t, -0.3, -0.1));
  vec3 leafTint = mix(LEAF_TINT, WITHER, wither);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float tilt = ringTilt(i) + (hash11(ti * 7.3 + uSeed * 11.0) - 0.5) * 0.4;
    float R = ringRadius(t, fi);
    vec2 rr = vec2(R, R * 0.32);
    vec2 pr = rot(p - BIND_C, -tilt);
    if (abs(pr.x) > R + 40.0 || abs(pr.y) > rr.y + 40.0) continue;
    float phi = atan(pr.y / rr.y, pr.x / rr.x);
    float isFront = sin(phi) < 0.0 ? 1.0 : 0.0;
    if (abs(isFront - front) > 0.5) continue;
    // 沿环流动着生长; 爆点后按角度噪声断成碎段。
    float flow = uPhase * 1.4 + fi * 0.33 + ti * 0.21;
    float grow = prog(t, -0.48 + fi * 0.05, -0.18);
    float seg = fract(phi / (2.0 * PI) - flow);
    float shown = max(1.0 - smoothstep(grow - 0.04, grow, seg), step(1.0, grow));
    if (t > 0.0) shown *= step(0.45 + 0.4 * prog(t, 0.0, 0.4), vnoise(vec2(phi * 3.0 + fi * 7.0 + ti * 5.0, uSeed * 9.0)));
    if (shown <= 0.0) continue;
    float k = shown * snapK * (front > 0.5 ? 1.0 : 0.42);
    float w = 4.5 + 2.0 * cinch;
    float dc = abs(sdEllipse(pr, rr));
    paintVine(c, dc, w, k, wither);
    emit(c, hotColor(0.5), fillAA(dc - w) * k * cinch * 0.35 * (1.0 - wither));

    // 倒刺: 每环 18 根、刺尖朝外略向前倾, 爆点齐刷刷弹长(取最近两根, 避免刺被扇区切断)。
    for (int j = 0; j < 2; j++) {
      float pk = (floor(phi / (2.0 * PI) * 18.0) + float(j)) * (2.0 * PI / 18.0);
      vec2 P = vec2(cos(pk), sin(pk)) * rr;
      vec2 n = normalize(vec2(cos(pk) / rr.x, sin(pk) / rr.y));
      vec2 lp = vec2(dot(pr - P, vec2(-n.y, n.x)), dot(pr - P, n) - w * 0.6);
      paintThorn(c, rot(lp, 0.3), 3.2, thornLen, k * (1.0 - wither * 0.6));
    }
    // 叶片: 每环 6 片, 落在倒刺之间, 叶柄贴环、叶身斜向外翻。
    float lk = (floor(phi / (2.0 * PI) * 6.0 + 0.5)) * (2.0 * PI / 6.0) + PI / 18.0;
    vec2 P = vec2(cos(lk), sin(lk)) * rr;
    vec2 n = normalize(vec2(cos(lk) / rr.x, sin(lk) / rr.y));
    vec2 lp = vec2(dot(pr - P, vec2(-n.y, n.x)), dot(pr - P, n));
    paintLeaf(c, rot(lp, -0.5), 26.0 * leafPop, 7.0 * leafPop, leafTint, k * step(0.05, leafPop));
  }
}

/** 六瓣封印花: 爆点瞬间在目标身上绽开(大小两层花瓣 + 外圈细环 + 花心), 缓转后收拢消散。 */
void drawSeal(inout vec4 c, vec2 p, float t) {
  float k = window4(t, -0.04, 0.03, 0.42, 0.6);
  if (k <= 0.0) return;
  float open = easeOut3(prog(t, -0.04, 0.12)) * (1.0 - smoothstep(0.38, 0.58, t));
  vec2 pp = rot(p - BIND_C, -(t * 1.2 + uSeed * 6.0));
  float r = length(pp);
  if (r > 120.0) return;
  for (int layer = 0; layer < 2; layer++) {
    float fl = float(layer);
    float len = (fl < 0.5 ? 66.0 : 40.0) * open;
    vec2 f = polarFold(pp, 6.0, 0.0, fl * PI / 6.0);
    float d = sdAlmond(vec2(f.y - len * 0.5 - 6.0, f.x), len * 0.5 + 0.5, len * 0.22 + 0.5);
    paint(c, mix(LEAF_DARK, LEAF_MID, fl * 0.5), fillAA(d) * k * 0.85);
    emit(c, hotColor(0.35 + 0.3 * fl), (fillAA(abs(d) - 1.4) + 0.5 * glowOf(max(d, 0.0), 6.0)) * k);
    emit(c, uColor, glowOf(abs(f.x), 1.0) * fillAA(d) * k * 0.7);
  }
  emit(c, uColor, glowOf(abs(r - 66.0 * open - 16.0), 1.5) * k * 0.9);
  emit(c, hotColor(0.85), glowOf(r, 8.0) * k * 1.2);
}

void drawImpact(inout vec4 c, vec2 p, float t, float ti) {
  if (t <= 0.0) return;
  float seed = uSeed + ti * 0.37;
  vec2 pc = p - BIND_C;
  float r0 = length(pc);
  emit(c, vec3(1.0), glowOf(r0, 34.0) * exp(-t * 11.0) * 1.5);
  emit(c, uColor, glowOf(r0, 140.0) * exp(-t * 6.0) * 0.6);
  shockRings(c, pc, t, 240.0, 0.8, LEAF_DARK, 8.0);
  // 地面冲击椭圆环。
  vec2 g = vec2(p.x, (p.y + FOOT) * SQUASH);
  float k = prog(t, 0.0, 0.42);
  float R = 60.0 + 230.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(length(g) - R), 2.5 + 8.0 * (1.0 - k)) * (1.0 - k) * 0.9);
  emit(c, hotColor(0.5), burst(pc, t, seed, 12.0, 520.0, 0.4, 160.0, 0.0, 2.0 * PI));
  leafBurst(c, pc, t, seed, 9.0, 480.0, 0.85, 240.0, 0.0, 2.0 * PI);
}

void main() {
  vec2 s = stageCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.34 * window4(t, -0.68, -0.4, 0.3, 0.9);
  paint(c, vec3(0.0, 0.025, 0.01), dim);

  drawCasterSigil(c, s, t);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    drawRoot(c, s, t, stageTarget(i) - vec2(0.0, FOOT), fi);
  }
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    vec2 p = s - stageTarget(i);
    if (abs(p.x) > 420.0 || abs(p.y) > 380.0) continue;
    drawTargetSigil(c, p, t, fi);
    drawRings(c, p, t, fi, 0.0);
    drawSeal(c, p, t);
    drawImpact(c, p, t, fi);
    drawRings(c, p, t, fi, 1.0);
  }

  gl_FragColor = finalize(c * hitEndFade() * stageEdge(s));
}
`;
