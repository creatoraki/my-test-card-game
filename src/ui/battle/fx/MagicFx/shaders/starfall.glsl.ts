/**
 * 预言家 · 星陨。以爆点为零点(t = hitTime()):
 *   锁定  [-0.45, 0.05] 星象准星环自 130px 收拢到 58px, 四段弧 + 刻度 + 内嵌五芒星反向旋转;
 *   坠落  [-0.26, 0]    陨星自右上斜坠, 头部白核 + 渐长彗尾, 尾迹里闪碎星;
 *   爆点  0             白闪 + 五芒星光爆 + 十字长芒 + 冲击环 + 四散星屑;
 *   余辉  → 1.15        十二颗小星闪向外漂散, 末尾整体淡出。
 */
export const GLSL_STARFALL = /* glsl */ `
#define FALL_START (-0.26)
const vec2 FALL_FROM = vec2(250.0, 340.0);

void drawLock(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.45, -0.36, -0.02, 0.06);
  if (k <= 0.0) return;
  float s = prog(t, -0.45, 0.0);
  float R = mix(130.0, 58.0, easeOut3(s));
  float spin = s * 1.8;
  vec2 p = rot(q, -spin);
  float r = length(p);
  // 四段弧: 在四个轴向留缺口, 缺口里各插一根向内的刻度。
  float v = abs(fract(atan(p.y, p.x) / (PI * 0.5)) - 0.5);
  float arc = 1.0 - smoothstep(0.36, 0.4, v);
  float dRing = abs(r - R) - 0.9;
  emit(c, hotColor(0.45), fillAA(dRing) * arc * k);
  emit(c, uColor, glowOf(max(dRing, 0.0), 5.0) * arc * k * 0.5);
  vec2 f = abs(p);
  float dTick = min(sdSegment(f, vec2(R - 16.0, 0.0), vec2(R + 8.0, 0.0)), sdSegment(f, vec2(0.0, R - 16.0), vec2(0.0, R + 8.0))) - 1.0;
  emit(c, hotColor(0.7), (fillAA(dTick) + 0.4 * glowOf(max(dTick, 0.0), 3.0)) * k);
  // 内嵌五芒星: 反向旋转, 越收越亮。
  float dStar = abs(sdStar5(rot(q, spin * 1.4), R * 0.62, 0.42)) - 0.7;
  emit(c, uColor, (fillAA(dStar) * 0.8 + 0.35 * glowOf(max(dStar, 0.0), 4.0)) * k * (0.4 + 0.6 * s));
}

void drawMeteor(inout vec4 c, vec2 q, float t) {
  if (t < FALL_START || t > 0.18) return;
  vec2 dir = normalize(FALL_FROM);
  float u = prog(t, FALL_START, 0.0);
  vec2 head = FALL_FROM * (1.0 - mix(u, u * u, 0.55));
  float len = 50.0 + 230.0 * u;
  // 爆点后头部已没入目标, 只剩彗尾向来路收缩消散。
  float after = t > 0.0 ? exp(-t * 18.0) : 1.0;
  vec2 r = rot(q - head, -atan(dir.y, dir.x));
  if (r.x > -20.0 && r.x < len) {
    float along = clamp(r.x / len, 0.0, 1.0);
    float w = 8.0 * (1.0 - along) + 0.5;
    float d = abs(r.y) - w;
    float fade = (1.0 - along) * (1.0 - along) * step(0.0, r.x);
    emit(c, hotColor(0.55), fillAA(d) * fade * after);
    emit(c, uColor, glowOf(max(d, 0.0), 12.0) * fade * after * 0.7);
    float n = vnoise(vec2(r.x * 0.07 - uPhase * 9.0, r.y * 0.35 + uSeed * 20.0));
    emit(c, vec3(1.0), smoothstep(0.72, 0.9, n) * (1.0 - along) * step(abs(r.y), 16.0) * after);
  }
  if (t <= 0.0) {
    float dh = length(q - head);
    emit(c, vec3(1.0), glowOf(dh, 7.0) * 1.3);
    emit(c, uColor, glowOf(dh, 34.0) * 0.55);
  }
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  float kf = exp(-t * 12.0);
  emit(c, vec3(1.0), glowOf(r0, 26.0) * kf * 1.4);
  emit(c, uColor, glowOf(r0, 90.0) * exp(-t * 7.0) * 0.6);

  // 五芒星光爆: 星形实心闪一下, 轮廓继续外扩变淡。
  float ks = easeOut3(t / 0.28);
  float spin = uSeed * 1.2 + t * 0.8;
  float dStar = sdStar5(rot(q, spin), 34.0 + 150.0 * ks, 0.38);
  emit(c, hotColor(0.7), fillAA(dStar) * exp(-t * 16.0));
  emit(c, hotColor(0.35), glowOf(abs(dStar), 5.0) * exp(-t * 6.0) * 0.9);

  // 十字长芒 + 斜向短芒。
  float kr = exp(-t * 9.0);
  emit(c, vec3(1.0), (rayAt(q, 0.0, 230.0, 1.5) + rayAt(q, PI * 0.5, 170.0, 1.5)) * kr);
  emit(c, uColor, (rayAt(q, PI * 0.25, 80.0, 1.2) + rayAt(q, -PI * 0.25, 80.0, 1.2)) * kr * 0.8);

  // 冲击环。
  float k = prog(t, 0.0, 0.42);
  float dRing = abs(r0 - (20.0 + 190.0 * easeOut3(k))) - mix(3.0, 0.4, k);
  emit(c, hotColor(0.5), (fillAA(dRing) + 0.5 * glowOf(max(dRing, 0.0), 8.0)) * (1.0 - k));

  // 星屑: 一圈四散后下坠。
  float sp = burst(q, t, uSeed, 14.0, 560.0, 0.5, 260.0, 0.0, 2.0 * PI)
           + burst(q, t, uSeed + 0.51, 10.0, 360.0, 0.42, 200.0, PI * 0.15, PI * 0.7) * 0.8;
  emit(c, hotColor(0.75), sp);
}

/** 余辉: 小星闪从爆点向外缓慢漂散并闪烁。 */
void drawStardust(inout vec4 c, vec2 q, float t) {
  if (t <= 0.04) return;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.7 + uSeed * 17.0);
    float h2 = hash11(fi * 9.1 + uSeed * 5.0);
    float born = 0.04 + 0.12 * h2;
    float lt = t - born;
    if (lt <= 0.0) continue;
    float life = 0.45 + 0.3 * h1;
    float k = 1.0 - lt / life;
    if (k <= 0.0) continue;
    float a = h1 * 2.0 * PI;
    vec2 pos = vec2(cos(a), sin(a)) * (60.0 + 140.0 * h2) * easeOut3(lt / life * 1.4) + vec2(0.0, 30.0 * lt);
    float tw = 0.55 + 0.45 * sin(uPhase * 26.0 + fi * 2.3);
    emit(c, hotColor(0.6), twinkle(q - pos, 7.0 + 6.0 * h2) * k * tw);
  }
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 局部压暗: 夜空感, 让星光从立绘上跳出来。
  float dim = 0.32 * smoothstep(-0.45, -0.2, t) * (1.0 - smoothstep(0.05, 0.4, t));
  paint(c, vec3(0.03, 0.01, 0.08), dim * (1.0 - smoothstep(90.0, 260.0, length(q * vec2(0.8, 1.0)))));

  drawLock(c, q, t);
  drawMeteor(c, q, t);
  drawImpact(c, q, t);
  drawStardust(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
