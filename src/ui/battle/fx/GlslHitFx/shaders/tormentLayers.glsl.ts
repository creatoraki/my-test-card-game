/**
 * 痛楚特效的分层绘制函数，由 torment.glsl.ts 的 main 按「后 → 前」顺序组合。
 * 约定同 glslHitCommon：q 为设计 px、y 朝上；t 为相对爆点的秒数，age = max(t, 0)。
 */
export const GLSL_TORMENT_LAYERS = /* glsl */ `
#define T_WISPS 7
#define T_NEEDLES 12
#define T_VEINS 6
#define T_VEIN_SEGS 4

const vec3 TORMENT_INK = vec3(0.06, 0.01, 0.09);

/** 鬼火色阶：暗紫 → 主色 → 淡紫白。 */
vec3 tormentRamp(float h) {
  vec3 dark = vec3(0.14, 0.02, 0.24);
  vec3 hot = vec3(0.98, 0.88, 1.0);
  return h < 0.5 ? mix(dark, uColor, h * 2.0) : mix(uColor, hot, (h - 0.5) * 2.0);
}

/** 两端半径不同的线段(锥形)，ra 在 a 端、rb 在 b 端。 */
float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}

/** 以 at 为中心、w 为宽度的一次脉冲。 */
float tormentBeat(float x, float at, float w) {
  float d = (x - at) / w;
  return exp(-d * d);
}

/** 怨雾：预兆段旋转着向目标收拢，爆点后鼓胀并被噪声逐步蚀散。 */
void tormentMiasma(inout vec4 c, vec2 q, float t, float age, float life) {
  float r = length(q);
  float pre = smoothstep(-uImpact, 0.0, t);
  float radius = t < 0.0 ? mix(190.0, 125.0, easeOut3(pre)) : mix(125.0, 170.0, easeOut3(age / 0.35));
  float twist = (1.0 - pre) * 2.2 + age * 0.8;
  vec2 m = rot(q, twist * exp(-r / 160.0));
  float n = fbm(m * 0.011 + vec2(0.0, -uPhase * 0.6) + uSeed * 13.0);
  float erode = smoothstep(0.1, life, age) * 0.9;
  float dens = smoothstep(0.0, 0.55, 1.0 - r / radius + (n - 0.5) * 1.1 - erode);
  float env = smoothstep(-uImpact, -uImpact * 0.4, t);
  // 中心留得更透，避免把角色立绘整块盖黑。
  paint(c, TORMENT_INK, dens * 0.42 * env * (0.55 + 0.45 * smoothstep(30.0, 110.0, r)));
  emit(c, uColor * 0.7, dens * (1.0 - dens) * 0.9 * env);
}

/** 怨魂第 i 缕在进度 k 时的位置：沿螺旋从外圈旋入中心。 */
vec2 tormentWispPos(float fi, float h, float k) {
  float a = fi * (2.0 * PI / float(T_WISPS)) + uSeed * 6.0 + (1.0 - k) * (2.0 + h);
  float d = mix(180.0 + 25.0 * h, 4.0, pow(k, 1.5));
  return vec2(cos(a), sin(a) * 0.85) * d;
}

/** 怨魂：带拖尾的鬼火错时螺旋旋入，全部在爆点汇入目标。 */
void tormentWisps(inout vec4 c, vec2 q, float t) {
  if (t > 0.03) return;
  float leave = 1.0 - smoothstep(0.0, 0.03, t);
  for (int i = 0; i < T_WISPS; i++) {
    float fi = float(i);
    float h = hash11(fi * 5.7 + uSeed * 29.0);
    float raw = 1.0 + t / (uImpact * (0.7 + 0.3 * h));
    if (raw <= 0.0) continue;
    float k = clamp(raw, 0.0, 1.0);
    float vis = smoothstep(0.0, 0.25, raw) * leave;
    vec2 p0 = tormentWispPos(fi, h, k);
    vec2 p1 = tormentWispPos(fi, h, max(k - 0.07, 0.0));
    vec2 p2 = tormentWispPos(fi, h, max(k - 0.14, 0.0));
    vec2 p3 = tormentWispPos(fi, h, max(k - 0.21, 0.0));
    float d = min(sdTaper(q, p0, p1, 5.5, 3.4), min(sdTaper(q, p1, p2, 3.4, 1.6), sdTaper(q, p2, p3, 1.6, 0.2)));
    emit(c, uColor, (fillAA(d) * 0.8 + 0.6 * glowOf(d, 7.0)) * vis);
    emit(c, hotColor(0.75), glowOf(length(q - p0) - 2.0, 3.5) * vis);
  }
}

/** 鬼火：爆点后自目标身上窜起的紫焰，亮边半透芯，边升边烧尽。 */
void tormentFlames(inout vec4 c, vec2 q, float age, float life) {
  if (age <= 0.0) return;
  float grow = easeOut3(age / 0.25);
  float burn = clamp(age / life, 0.0, 1.0);
  vec2 fq = q - vec2(0.0, -20.0 + 80.0 * age);
  vec2 e = fq / vec2(60.0 + 50.0 * grow, 80.0 + 90.0 * grow);
  float n1 = fbm(vec2(q.x * 0.022, q.y * 0.018 - uPhase * 2.6) + uSeed * 7.0);
  float n2 = fbm(q * 0.05 - vec2(0.0, uPhase * 4.2) + uSeed * 19.0);
  float shape = 1.0 - length(e) + (n1 - 0.5) * 1.3 + (n2 - 0.5) * 0.4;
  // 上半部让噪声更多地抬高轮廓，拉出上卷的火舌。
  shape += max(fq.y, 0.0) / 120.0 * 0.5 * (n1 - 0.4);
  shape -= burn * burn * 1.7;
  float dens = smoothstep(0.0, 0.25, shape) * grow;
  float rim = dens * (1.0 - smoothstep(0.25, 0.6, shape));
  paint(c, tormentRamp(0.2 + 0.4 * clamp(shape, 0.0, 1.0)), dens * 0.38);
  emit(c, uColor, rim * 0.85);
  emit(c, hotColor(0.6), smoothstep(0.55, 0.9, shape) * 0.6 * (1.0 - burn));
}

/** 痛刺：爆点瞬间从目标体内向外扎出的一圈锥形尖刺，随后脱离并消散。 */
void tormentNeedles(inout vec4 c, vec2 q, float age) {
  if (age <= 0.0 || age > 0.34) return;
  float shoot = easeOut3(age / 0.07);
  float drift = 12.0 + 50.0 * easeOut3(age / 0.34);
  float fade = 1.0 - smoothstep(0.05, 0.34, age);
  float acc = 0.0;
  for (int i = 0; i < T_NEEDLES; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.7 + uSeed * 53.0);
    float h2 = hash11(fi * 9.1 + uSeed * 17.0);
    float a = fi * (2.0 * PI / float(T_NEEDLES)) + (h1 - 0.5) * 0.45 + uSeed * 3.0;
    vec2 dir = vec2(cos(a), sin(a));
    float len = (70.0 + 100.0 * h2) * shoot;
    float d = sdTaper(q, dir * drift, dir * (drift + len), 2.0 + 2.2 * h2, 0.15);
    acc += fillAA(d) + 0.5 * glowOf(d, 5.0);
  }
  emit(c, hotColor(0.65), acc * fade);
  emit(c, uColor, acc * fade * 0.5);
}

/** 痛脉：自中心爬满全身的锯齿裂纹，随两次心跳般的抽痛明暗起伏。 */
void tormentVeins(inout vec4 c, vec2 q, float age, float throb, float fade) {
  if (age <= 0.0) return;
  float grow = easeOut3(age / 0.18) * float(T_VEIN_SEGS);
  float acc = 0.0;
  for (int i = 0; i < T_VEINS; i++) {
    float fi = float(i);
    float a = fi * (2.0 * PI / float(T_VEINS)) + uSeed * 5.0 + (hash11(fi * 2.3 + uSeed * 7.0) - 0.5) * 0.5;
    vec2 p0 = vec2(cos(a), sin(a)) * 10.0;
    for (int j = 0; j < T_VEIN_SEGS; j++) {
      float fj = float(j);
      float hj = hash11(fi * 17.3 + fj * 3.1 + uSeed * 41.0);
      a += (hj - 0.5) * 1.1;
      vec2 p1 = p0 + vec2(cos(a), sin(a)) * (40.0 - fj * 5.0);
      float vis = clamp(grow - fj, 0.0, 1.0);
      if (vis <= 0.0) break;
      float d = sdSegment(q, p0, mix(p0, p1, vis)) - mix(2.2, 0.7, fj / float(T_VEIN_SEGS - 1));
      acc += fillAA(d) + 0.45 * glowOf(d, 4.0);
      // 第 2、3 段起点各分出一条细枝。
      if (j == 1 || j == 2) {
        float ba = a + (hj > 0.5 ? 0.95 : -0.95);
        float bd = sdSegment(q, p0, p0 + vec2(cos(ba), sin(ba)) * 20.0 * vis) - 0.6;
        acc += fillAA(bd) + 0.3 * glowOf(bd, 3.0);
      }
      p0 = p1;
    }
  }
  vec3 col = mix(uColor, hotColor(0.7), clamp(throb - 0.4, 0.0, 1.0));
  emit(c, col, acc * throb * fade);
}
`;
