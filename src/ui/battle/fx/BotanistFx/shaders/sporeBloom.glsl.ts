/**
 * 植物学家 · 毒孢菌爆。以爆点为零点(t = hitTime()):
 *   菌丝  [-0.50, -0.10] 目标脚下的地面浮现发光菌丝网, 自中心向四周蔓延;
 *   菇长  [-0.34, -0.06] 三朵毒蘑菇依次破土长高, 菌盖鼓胀, 盖面斑点发亮;
 *   蓄爆  [-0.06, 0]     菌盖压扁蓄力;
 *   爆点  0              三朵菌盖同时炸开: 紫色闪光 + 孢子向上喷射 + 冲击环;
 *   毒雾  [0, 1.05]      翻涌的孢子云自下而上吞没目标, 云中孢子光点上飘、毒泡鼓起又破裂;
 *   消散  [0.55, 1.10]   菌柄缩回地面, 孢子云变稀散去, 末尾整体淡出。
 */
export const GLSL_SPORE_BLOOM = /* glsl */ `
#define GROUND_Y (-128.0)
const vec3 SPORE_DARK = vec3(0.07, 0.025, 0.09);
const vec3 STALK = vec3(0.62, 0.57, 0.5);

void drawMycelium(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.5, -0.4, 0.3, 0.8);
  if (k <= 0.0) return;
  // 地面透视: 纵向压扁 3.5 倍。
  vec2 g = vec2(q.x, (q.y - GROUND_Y) * 3.5);
  float r = length(g);
  float R = 250.0 * easeOut3(prog(t, -0.5, -0.12));
  float mask = (1.0 - smoothstep(R * 0.7, R, r)) * (1.0 - smoothstep(30.0, 70.0, abs(q.y - GROUND_Y)));
  if (mask <= 0.0) return;
  float n = vnoise(g * 0.035 + uSeed * 9.0);
  float n2 = vnoise(g * 0.08 + uSeed * 4.0 + 7.0);
  float lines = (1.0 - smoothstep(0.0, 0.035, abs(n - 0.5))) + 0.6 * (1.0 - smoothstep(0.0, 0.03, abs(n2 - 0.5)));
  float pulse = 0.7 + 0.3 * sin(r * 0.05 - uPhase * 14.0);
  emit(c, uColor, lines * mask * k * pulse * 0.8);
  emit(c, uColor, glowOf(r, 60.0) * mask * k * 0.25);
}

/** 第 i 朵蘑菇的成长进度(0 未出土 → 1 长成), 爆点后缩回。 */
float shroomGrow(float t, float i) {
  float g = easeOut3(prog(t, -0.34 + i * 0.06, -0.14 + i * 0.04));
  return g * (1.0 - smoothstep(0.08, 0.42, t));
}

void drawShroom(inout vec4 c, vec2 q, float t, vec2 base, float size, float i) {
  float g = shroomGrow(t, i);
  if (g <= 0.0) return;
  vec2 p = (q - base) / size;
  if (abs(p.x) > 70.0 || p.y < -6.0 || p.y > 140.0) return;
  float h = 72.0 * g;
  // 爆点前菌盖压扁蓄力, 爆点后菌盖消失只剩菌柄。
  float squash = prog(t, -0.06, 0.0);
  vec2 capR = vec2(46.0, 34.0) * g * vec2(1.0 + 0.18 * squash, 1.0 - 0.25 * squash);
  float capOn = 1.0 - step(0.0, t);
  float wob = sin(uPhase * 18.0 + i * 2.0) * 1.5 * g;

  float sw = 9.0 * (1.0 - 0.25 * clamp(p.y / max(h, 1.0), 0.0, 1.0));
  float dStem = sdBox(p - vec2(wob * clamp(p.y / max(h, 1.0), 0.0, 1.0), h * 0.5), vec2(sw, h * 0.5)) * size;
  paint(c, STALK * 0.75, fillAA(dStem));
  emit(c, uColor, fillAA(abs(dStem) - 0.7) * 0.35);

  if (capOn <= 0.0) return;
  vec2 cp = p - vec2(wob, h);
  float dCap = max(sdEllipse(cp, capR), -(cp.y + capR.y * 0.22)) * size;
  float body = fillAA(dCap);
  vec3 col = mix(SPORE_DARK, uColor * 0.55, clamp(cp.y / max(capR.y, 1.0), 0.0, 1.0));
  paint(c, col, body);
  emit(c, hotColor(0.35), fillAA(abs(dCap) - 1.0) * 0.8);
  // 盖面斑点: 网格散点, 蓄力时越来越亮。
  vec2 sp = cp / 13.0 + uSeed * 3.0 + i;
  vec2 id = floor(sp);
  vec2 f = fract(sp) - 0.5 - (vec2(hash21(id), hash21(id + 5.3)) - 0.5) * 0.4;
  float spot = (1.0 - smoothstep(0.16, 0.24, length(f))) * step(0.35, hash21(id + 1.7));
  emit(c, hotColor(0.6), spot * body * (0.45 + 0.9 * squash));
}

/** 孢子云中心与半径(爆点后先急速膨胀, 再缓慢上浮)。 */
vec3 cloudShape(float t) {
  float u = easeOut3(prog(t, 0.0, 0.35));
  return vec3(0.0, mix(-90.0, 10.0, u) + 30.0 * prog(t, 0.35, 1.1), mix(40.0, 210.0, u));
}

void drawCloud(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float k = 1.0 - smoothstep(0.55, 1.05, t);
  if (k <= 0.0) return;
  vec3 cs = cloudShape(t);
  vec2 p = q - cs.xy;
  float n = fbm(q * 0.011 + vec2(uSeed * 7.0, -uPhase * 0.7));
  float n2 = fbm(q * 0.024 + vec2(-uPhase * 0.4, uSeed * 3.0));
  float r = length(p * vec2(0.82, 1.0)) + (n - 0.5) * 110.0;
  float mask = 1.0 - smoothstep(cs.z * 0.45, cs.z, r);
  // 消散段: 噪声阈值升高, 云团变稀成絮。
  float thin = prog(t, 0.5, 1.05);
  float dens = smoothstep(0.25 + 0.4 * thin, 0.7 + 0.2 * thin, n2 * 0.6 + n * 0.6);
  paint(c, SPORE_DARK, mask * dens * k * 0.6);
  emit(c, uColor, mask * dens * dens * k * 0.45);
  float rim = smoothstep(0.42, 0.5, n2) * (1.0 - smoothstep(0.5, 0.6, n2)) * mask;
  emit(c, hotColor(0.3), rim * k * 0.4);
  // 云中孢子: 两层网格散点, 大小不同、上飘速度不同。
  float m2 = 1.0 - smoothstep(cs.z * 0.3, cs.z * 1.05, length(p));
  emit(c, hotColor(0.55), (pollen(q, 18.0, t * 80.0, uSeed) + 0.7 * pollen(q * 0.7, 20.0, t * 40.0, uSeed + 0.5)) * m2 * k);
}

/** 毒泡: 八个气泡在云中鼓起上浮, 到时破裂成一圈溅点。 */
void drawBubbles(inout vec4 c, vec2 q, float t) {
  if (t <= 0.05 || t > 1.0) return;
  vec3 cs = cloudShape(t);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.7 + uSeed * 11.0);
    float h2 = hash11(fi * 9.1 + uSeed * 4.0);
    float born = 0.05 + h1 * 0.4;
    float popT = born + 0.18 + 0.2 * h2;
    float lt = t - born;
    if (lt <= 0.0 || t > popT + 0.14) continue;
    vec2 pos = cs.xy + vec2((h1 - 0.5) * cs.z * 1.1, (h2 - 0.6) * cs.z * 0.9 + lt * 60.0);
    float rad = (6.0 + 10.0 * h2) * smoothstep(0.0, 0.08, lt);
    float d = length(q - pos);
    if (t < popT) {
      float dRing = abs(d - rad) - 1.0;
      emit(c, hotColor(0.45), fillAA(dRing) * 0.9 + glowOf(max(dRing, 0.0), 2.0) * 0.3);
      emit(c, hotColor(0.9), glowOf(length(q - pos - vec2(-rad, rad) * 0.4), 1.2) * 0.6);
    } else {
      float pt = (t - popT) / 0.14;
      float R = rad * (1.0 + 1.6 * pt);
      float a = atan(q.y - pos.y, q.x - pos.x);
      float dots = smoothstep(0.6, 0.9, cos(a * 6.0 + h1 * 6.0));
      emit(c, hotColor(0.6), glowOf(abs(d - R), 1.2) * dots * (1.0 - pt));
    }
  }
}

void drawImpact(inout vec4 c, vec2 q, float t, vec2 b0, vec2 b1, vec2 b2) {
  if (t <= 0.0) return;
  float flash = exp(-t * 14.0);
  vec2 caps[3];
  caps[0] = b0 + vec2(0.0, 72.0 * 0.8);
  caps[1] = b1 + vec2(0.0, 72.0 * 1.15);
  caps[2] = b2 + vec2(0.0, 72.0 * 0.9);
  for (int i = 0; i < 3; i++) {
    vec2 p = q - caps[i];
    emit(c, hotColor(0.7), glowOf(length(p), 16.0) * flash * 1.1);
    emit(c, hotColor(0.5), burst(p, t, uSeed + float(i) * 0.31, 10.0, 520.0, 0.42, -80.0, 0.9, 1.4));
  }
  float r0 = length(q);
  float k = prog(t, 0.0, 0.42);
  float R = 30.0 + 200.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(r0 - R), 2.5 + 7.0 * (1.0 - k)) * (1.0 - k) * 0.8);
  emit(c, hotColor(0.6), glowOf(r0, 30.0) * flash * 0.9);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.3 * smoothstep(-0.5, -0.2, t) * (1.0 - smoothstep(0.4, 1.0, t));
  paint(c, vec3(0.02, 0.0, 0.03), dim * (1.0 - smoothstep(120.0, 290.0, length(q))));

  vec2 b0 = vec2(-108.0, GROUND_Y);
  vec2 b1 = vec2(12.0, GROUND_Y - 6.0);
  vec2 b2 = vec2(118.0, GROUND_Y + 2.0);
  drawMycelium(c, q, t);
  drawShroom(c, q, t, b0, 0.8, 0.0);
  drawShroom(c, q, t, b2, 0.9, 2.0);
  drawShroom(c, q, t, b1, 1.15, 1.0);
  drawCloud(c, q, t);
  drawBubbles(c, q, t);
  drawImpact(c, q, t, b0, b1, b2);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
