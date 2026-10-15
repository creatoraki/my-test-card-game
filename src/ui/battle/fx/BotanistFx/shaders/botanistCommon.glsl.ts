/**
 * 植物学家特效的公共着色器片段(拼在 GLSL_COMMON + GLSL_HIT_COMMON + GLSL_MAGIC_COMMON 之后)。
 * 坐标约定沿用命中特效: q 以画布中心(目标中心)为原点、y 朝上、单位设计 px; t = hitTime() 以爆点为零点。
 * 叶片/藤身用固定的植物绿, 不随 uColor 变(食人花、孢子等主色不是绿色, 叶子仍应是绿的)。
 */
export const GLSL_BOTANIST_COMMON = /* glsl */ `
const vec3 LEAF_DARK = vec3(0.04, 0.12, 0.035);
const vec3 LEAF_MID = vec3(0.2, 0.48, 0.13);
const vec3 LEAF_TINT = vec3(0.46, 0.84, 0.3);
const vec3 BARK = vec3(0.17, 0.1, 0.045);
const vec3 WITHER = vec3(0.32, 0.22, 0.09);

/** 叶片 SDF: 叶柄在原点、沿 +x 伸出, 长 len、半宽 w。 */
float sdLeaf(vec2 p, float len, float w) {
  return sdAlmond(p - vec2(len * 0.5, 0.0), len * 0.5, w);
}

/** 尖刺 SDF: 底边中心在原点、底宽 2b, 尖端朝 +y、高 h(等腰三角)。 */
float sdThorn(vec2 p, float b, float h) {
  vec2 k = vec2(b, max(h, 0.5));
  p = vec2(abs(p.x), k.y - p.y);
  vec2 a = p - k * clamp(dot(p, k) / dot(k, k), 0.0, 1.0);
  vec2 e = p - k * vec2(clamp(p.x / k.x, 0.0, 1.0), 1.0);
  vec2 d = min(vec2(dot(a, a), -(p.x * k.y - p.y * k.x)), vec2(dot(e, e), -(p.y - k.y)));
  return -sqrt(d.x) * sign(d.y);
}

/** 一片叶子(局部坐标, 叶柄在原点朝 +x): 暗绿叶身 + 亮叶缘 + 主脉。 */
void paintLeaf(inout vec4 c, vec2 p, float len, float w, vec3 tint, float k) {
  if (k <= 0.0) return;
  float d = sdLeaf(p, len, w);
  if (d > 6.0) return;
  float body = fillAA(d) * k;
  float shade = clamp(p.y / max(w, 0.5) * 0.5 + 0.5, 0.0, 1.0);
  paint(c, mix(LEAF_DARK, tint * 0.7, shade), body * 0.95);
  emit(c, tint, fillAA(abs(d) - 0.7) * k * 0.55);
  float vein = max(abs(p.y) - 0.6, max(-p.x, p.x - len * 0.9));
  emit(c, mix(tint, vec3(1.0), 0.45), fillAA(vein) * body * 0.45);
}

/** 尖刺着色(局部坐标同 sdThorn): 暗色刺身 + 亮色刺缘 + 刺尖一点高光。 */
void paintThorn(inout vec4 c, vec2 p, float b, float h, float k) {
  if (k <= 0.0 || h < 1.0) return;
  float d = sdThorn(p, b, h);
  if (d > 10.0) return;
  float along = clamp(p.y / h, 0.0, 1.0);
  paint(c, mix(LEAF_DARK, BARK, along), fillAA(d) * k * 0.95);
  emit(c, hotColor(0.25), fillAA(abs(d) - 0.7) * k * (0.35 + 0.5 * along));
  emit(c, hotColor(0.7), glowOf(length(p - vec2(0.0, h)), 2.0) * k * 0.6);
}

/**
 * 藤身着色: d 为到中心线的距离, w 为半宽; 暗绿体 + 中线亮芯 + 亮边 + 主色柔光。
 * wither ∈ [0,1] 为枯萎程度: 藤身转枯黄、亮边与柔光熄灭。
 */
void paintVine(inout vec4 c, float d, float w, float k, float wither) {
  if (k <= 0.0) return;
  float body = fillAA(d - w) * k;
  float core = 1.0 - clamp(d / max(w, 0.5), 0.0, 1.0);
  vec3 col = mix(mix(LEAF_DARK, LEAF_MID, core), mix(BARK, WITHER, core), wither);
  paint(c, col, body * 0.95);
  float lit = 1.0 - wither * 0.85;
  emit(c, hotColor(0.3), fillAA(abs(d - w) - 0.8) * k * 0.5 * lit);
  emit(c, uColor, glowOf(max(d - w, 0.0), 6.0) * k * 0.3 * lit);
}

/**
 * 自原点炸开的翻飞叶片(至多 12 片): t 为爆发后秒数, ang0/spread 为发射扇区, gravity>0 下坠;
 * 叶片边飞边自转、按周期压扁叶宽模拟翻面, 末段缩小淡出。
 */
void leafBurst(inout vec4 c, vec2 q, float t, float seed, float count, float speed, float life, float gravity, float ang0, float spread) {
  if (t <= 0.0 || t >= life) return;
  float k = 1.0 - smoothstep(life * 0.55, life, t);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 11.3 + seed * 71.9);
    float h2 = hash11(fi * 5.17 + seed * 23.1);
    float h3 = hash11(fi * 3.91 + seed * 47.7);
    float a = ang0 + spread * h1;
    float sp = speed * (0.5 + 0.8 * h2);
    vec2 pos = vec2(cos(a), sin(a)) * sp * (1.0 - exp(-3.5 * t)) / 3.5 - vec2(0.0, gravity * t * t);
    pos.x += sin(t * (6.0 + 4.0 * h3) + fi) * 12.0 * t;
    float len = (14.0 + 12.0 * h3) * (1.0 - 0.4 * smoothstep(life * 0.5, life, t));
    vec2 p = q - pos;
    if (dot(p, p) > len * len * 0.4) continue;
    float spin = a + (h2 - 0.5) * 14.0 * t + h3 * 6.0;
    float flip = 0.3 + 0.7 * abs(sin(t * (8.0 + 6.0 * h1) + h2 * 6.0));
    paintLeaf(c, rot(p, -spin) + vec2(len * 0.5, 0.0), len, len * 0.3 * flip, LEAF_TINT, k);
  }
}

/** 花粉光点: 网格散点(约半数格子有点)随 rise 上移并闪烁, cell 为格距; 调用方自乘区域遮罩。 */
float pollen(vec2 q, float cell, float rise, float seed) {
  vec2 g = vec2(q.x, q.y - rise);
  vec2 id = floor(g / cell);
  vec2 f = fract(g / cell) - 0.5;
  float h = hash21(id + seed * 17.0);
  vec2 off = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * 0.7;
  float d = length((f - off) * cell);
  float tw = 0.5 + 0.5 * sin(uPhase * (6.0 + 6.0 * h) + h * 30.0);
  float r = 1.4 + 1.6 * h;
  return step(0.55, h) * glowOf(d, r) * (1.0 - smoothstep(r * 2.0, r * 5.0, d)) * tw;
}

/**
 * 极坐标重复: 把 p 折进 n 等分扇区中最近的一格, 返回 (切向偏移, 径向偏移 r - R);
 * spin 为整体转角(逆时针为正)。用于环上等距排布的刺、叶、囊等纹章元素。
 */
vec2 polarFold(vec2 p, float n, float R, float spin) {
  float sec = 2.0 * PI / n;
  float a = atan(p.y, p.x) - spin;
  float am = mod(a + sec * 0.5, sec) - sec * 0.5;
  float r = length(p);
  return vec2(r * sin(am), r * cos(am) - R);
}

/**
 * 一记三重冲击环(自 p 原点外扩): 厚暗带 + 亮边 + 主色外圈错位; lt 为起爆后秒数,
 * size 为外扩距离, power 为强度, wob 为环边按角度起伏的幅度(0 = 正圆)。
 */
void shockRings(inout vec4 c, vec2 p, float lt, float size, float power, vec3 dark, float wob) {
  if (lt <= 0.0) return;
  float r0 = length(p);
  float a = atan(p.y, p.x);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float li = lt - fi * 0.06;
    float kr = prog(li, 0.0, 0.42);
    if (li <= 0.0 || kr >= 1.0) continue;
    float R = 30.0 + size * easeOut3(kr) + wob * kr * sin(a * 7.0 + fi * 2.1 + uSeed * 6.0);
    float w = mix(18.0, 2.0, kr);
    float fade = (1.0 - kr) * power * (1.0 - fi * 0.25);
    paint(c, dark, fillAA(abs(r0 - R) - w) * fade * 0.55);
    emit(c, hotColor(0.75), fillAA(abs(r0 - R - w) - 1.6) * fade);
    emit(c, uColor, (fillAA(abs(r0 - R - w - 6.0) - 2.0) + glowOf(abs(r0 - R - w - 6.0), 8.0) * 0.6) * fade);
  }
}
`;
