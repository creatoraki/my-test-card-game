/**
 * 预言家 · 碎星矢。以爆点为零点(t = hitTime()):
 *   凝星  [-0.26, -0.16] 画布左缘一点星光凝聚成四芒星;
 *   飞矢  [-0.16, 0]     四芒星矢疾射, 三粒伴星螺旋缠绕尾迹, 尾迹带棱光;
 *   爆点  0              白闪 + 六边晶环 + 星芒十字 + 十二枚晶片旋转迸散;
 *   余晶  → 0.95         晶片减速坠落、闪烁熄灭, 末尾整体淡出。
 */
export const GLSL_STAR_SHARD = /* glsl */ `
#define LAUNCH_X (-330.0)
#define LAUNCH_Y 40.0

/** 正六边形 SDF。 */
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

/** 菱形晶片 SDF(半长 a、半宽 b)。 */
float sdShard(vec2 p, float a, float b) {
  vec2 q = abs(p);
  return (q.x / a + q.y / b - 1.0) * min(a, b) * 0.9;
}

vec2 boltPos(float t) {
  float u = prog(t, -0.16, 0.0);
  vec2 from = vec2(LAUNCH_X, LAUNCH_Y);
  // 微微上拱的弧线, 末段加速。
  float e = u * (0.45 + 0.55 * u);
  return mix(from, vec2(0.0), e) + vec2(0.0, sin(e * PI) * 36.0);
}

void drawCharge(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.26, -0.2, -0.17, -0.14);
  if (k <= 0.0) return;
  vec2 p = q - vec2(LAUNCH_X, LAUNCH_Y);
  float grow = prog(t, -0.26, -0.17);
  emit(c, hotColor(0.6), twinkle(rot(p, grow * 2.0), 10.0 + 22.0 * grow) * k);
  emit(c, uColor, glowOf(length(p), 16.0) * k * 0.6);
}

void drawBolt(inout vec4 c, vec2 q, float t) {
  if (t < -0.16 || t > 0.0) return;
  vec2 head = boltPos(t);
  // 尾迹: 回溯 8 个历史位置连成折线, 越早越淡越细。
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float t0 = t - fi * 0.012;
    float t1 = t - (fi + 1.0) * 0.012;
    if (t1 < -0.16) break;
    float d = sdSegment(q, boltPos(t0), boltPos(t1));
    float f = 1.0 - fi / 8.0;
    emit(c, hotColor(0.5), fillAA(d - 2.6 * f) * f * 0.9);
    emit(c, uColor, glowOf(max(d, 0.0), 6.0 + 6.0 * (1.0 - f)) * f * 0.55);
    // 棱光: 尾迹边缘偏青与偏粉各一道细线。
    emit(c, vec3(0.45, 0.85, 1.0), glowOf(abs(d - 4.0 * f), 0.8) * f * 0.35);
    emit(c, vec3(1.0, 0.55, 0.85), glowOf(abs(d - 6.0 * f), 0.8) * f * 0.3);
  }
  // 伴星: 三粒绕飞行轴螺旋。
  vec2 dir = normalize(boltPos(t) - boltPos(t - 0.01) + vec2(0.0001, 0.0));
  vec2 nrm = vec2(-dir.y, dir.x);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ph = uPhase * 38.0 + fi * 2.094;
    vec2 pos = head - dir * (14.0 + fi * 16.0) + nrm * sin(ph) * (10.0 + fi * 2.0);
    emit(c, hotColor(0.8), twinkle(q - pos, 6.0) * (0.6 + 0.4 * cos(ph)));
  }
  emit(c, vec3(1.0), twinkle(rot(q - head, uPhase * 20.0), 26.0) * 1.2);
  emit(c, uColor, glowOf(length(q - head), 20.0) * 0.7);
}

void drawShatter(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 22.0) * exp(-t * 14.0) * 1.4);
  emit(c, uColor, glowOf(r0, 80.0) * exp(-t * 8.0) * 0.55);
  float kr = exp(-t * 10.0);
  emit(c, vec3(1.0), (rayAt(q, 0.0, 180.0, 1.4) + rayAt(q, PI * 0.5, 140.0, 1.4)) * kr);

  // 六边晶环: 外扩变细, 内侧再套一圈慢的。
  float k = prog(t, 0.0, 0.36);
  float dHex = abs(sdHexagon(rot(q, uSeed * 1.5), 20.0 + 150.0 * easeOut3(k))) - mix(2.4, 0.4, k);
  emit(c, hotColor(0.6), (fillAA(dHex) + 0.5 * glowOf(max(dHex, 0.0), 6.0)) * (1.0 - k));
  float k2 = prog(t, 0.04, 0.5);
  float dHex2 = abs(sdHexagon(rot(q, uSeed * 1.5 + 0.52), 14.0 + 90.0 * easeOut3(k2))) - 0.8;
  emit(c, uColor, fillAA(dHex2) * (1.0 - k2) * 0.8 * step(0.04, t));

  // 晶片: 旋转迸散, 减速后下坠, 两种色相交替, 边缘闪光。
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 5.1 + uSeed * 23.0);
    float h2 = hash11(fi * 2.7 + uSeed * 11.0);
    float life = 0.5 + 0.3 * h2;
    float lk = 1.0 - t / life;
    if (lk <= 0.0) continue;
    float a = fi * (2.0 * PI / 12.0) + (h1 - 0.5) * 0.5;
    vec2 dir = vec2(cos(a), sin(a));
    float sp = 260.0 + 220.0 * h2;
    vec2 pos = dir * sp * (1.0 - exp(-5.0 * t)) / 5.0 - vec2(0.0, 140.0 * t * t);
    vec2 p = rot(q - pos, -(a + t * (6.0 + 8.0 * h1)));
    float size = 7.0 + 7.0 * h1;
    float d = sdShard(p, size, size * 0.38);
    vec3 col = mod(fi, 2.0) < 0.5 ? hotColor(0.55) : mix(uColor, vec3(0.6, 0.85, 1.0), 0.4);
    float glint = 0.6 + 0.4 * sin(uPhase * 30.0 + fi * 1.7);
    emit(c, col, fillAA(d) * lk * glint);
    emit(c, uColor, glowOf(max(d, 0.0), 4.0) * lk * 0.5);
  }
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.22 * smoothstep(-0.26, -0.1, t) * (1.0 - smoothstep(0.04, 0.35, t));
  paint(c, vec3(0.03, 0.01, 0.08), dim * (1.0 - smoothstep(90.0, 240.0, length(q))));

  drawCharge(c, q, t);
  drawBolt(c, q, t);
  drawShatter(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
