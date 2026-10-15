/**
 * 植物学家 · 荆棘鞭笞。以爆点为零点(t = hitTime()):
 *   蓄势  [-0.38, -0.12] 左上方绿色光点向鞭梢起点汇聚, 一圈卷须盘紧蓄力;
 *   抽打  [-0.12, 0.12]  荆棘长鞭沿大弧线自左上抽向右下, 外缘一排倒刺, 鞭梢甩出亮弧残影;
 *   爆点  0              鞭梢扫过目标中心: 切线方向一道亮绿裂痕 + 闪光 + 刺屑与飞叶顺势甩出;
 *   收鞭  [0, 0.32]      鞭身自根部追上鞭梢收走;
 *   余痕  [0.05, 0.75]   目标身上留下带刺的弧形鞭痕, 渐暗消散, 末尾整体淡出。
 */
export const GLSL_THORN_WHIP = /* glsl */ `
// 鞭弧: 圆心在目标右上, 半径恰好穿过目标中心(角度 225° 处)。
const vec2 WHIP_C = vec2(120.0, 120.0);
#define WHIP_R 169.71
#define WHIP_A0 2.5
#define WHIP_A1 5.354
#define WHIP_HIT 3.927

/** 鞭梢角度: 中段最快, 爆点正好扫过 225°。 */
float whipHead(float t) {
  return mix(WHIP_A0, WHIP_A1, smoothstep(-0.12, 0.12, t));
}

/** 鞭根角度: 晚一拍出发, 收鞭时追上鞭梢。 */
float whipTail(float t) {
  return mix(WHIP_A0, WHIP_A1, smoothstep(-0.05, 0.32, t));
}

/** 像素在鞭弧上的角度(展开到 [WHIP_A0 - π/2, WHIP_A0 + 3π/2) 内, 与鞭梢角度同一取值区间)。 */
float arcAngle(vec2 p) {
  float a = atan(p.y, p.x);
  return WHIP_A0 - PI * 0.5 + mod(a - (WHIP_A0 - PI * 0.5), 2.0 * PI);
}

void drawGather(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.38, -0.3, -0.14, -0.06);
  if (k <= 0.0) return;
  vec2 start = WHIP_C + WHIP_R * vec2(cos(WHIP_A0), sin(WHIP_A0));
  vec2 p = q - start;
  float u = prog(t, -0.38, -0.12);
  // 盘紧的卷须: 阿基米德螺线, 随蓄力收紧并加速旋转。
  float r = length(p);
  float a = atan(p.y, p.x) + u * u * 9.0;
  float pitch = mix(9.0, 5.0, u);
  float ph = r / pitch - a / (2.0 * PI);
  float d = abs(fract(ph) - 0.5) * pitch;
  float coil = (1.0 - smoothstep(24.0, 54.0 - 16.0 * u, r)) * smoothstep(2.0, 6.0, r);
  emit(c, uColor, (fillAA(d - 1.2) + 0.4 * glowOf(d, 2.0)) * coil * k);
  emit(c, hotColor(0.6), glowOf(r, 6.0 + 8.0 * u) * k * (0.4 + 0.6 * u));
  // 汇聚光点: 十粒自外圈向起点收拢。
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float h = hash11(fi * 6.1 + uSeed * 9.0);
    float ang = fi * 0.63 + uSeed * 6.0;
    float lr = mix(150.0 + 60.0 * h, 6.0, fract(u * (1.2 + 0.4 * h) + h));
    vec2 pos = lr * vec2(cos(ang + u * 2.0), sin(ang + u * 2.0));
    emit(c, hotColor(0.5), glowOf(length(p - pos), 2.0) * k * 0.8);
  }
}

void drawWhip(inout vec4 c, vec2 q, float t) {
  if (t < -0.12 || t > 0.34) return;
  float head = whipHead(t);
  float tail = min(whipTail(t), head);
  if (head - tail < 0.01) return;
  vec2 p = q - WHIP_C;
  float r = length(p);
  if (abs(r - WHIP_R) > 46.0) return;
  float a = arcAngle(p);

  // 鞭梢残影: 鞭梢前方没有, 后方 0.9 rad 内一条亮弧, 越近鞭梢越亮。
  float behind = head - a;
  if (behind > 0.0 && behind < 0.9) {
    float f = 1.0 - behind / 0.9;
    float dSlash = abs(r - WHIP_R + 4.0);
    emit(c, hotColor(0.55), (fillAA(dSlash - 1.2 * f) + glowOf(dSlash, 3.0 + 6.0 * f)) * f * f * 0.9);
  }
  if (a < tail || a > head) return;

  // 鞭身: 近根部粗、向鞭梢渐细, 带轻微波动。
  float along = (a - tail) / max(head - tail, 0.01);
  float w = mix(9.0, 1.6, along * along);
  float wave = sin(a * 26.0 - uPhase * 20.0) * 2.5 * (1.0 - along);
  float d = abs(r - WHIP_R - wave);
  float k = smoothstep(0.0, 0.04, head - a);
  paintVine(c, d, w, k, 0.0);

  // 外缘倒刺: 每 0.14 rad 一根, 刺尖朝外并逆着抽打方向倾斜。
  float spacing = 0.14;
  float idx = floor((a - WHIP_A0) / spacing + 0.5);
  float ak = WHIP_A0 + idx * spacing;
  if (ak >= tail && ak <= head) {
    float alongK = (ak - tail) / max(head - tail, 0.01);
    float wk = mix(9.0, 1.6, alongK * alongK);
    vec2 radial = vec2(cos(ak), sin(ak));
    vec2 tang = vec2(-radial.y, radial.x);
    vec2 base = WHIP_C + radial * (WHIP_R + wk - 1.0);
    vec2 lp = vec2(dot(q - base, tang), dot(q - base, radial));
    paintThorn(c, rot(lp, -0.5), 3.5 * (1.0 - 0.5 * alongK), 15.0 * (1.0 - 0.6 * alongK), k);
  }
  // 内缘每 0.42 rad 一片小叶, 叶尖朝鞭根方向。
  float li = floor((a - WHIP_A0) / 0.42 + 0.5);
  float al = WHIP_A0 + li * 0.42 + 0.21;
  if (al >= tail && al <= head) {
    vec2 radial = vec2(cos(al), sin(al));
    vec2 base = WHIP_C + radial * (WHIP_R - 5.0);
    vec2 lp = q - base;
    float leafAng = atan(-radial.y, -radial.x) + 0.9;
    paintLeaf(c, rot(lp, -leafAng), 24.0, 6.0, LEAF_TINT, k);
  }
}

/** 鞭痕: 鞭梢扫过后在目标身上留下的弧形伤口, 带一排小刺, 渐暗消散。 */
void drawScar(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.02, 0.03, 0.4, 0.75);
  if (k <= 0.0) return;
  vec2 p = q - WHIP_C;
  float a = arcAngle(p);
  float span = 0.6;
  float m = abs(a - WHIP_HIT) / span;
  if (m > 1.0) return;
  float taper = 1.0 - m * m;
  float d = abs(length(p) - WHIP_R + 4.0);
  float flash = 1.0 + 2.0 * exp(-max(t, 0.0) * 12.0);
  paint(c, vec3(0.02, 0.06, 0.01), fillAA(d - 4.0 * taper) * k * 0.6);
  emit(c, hotColor(0.6), (fillAA(d - 1.4 * taper) + 0.5 * glowOf(d, 4.0)) * taper * k * flash);
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, hotColor(0.8), glowOf(r0, 22.0) * exp(-t * 15.0) * 1.3);
  // 切线方向的一道裂光(抽打方向: 右下)。
  vec2 tang = vec2(0.7071, -0.7071);
  vec2 lp = vec2(dot(q, tang), dot(q, vec2(-tang.y, tang.x)));
  float len = 60.0 + 200.0 * easeOut3(t / 0.12);
  float fade = exp(-t * 7.0);
  float dCut = abs(lp.y) - 2.2 * (1.0 - smoothstep(0.0, len, abs(lp.x)));
  emit(c, hotColor(0.85), (fillAA(dCut) + glowOf(max(dCut, 0.0), 5.0) * 0.7) * fade * (1.0 - smoothstep(len * 0.6, len, abs(lp.x))));
  float k = prog(t, 0.0, 0.32);
  float R = 18.0 + 150.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(r0 - R), 2.0 + 5.0 * (1.0 - k)) * (1.0 - k) * 0.7);
  // 刺屑顺抽打方向甩出, 飞叶向右下翻飞。
  emit(c, hotColor(0.45), burst(q, t, uSeed, 14.0, 600.0, 0.32, 200.0, -1.35, 1.1));
  leafBurst(c, q, t, uSeed + 0.53, 10.0, 560.0, 0.85, 240.0, -1.55, 1.5);
  leafBurst(c, q, t, uSeed + 0.19, 4.0, 260.0, 0.7, 180.0, 1.6, 1.4);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.25 * smoothstep(-0.38, -0.15, t) * (1.0 - smoothstep(0.1, 0.5, t));
  paint(c, vec3(0.0, 0.03, 0.01), dim * (1.0 - smoothstep(110.0, 280.0, length(q))));

  drawGather(c, q, t);
  drawScar(c, q, t);
  drawWhip(c, q, t);
  drawImpact(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
