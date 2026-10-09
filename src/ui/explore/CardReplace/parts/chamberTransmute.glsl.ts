/**
 * 培养舱「数据重构」片元主体(拼在 GLSL_COMMON 之后), 叠在舱内卡面之上, 只画发光层。
 * 卡面本身的溶解 / 成形由 CSS 遮罩完成(ChamberSequence.module.css), 这里用同一条前沿公式
 * 画出参差的光边与粒子, 盖住遮罩的直线软边。
 *
 * 坐标: q 为画布设计 px, 原点左下; uCard = 卡面框 [x, y, w, h]。
 * 卡内纵向 t = 0 顶 / 1 底。前沿 front 与 CSS 的 --front 同源: 溶解 -0.08 → 1.08(顶→底),
 * 成形 1.08 → -0.08(底→顶), 两段都是线性推进; 可见区永远是 t > front 的一侧。
 * 时间: uPhase = 挂载后秒数; 各段起止为秒, 不存在的段 x < 0。
 *   scan     扫描线自上而下, 扫过处留淡网格与轮廓光
 *   dissolve 光边 + 数据碎屑从前沿剥离上飘
 *   form     前沿上方是全息线框预览, 碎屑从四周汇聚到前沿
 *   settle   整卡白绿闪光 + 底座冲击环
 *   全程      舱内细小气泡上浮
 */
export const GLSL_CHAMBER_TRANSMUTE = /* glsl */ `
uniform vec4 uCard;
uniform vec2 uScan;
uniform vec2 uDissolve;
uniform vec2 uForm;
uniform vec2 uSettle;

const vec3 MINT = vec3(0.66, 1.0, 0.78);
const vec3 LEAF = vec3(0.17, 0.85, 0.42);
const vec3 CORE = vec3(0.92, 1.0, 0.94);

float h11(float x) {
  return fract(sin(x * 127.1 + 311.7) * 43758.5453);
}

float glowOf(float d, float r) {
  return r / (max(d, 0.0) + r);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/** 段内进度; 段不存在时恒为 -1。 */
float segK(vec2 seg, float T) {
  if (seg.x < 0.0) return -1.0;
  return clamp((T - seg.x) / max(seg.y - seg.x, 0.001), 0.0, 1.0);
}

/** 段是否正在进行(含前后各一小段余辉)。 */
float segOn(vec2 seg, float T, float tail) {
  if (seg.x < 0.0) return 0.0;
  return smoothstep(seg.x - 0.05, seg.x + 0.05, T) * (1.0 - smoothstep(seg.y, seg.y + tail, T));
}

void main() {
  vec2 q = vUv * uSize;
  float T = uPhase;
  vec4 c = vec4(0.0);

  vec2 center = uCard.xy + uCard.zw * 0.5;
  vec2 hb = uCard.zw * 0.5;
  float t = 1.0 - (q.y - uCard.y) / uCard.w;
  float inX = smoothstep(-2.0, 2.0, q.x - uCard.x) * smoothstep(-2.0, 2.0, uCard.x + uCard.z - q.x);
  float inCard = inX * step(0.0, t) * step(t, 1.0);
  float box = sdBox(q - center, hb);

  // ---- 舱内气泡(全程, 卡面两侧更密) ----
  float run = smoothstep(0.0, 0.3, T) * (1.0 - smoothstep(uSettle.y, uSettle.y + 0.4, T));
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    float a = h11(fi * 3.17 + uSeed * 41.0);
    float b = h11(fi * 7.31 + uSeed * 13.0);
    float side = a < 0.5 ? -1.0 : 1.0;
    float x = center.x + side * (hb.x * (0.55 + 0.6 * b));
    float speed = 70.0 + 60.0 * b;
    float y = mod(T * speed + a * uSize.y, uSize.y + 20.0) - 10.0;
    x += sin(T * 2.4 + fi) * 5.0;
    float r = 1.6 + 2.4 * b;
    float d = abs(length(q - vec2(x, y)) - r);
    emit(c, MINT, (fillAA(d - 0.6) * 0.5 + glowOf(d, 2.0) * 0.12) * run * (0.4 + 0.6 * a));
  }

  // ---- 扫描 ----
  float ks = segK(uScan, T);
  float scanOn = segOn(uScan, T, 0.18);
  if (scanOn > 0.0) {
    float line = mix(-0.04, 1.04, ks);
    float d = abs(t - line) * uCard.w;
    emit(c, CORE, (fillAA(d - 1.0) + glowOf(d, 5.0) * 0.6) * inX * scanOn);
    // 扫过处: 淡网格 + 轮廓光
    float passed = step(t, line) * inCard;
    vec2 g = abs(fract((q - uCard.xy) / 18.0) - 0.5) * 18.0;
    float grid = fillAA(min(g.x, g.y) - 0.5);
    emit(c, LEAF, grid * passed * 0.12 * scanOn);
    emit(c, MINT, glowOf(abs(box), 3.0) * 0.35 * scanOn * step(t, line + 0.02));
  }

  // ---- 溶解 ----
  float kd = segK(uDissolve, T);
  if (kd >= 0.0) {
    float on = segOn(uDissolve, T, 0.15);
    float front = mix(-0.08, 1.08, kd);
    float e = (t - front + (vnoise(q * 0.07 + uSeed * 9.0) - 0.5) * 0.07) * uCard.w;
    float edge = e > 0.0 ? exp(-e / 7.0) : exp(e / 3.0);
    emit(c, mix(LEAF, CORE, exp(-abs(e) / 2.5)), edge * inX * on * 1.4);
    // 前沿上方一小段方格碎裂
    vec2 cell = floor((q - uCard.xy) / 7.0);
    float crack = step(0.62, h11(cell.x * 13.1 + cell.y * 71.7 + uSeed * 5.0));
    float band = (1.0 - smoothstep(0.0, 26.0, -e)) * step(e, 0.0);
    emit(c, LEAF, crack * band * inX * on * 0.55);
    // 数据碎屑: 前沿扫过其高度时剥离, 上飘并缩小
    for (int i = 0; i < 34; i++) {
      float fi = float(i);
      float a = h11(fi * 1.91 + uSeed * 77.0);
      float b = h11(fi * 4.37 + uSeed * 29.0);
      float ty = h11(fi * 8.13 + uSeed * 3.0);
      float born = uDissolve.x + (uDissolve.y - uDissolve.x) * clamp((ty + 0.08) / 1.16, 0.0, 1.0);
      float age = T - born;
      float life = 0.55 + 0.35 * b;
      if (age <= 0.0 || age >= life) continue;
      float k = age / life;
      vec2 spawn = vec2(uCard.x + uCard.z * (0.05 + 0.9 * a), uCard.y + uCard.w * (1.0 - ty));
      vec2 pos = spawn + vec2((b - 0.5) * 40.0 * age, 50.0 * age + 120.0 * age * age);
      float s = mix(3.2, 0.8, k);
      float d = sdBox(q - pos, vec2(s));
      emit(c, mix(CORE, LEAF, k), (fillAA(d) + glowOf(d, 2.5) * 0.3) * (1.0 - k));
    }
  }

  // ---- 成形 ----
  float kf = segK(uForm, T);
  if (kf >= 0.0) {
    float on = segOn(uForm, T, 0.15);
    float front = mix(1.08, -0.08, kf);
    float e = (t - front + (vnoise(q * 0.07 + uSeed * 17.0) - 0.5) * 0.06) * uCard.w;
    float edge = e > 0.0 ? exp(-e / 4.0) : exp(e / 9.0);
    emit(c, mix(LEAF, CORE, exp(-abs(e) / 2.5)), edge * inX * on * 1.6);
    // 前沿上方: 全息线框预览(轮廓 + 横向扫描纹)
    float ahead = step(t, front) * inCard;
    float rim = fillAA(abs(box) - 0.8) + glowOf(abs(box), 2.0) * 0.4;
    float rows = fillAA(abs(fract((q.y - uCard.y) / 9.0) - 0.5) * 9.0 - 0.6);
    emit(c, MINT, rim * step(t, front) * on * 0.7);
    emit(c, LEAF, rows * ahead * on * 0.14);
    // 汇聚碎屑: 从四周飞向前沿到达其高度的位置
    for (int i = 0; i < 34; i++) {
      float fi = float(i);
      float a = h11(fi * 2.53 + uSeed * 61.0);
      float b = h11(fi * 5.89 + uSeed * 19.0);
      float ty = h11(fi * 9.71 + uSeed * 7.0);
      float arrive = uForm.x + (uForm.y - uForm.x) * clamp((1.08 - ty) / 1.16, 0.0, 1.0);
      float k = 1.0 - (arrive - T) / 0.5;
      if (k <= 0.0 || k >= 1.0) continue;
      vec2 target = vec2(uCard.x + uCard.z * (0.05 + 0.9 * a), uCard.y + uCard.w * (1.0 - ty));
      float ang = b * 6.2832;
      vec2 from = target + vec2(cos(ang), sin(ang)) * (90.0 + 60.0 * a);
      float ease = k * k;
      vec2 pos = mix(from, target, ease);
      float d = sdBox(q - pos, vec2(mix(1.0, 2.8, k)));
      emit(c, mix(LEAF, CORE, k), (fillAA(d) + glowOf(d, 2.5) * 0.3) * smoothstep(0.0, 0.2, k));
    }
  }

  // ---- 收束: 闪光 + 底座冲击环 ----
  float kt = segK(uSettle, T);
  if (kt > 0.0 && kt < 1.0) {
    float flash = (1.0 - kt) * (1.0 - kt);
    emit(c, CORE, inCard * flash * 0.45);
    emit(c, MINT, glowOf(max(box, 0.0), 10.0) * flash * 0.6);
    vec2 base = vec2(center.x, uCard.y - 14.0);
    float R = mix(0.4, 1.3, 1.0 - (1.0 - kt) * (1.0 - kt)) * hb.x * 1.2;
    float d = abs(sdEllipse(q - base, vec2(R, R * 0.22)));
    emit(c, mix(LEAF, CORE, flash), (fillAA(d - 1.2) + glowOf(d, 3.0) * 0.6) * flash);
  }

  gl_FragColor = finalize(c);
}
`;
