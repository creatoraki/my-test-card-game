/**
 * 植物学家 · 食人花噬咬。以爆点为零点(t = hitTime()):
 *   破土  [-0.56, -0.36] 粗茎自左下探出, 两瓣捕虫夹以根部为铰点弹出并张到最大, 口内透出血红光;
 *   窥伺  [-0.36, -0.09] 夹瓣随呼吸开合, 齿列微颤;
 *   合口  [-0.09, 0]     两瓣加速咬合, 齿列交错扣死;
 *   爆点  0              闪光 + 接缝一道亮线 + 冲击环 + 汁液自夹口前端喷溅 + 碎叶上扬;
 *   咀嚼  [0, 0.42]      夹瓣闭合状态下两次挤压抖动;
 *   松口  [0.42, 0.89]   夹瓣微张, 自噪声溶解成绿色余烬, 末尾整体淡出。
 */
export const GLSL_FLYTRAP_BITE = /* glsl */ `
#define TRAP_L 340.0
#define TRAP_H 150.0
#define OPEN_MAX 0.72
#define CLOSED 0.035
const vec2 HINGE = vec2(-182.0, -6.0);

/** 单瓣张开角(rad): 弹出后张满并呼吸, 合口段加速闭合, 咀嚼时小幅抖动, 松口微张。 */
float trapOpen(float t) {
  float emerge = easeOut3(prog(t, -0.56, -0.36));
  float wide = (OPEN_MAX + 0.06 * sin(uPhase * 9.0)) * emerge;
  float snap = prog(t, -0.09, 0.0);
  if (t <= 0.0) return mix(wide, CLOSED, snap * snap);
  float chew = CLOSED + 0.07 * abs(sin(t * 15.0)) * exp(-t * 3.5);
  return mix(chew, 0.3, smoothstep(0.42, 0.66, t));
}

/** 整体缩放: 弹出带回弹, 咬合瞬间轻微鼓胀。 */
float trapScale(float t) {
  float u = prog(t, -0.56, -0.38);
  float s = mix(0.25, 1.0, easeOut3(u)) + 0.1 * sin(u * PI);
  if (t > 0.0) s *= 1.0 + 0.05 * exp(-t * 18.0);
  return s;
}

float trapAlive(vec2 p, float dis) {
  float n = vnoise(p * 0.035 + uSeed * 5.0);
  return 1.0 - smoothstep(n - 0.08, n, dis);
}

/** 夹瓣本体(局部坐标: 铰点为原点, 接缝沿 +x, 瓣身在 +y)。 */
void lobeBody(inout vec4 c, vec2 p, float s, float k, float dis) {
  float dE = sdEllipse(p - vec2(TRAP_L * 0.5, 0.0), vec2(TRAP_L * 0.5, TRAP_H)) * s;
  float d = max(dE, -p.y * s);
  if (d > 14.0) return;
  float alive = trapAlive(p, dis);
  float n = vnoise(p * 0.035 + uSeed * 5.0);
  float ember = smoothstep(n - 0.16, n - 0.08, dis) * alive;
  float body = fillAA(d) * k * alive;
  // 靠接缝一侧是血红内壁, 外侧是深绿瓣背, 外缘再压暗。
  float inner = 1.0 - smoothstep(0.0, TRAP_H * 0.45, p.y);
  vec3 col = mix(LEAF_MID, uColor * 0.8, inner);
  col = mix(col, LEAF_DARK, smoothstep(-24.0, 0.0, dE) * 0.8);
  // 自铰点放射的叶脉。
  float ang = atan(p.y, p.x);
  float vein = abs(fract(ang * 5.0 + 0.5) - 0.5) * length(p) * 0.4;
  col += LEAF_TINT * 0.18 * (1.0 - smoothstep(0.6, 1.8, vein)) * (1.0 - inner);
  paint(c, col, body * 0.96);
  emit(c, uColor, inner * body * 0.22);
  emit(c, hotColor(0.3), fillAA(abs(d) - 1.0) * k * alive * 0.55);
  emit(c, hotColor(0.6), ember * k * 1.3);
}

/** 接缝上的齿列: 中段最长, 齿尖朝另一瓣并略向夹口前端倾斜; x0 为首齿位置(两瓣错开半齿距, 咬合时交错)。 */
void lobeTeeth(inout vec4 c, vec2 p, float s, float k, float dis, float x0) {
  float idx = clamp(floor((p.x - x0) / 20.0 + 0.5), 0.0, 13.0);
  float xk = x0 + idx * 20.0;
  float env = sin(clamp(xk / TRAP_L, 0.0, 1.0) * PI);
  float len = 16.0 + 24.0 * env;
  vec2 tp = rot(vec2(p.x - xk, 2.0 - p.y), 0.25);
  float d = sdThorn(tp, 3.2, len) * s;
  if (d > 8.0) return;
  float alive = trapAlive(p, dis);
  float along = clamp(tp.y / len, 0.0, 1.0);
  paint(c, mix(LEAF_MID, vec3(0.92, 0.88, 0.66), along), fillAA(d) * k * alive);
  emit(c, hotColor(0.6), fillAA(abs(d) - 0.6) * k * alive * 0.45);
}

void drawStem(inout vec4 c, vec2 q, float t, float k) {
  float grow = easeOut3(prog(t, -0.56, -0.4));
  vec2 a = HINGE + vec2(-4.0, -6.0);
  vec2 b = a + vec2(-80.0, -330.0);
  vec2 ab = b - a;
  float h = clamp(dot(q - a, ab) / dot(ab, ab), 0.0, 1.0);
  if (h > grow + 0.02) return;
  vec2 axis = a + ab * h;
  vec2 nrm = normalize(vec2(-ab.y, ab.x));
  float wave = sin(h * 9.0 + uPhase * 3.0) * 10.0 * h;
  float d = abs(dot(q - axis, nrm) - wave);
  paintVine(c, d, mix(12.0, 16.0, h), k, 0.0);
  // 茎上两片叶。
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float hl = 0.35 + 0.3 * fi;
    if (hl > grow) continue;
    vec2 base = a + ab * hl + nrm * (sin(hl * 9.0 + uPhase * 3.0) * 10.0 * hl);
    float side = fi < 0.5 ? 1.0 : -1.0;
    float leafAng = atan(nrm.y, nrm.x) + (side > 0.0 ? 0.5 : PI - 0.5);
    paintLeaf(c, rot(q - base, -leafAng), 46.0, 12.0, LEAF_TINT, k);
  }
}

void drawTrap(inout vec4 c, vec2 q, float t) {
  if (t < -0.56 || t > 0.9) return;
  float k = smoothstep(-0.56, -0.5, t);
  float dis = prog(t, 0.5, 0.86) * 1.1;
  float a = trapOpen(t);
  float s = trapScale(t);
  drawStem(c, q, t, k * (1.0 - prog(t, 0.55, 0.86)));

  vec2 rel = q - HINGE;
  vec2 up = rot(rel, -a) / s;
  vec2 dn = rot(rel, a) / s;
  dn.y = -dn.y;
  // 张口时口腔内透出的血红光。
  float mouth = clamp(a / OPEN_MAX, 0.0, 1.0) * k * (1.0 - step(0.0, t));
  emit(c, uColor, glowOf(length(q - vec2(-40.0, HINGE.y)), 50.0) * mouth * 0.3);

  lobeBody(c, dn, s, k, dis);
  lobeBody(c, up, s, k, dis);
  lobeTeeth(c, dn, s, k, dis, 44.0);
  lobeTeeth(c, up, s, k, dis, 34.0);
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q - vec2(-10.0, 0.0));
  emit(c, hotColor(0.7), glowOf(r0, 26.0) * exp(-t * 14.0) * 1.2);
  // 合口亮线: 沿接缝一道横向闪光。
  float xm = smoothstep(HINGE.x, HINGE.x + 40.0, q.x) * (1.0 - smoothstep(HINGE.x + TRAP_L - 20.0, HINGE.x + TRAP_L + 40.0, q.x));
  emit(c, hotColor(0.85), glowOf(abs(q.y - HINGE.y), 3.0) * xm * exp(-t * 9.0));
  float k = prog(t, 0.0, 0.4);
  float R = 30.0 + 200.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(r0 - R), 2.5 + 6.0 * (1.0 - k)) * (1.0 - k) * 0.8);
  // 汁液自夹口前端喷出后下坠, 碎叶自上瓣扬起。
  vec2 lip = vec2(HINGE.x + TRAP_L - 30.0, HINGE.y);
  emit(c, hotColor(0.35), burst(q - lip, t, uSeed, 14.0, 520.0, 0.55, 600.0, -0.7, 1.9));
  emit(c, uColor, burst(q, t, uSeed + 0.4, 12.0, 420.0, 0.5, 520.0, 0.5, 2.1) * 0.8);
  leafBurst(c, q - vec2(20.0, 90.0), t, uSeed + 0.27, 8.0, 420.0, 0.85, 260.0, 0.4, 2.3);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.3 * smoothstep(-0.56, -0.3, t) * (1.0 - smoothstep(0.2, 0.7, t));
  paint(c, vec3(0.03, 0.0, 0.01), dim * (1.0 - smoothstep(120.0, 290.0, length(q))));

  drawTrap(c, q, t);
  drawImpact(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
