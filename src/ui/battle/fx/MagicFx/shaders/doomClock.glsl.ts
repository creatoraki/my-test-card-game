/**
 * 咒术师 · 死兆钟盘。以爆点为零点(t = hitTime()):
 *   现盘  [-0.55, -0.42] 目标身后弹出一面古钟盘(暗面青边 + 60 分刻 + 12 时刻 + 外圈符文带), 过冲后定住;
 *   走针  [-0.45, -0.08] 分针连转三圈、时针追赶, 越转越快, 双针同时指向子时;
 *   压拍  [-0.08, 0]     钟盘微缩蓄力, 子时刻位爆亮, 裂纹自盘心蔓延全盘;
 *   爆点  0              钟盘碎裂: 巨型白核闪 + 12 道时刻光芒射出 + 三重厚冲击环(双色错位) + 16 枚盘面碎片飞散;
 *   余响  0.30           第二声钟鸣, 小一号的冲击环 + 闪光;
 *   消散  → 1.35         碎片落尽, 末尾整体淡出。
 */
export const GLSL_DOOM_CLOCK = /* glsl */ `
const vec3 CLOCK_DARK = vec3(0.02, 0.05, 0.07);
const vec2 CLOCK_C = vec2(0.0, 10.0);
#define CLOCK_R 150.0
#define TOLL2 0.30

float clockScale(float t) {
  float u = prog(t, -0.55, -0.42);
  float pop = 1.0 + 0.12 * sin(u * PI) * (1.0 - u);
  float squeeze = 1.0 - 0.06 * easeOut3(prog(t, -0.08, 0.0));
  return mix(0.5, 1.0, easeOut3(u)) * pop * squeeze;
}

/** 双针角度(弧度, 0 = 朝右, 逆时针为正); 顺时针走针 = 角度递减, 终点 PI/2 即子时。 */
vec2 handAngles(float t) {
  float u = prog(t, -0.45, -0.08);
  float e = u * u * (3.0 - 2.0 * u);
  return vec2(PI * 0.5 + (1.0 - e) * 6.0 * PI, PI * 0.5 + (1.0 - e) * 0.9 * PI);
}

/** 盘面裂纹: 自盘心向外的 8 道锯齿裂缝, grow 为长度比例。 */
float crackDist(vec2 p, float grow) {
  float d = 1e5;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float a = fi * (PI * 0.25) + (hash11(fi * 3.7 + uSeed * 9.0) - 0.5) * 0.5;
    vec2 r = rot(p, -a);
    float len = CLOCK_R * (0.75 + 0.3 * hash11(fi * 1.9 + uSeed)) * grow;
    if (r.x < 0.0 || r.x > len) continue;
    float jag = (vnoise(vec2(r.x * 0.08, fi * 4.0 + uSeed * 10.0)) - 0.5) * 16.0 * (r.x / CLOCK_R);
    d = min(d, abs(r.y - jag) - 1.4 * (1.0 - r.x / max(len, 1.0)) - 0.4);
  }
  return d;
}

void drawClock(inout vec4 c, vec2 q, float t) {
  if (t < -0.55 || t > 0.0) return;
  float sc = clockScale(t);
  vec2 p = (q - CLOCK_C) / sc;
  float r = length(p);
  float a = atan(p.y, p.x);
  float k = smoothstep(-0.55, -0.48, t);
  float charge = prog(t, -0.3, 0.0);

  // 盘面: 暗色半透, 边缘一圈青光。
  paint(c, CLOCK_DARK, fillAA((r - CLOCK_R) * sc) * k * 0.62);
  emit(c, uColor, glowOf(abs(r - CLOCK_R), 8.0) * k * (0.5 + 0.8 * charge));
  float dOuter = min(abs(r - CLOCK_R), abs(r - CLOCK_R + 10.0)) - 1.0;
  emit(c, hotColor(0.45), fillAA(dOuter * sc) * k);

  // 60 分刻 + 12 时刻(四正位加粗), 子时刻位为菱形并随蓄力爆亮。
  float u60 = fract((a + PI) / (2.0 * PI) * 60.0) - 0.5;
  float dMin = max(abs(u60) * (2.0 * PI * (CLOCK_R - 5.0) / 60.0) - 0.7, abs(r - CLOCK_R + 5.0) - 3.0);
  float u12 = fract((a + PI) / (2.0 * PI) * 12.0 + 0.5) - 0.5;
  float i12 = floor((a + PI) / (2.0 * PI) * 12.0 + 0.5);
  float major = 1.0 - step(0.5, mod(i12, 3.0));
  float dHour = max(abs(u12) * (2.0 * PI * (CLOCK_R - 22.0) / 12.0) - (2.0 + 1.6 * major), abs(r - CLOCK_R + 24.0) - (9.0 + 4.0 * major));
  emit(c, hotColor(0.35), fillAA(min(dMin, dHour) * sc) * k * 0.9);
  vec2 pTop = rot(p - vec2(0.0, CLOCK_R - 24.0), PI * 0.25);
  float dTop = sdBox(pTop, vec2(7.0)) - 1.0;
  emit(c, hotColor(0.8), (fillAA(dTop * sc) + glowOf(max(dTop, 0.0), 6.0 + 20.0 * charge) * (0.4 + 1.6 * charge)) * k);

  // 外圈符文带: 12 段短弧反向慢转。
  float band = fract((a + PI) / (2.0 * PI) * 12.0 - t * 0.6);
  float dBand = max(abs(r - CLOCK_R - 16.0) - 2.0, abs(band - 0.5) * 60.0 - 18.0);
  emit(c, uColor, fillAA(dBand * sc) * k * 0.8);

  // 双针 + 盘心。
  vec2 ang = handAngles(t);
  float dMinute = sdSegment(p, vec2(0.0), vec2(cos(ang.x), sin(ang.x)) * CLOCK_R * 0.82) - 2.2;
  float dHourH = sdSegment(p, vec2(0.0), vec2(cos(ang.y), sin(ang.y)) * CLOCK_R * 0.52) - 4.0;
  float dHands = min(min(dMinute, dHourH), length(p) - 8.0);
  paint(c, CLOCK_DARK, fillAA((dHands - 1.5) * sc) * k);
  emit(c, hotColor(0.6), fillAA(dHands * sc) * k);
  emit(c, uColor, glowOf(max(dHands, 0.0), 6.0) * k * (0.5 + charge));
  // 分针拖影: 扫过的扇区淡光。
  float sweep = mod(a - ang.x, 2.0 * PI);
  emit(c, uColor, (1.0 - smoothstep(0.0, 0.9, sweep)) * step(r, CLOCK_R * 0.82) * k * 0.18 * step(t, -0.08));

  // 压拍裂纹。
  float grow = easeOut3(prog(t, -0.06, 0.0));
  if (grow > 0.0) {
    float dCrack = crackDist(p, grow);
    emit(c, vec3(1.0), fillAA(dCrack * sc) * k * 1.2);
    emit(c, uColor, glowOf(max(dCrack, 0.0), 5.0) * k);
  }
}

/** 一记钟鸣冲击: 厚暗带 + 双色错位亮边外扩。 */
void tollRings(inout vec4 c, vec2 q, float lt, float size, float power) {
  if (lt <= 0.0) return;
  float r0 = length(q - CLOCK_C);
  for (int i = 0; i < 3; i++) {
    float li = lt - float(i) * 0.06;
    float kr = prog(li, 0.0, 0.42);
    if (li <= 0.0 || kr >= 1.0) continue;
    float R = 30.0 + size * easeOut3(kr);
    float w = mix(18.0, 2.0, kr);
    float fade = (1.0 - kr) * power * (1.0 - float(i) * 0.25);
    paint(c, CLOCK_DARK, fillAA(abs(r0 - R) - w) * fade * 0.55);
    emit(c, vec3(1.0), fillAA(abs(r0 - R - w) - 1.6) * fade);
    emit(c, uColor, (fillAA(abs(r0 - R - w - 6.0) - 2.0) + glowOf(abs(r0 - R - w - 6.0), 8.0) * 0.6) * fade);
  }
}

void drawShatter(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  vec2 p = q - CLOCK_C;
  float r0 = length(p);
  // 巨型白核闪 + 大范围青光。
  emit(c, vec3(1.0), glowOf(r0, 42.0) * exp(-t * 10.0) * 2.0);
  emit(c, uColor, glowOf(r0, 170.0) * exp(-t * 6.0) * 0.8);
  emit(c, uColor, exp(-t * 16.0) * 0.25);
  // 12 道时刻光芒。
  float kr = exp(-t * 7.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * (PI / 6.0) + PI * 0.5;
    float big = mod(float(i), 3.0) < 0.5 ? 1.0 : 0.55;
    emit(c, hotColor(0.7), rayAt(p, a, 340.0 * big, 2.0) * kr * big * step(0.0, dot(p, vec2(cos(a), sin(a)))) * 1.2);
  }
  tollRings(c, q, t, 300.0, 1.0);
  tollRings(c, q, t - TOLL2, 220.0, 0.6);
  emit(c, vec3(1.0), glowOf(r0, 26.0) * (t > TOLL2 ? exp(-(t - TOLL2) * 14.0) : 0.0) * 1.2);

  // 16 枚盘面碎片: 自盘面各处向外飞散旋转, 暗面亮边。
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 5.3 + uSeed * 17.0);
    float h2 = hash11(fi * 8.9 + uSeed * 3.0);
    float life = 0.55 + 0.3 * h2;
    float lk = 1.0 - t / life;
    if (lk <= 0.0) continue;
    float a = fi * (2.0 * PI / 16.0) + (h1 - 0.5) * 0.4;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 start = dir * CLOCK_R * (0.35 + 0.55 * h2);
    float sp = 420.0 + 380.0 * h1;
    vec2 pos = start + dir * sp * (1.0 - exp(-4.0 * t)) / 4.0 - vec2(0.0, 220.0 * t * t);
    vec2 lp = rot(p - pos, -(a + t * (5.0 + 9.0 * h1)));
    float size = 12.0 + 12.0 * h1;
    vec2 aq = abs(lp);
    float d = (aq.x / size + aq.y / (size * 0.55) - 1.0) * size * 0.45;
    paint(c, CLOCK_DARK, fillAA(d) * lk);
    emit(c, hotColor(0.5), fillAA(abs(d) - 0.9) * lk);
    emit(c, uColor, glowOf(max(d, 0.0), 5.0) * lk * 0.5);
  }
  emit(c, hotColor(0.7), burst(p, t, uSeed, 14.0, 640.0, 0.45, 200.0, 0.0, 2.0 * PI));
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 局部压暗: 压拍时最深, 爆点后迅速退去。
  float dim = 0.3 * smoothstep(-0.55, -0.3, t) + 0.2 * prog(t, -0.08, 0.0);
  dim *= 1.0 - smoothstep(0.02, 0.4, t);
  paint(c, vec3(0.0, 0.01, 0.03), dim * (1.0 - smoothstep(150.0, 320.0, length(q - CLOCK_C))));

  drawClock(c, q, t);
  drawShatter(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
