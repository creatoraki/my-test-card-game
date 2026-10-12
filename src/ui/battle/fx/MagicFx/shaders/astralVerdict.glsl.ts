/**
 * 预言家 · 星盘裁决。以爆点为零点(t = hitTime()):
 *   展盘  [-0.70, -0.45] 星盘按角度扫出: 外环刻度 + 宝石点环 + 六芒星 + 星座连线, 从 1.25 倍缩到原大;
 *   蓄势  [-0.45, -0.10] 星盘加速旋转、逐渐增亮, 外环外侧有 3 颗符文星绕行;
 *   坍缩  [-0.10, 0]     星盘急缩到中心, 同时天光柱自上方劈落;
 *   爆点  0              白闪 + 六芒星冲击波 + 光柱爆宽 + 上飘星火;
 *   余波  → 1.40         光柱收细消散, 两道涟漪外扩, 末尾整体淡出。
 */
export const GLSL_ASTRAL_VERDICT = /* glsl */ `
/** 星座: 6 颗星依次连线(星盘局部坐标)。 */
vec2 constStar(int i) {
  if (i == 0) return vec2(-62.0, 28.0);
  if (i == 1) return vec2(-30.0, 52.0);
  if (i == 2) return vec2(6.0, 30.0);
  if (i == 3) return vec2(40.0, 46.0);
  if (i == 4) return vec2(30.0, -20.0);
  return vec2(-18.0, -48.0);
}

void drawDisk(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.7, -0.62, -0.03, 0.02);
  if (k <= 0.0) return;
  float tau = t + 0.7;
  float scale = mix(1.25, 1.0, easeOut3(prog(t, -0.7, -0.45))) * mix(1.0, 0.12, pow(prog(t, -0.1, 0.0), 1.6));
  float spin = 0.5 * tau + 3.2 * tau * tau;
  float glow = 0.45 + 0.55 * prog(t, -0.45, -0.02);
  vec2 p = rot(q, -spin) / scale;
  float r = length(p);
  float aa = 1.0 / scale;
  // 按角度扫出: 展盘阶段只显示已扫过的扇区。
  float reveal = prog(t, -0.7, -0.48);
  float sweep = fract((atan(p.y, p.x) + PI) / (2.0 * PI));
  float shown = 1.0 - smoothstep(reveal - 0.02, reveal, sweep);
  shown = max(shown, step(1.0, reveal));
  float m = k * shown;
  if (m <= 0.0) return;

  // 外环双线 + 36 道刻度。
  float dOuter = min(abs(r - 150.0), abs(r - 138.0)) - 0.8 * aa;
  float a = atan(p.y, p.x);
  float cell = abs(fract((a + PI) / (2.0 * PI) * 36.0) - 0.5) * (2.0 * PI * 144.0 / 36.0);
  float major = 1.0 - step(0.5, mod(floor((a + PI) / (2.0 * PI) * 36.0), 3.0));
  float dTick = max(abs(r - 144.0) - (3.0 + 2.0 * major), cell - 0.9 * aa);
  float dLines = min(dOuter, dTick);
  emit(c, hotColor(0.5), fillAA(dLines * scale) * m * glow);
  emit(c, uColor, glowOf(max(dLines, 0.0), 5.0) * m * glow * 0.5);

  // 内环 + 12 颗宝石点。
  float dInner = abs(r - 116.0) - 0.7 * aa;
  float a12 = (floor((a + PI) / (2.0 * PI) * 12.0) + 0.5) * (2.0 * PI / 12.0) - PI;
  float dGem = length(p - 116.0 * vec2(cos(a12), sin(a12))) - 3.6;
  emit(c, uColor, fillAA(dInner * scale) * m * glow * 0.8);
  emit(c, hotColor(0.8), (fillAA(dGem * scale) + 0.5 * glowOf(max(dGem, 0.0), 4.0)) * m * glow);

  // 六芒星: 反向旋转。
  vec2 ph = rot(p, spin * 2.0 + 0.3);
  float dHex = abs(sdHexagram(ph, 58.0)) - 0.9 * aa;
  emit(c, hotColor(0.3), (fillAA(dHex * scale) + 0.4 * glowOf(max(dHex, 0.0), 4.0)) * m * glow);

  // 星座连线 + 星点闪烁。
  float dCon = 1e5;
  float stars = 0.0;
  for (int i = 0; i < 6; i++) {
    vec2 sp = constStar(i);
    float tw = 0.6 + 0.4 * sin(uPhase * 18.0 + float(i) * 1.9);
    stars += twinkle(p - sp, 9.0) * tw;
    if (i < 5) dCon = min(dCon, sdSegment(p, sp, constStar(i + 1)));
  }
  dCon -= 0.5 * aa;
  emit(c, uColor, fillAA(dCon * scale) * m * glow * 0.7);
  emit(c, vec3(1.0), stars * m * glow * 0.8);

  // 符文星绕行: 蓄势段在外环外侧绕三圈。
  float kOrb = window4(t, -0.5, -0.4, -0.12, -0.04);
  if (kOrb > 0.0) {
    for (int i = 0; i < 3; i++) {
      float ang = float(i) * 2.0 * PI / 3.0 + tau * 7.0;
      vec2 pos = vec2(cos(ang), sin(ang)) * 172.0;
      emit(c, hotColor(0.6), twinkle(p - pos, 12.0) * kOrb * k);
    }
  }
}

void drawPillar(inout vec4 c, vec2 q, float t) {
  if (t < -0.08 || t > 0.6) return;
  // 光柱头部自画布上沿劈落到目标中心。
  float bottom = mix(uSize.y * 0.5 + 20.0, 0.0, easeOut3(prog(t, -0.08, 0.0)));
  float after = t > 0.0 ? t : 0.0;
  float w = 10.0 + 26.0 * exp(-after * 9.0) * step(0.0, t);
  float fade = t > 0.0 ? exp(-after * 5.0) : 1.0;
  float cut = smoothstep(bottom - 14.0, bottom + 6.0, q.y);
  float dx = abs(q.x + sin(q.y * 0.04 + uPhase * 30.0) * 1.5);
  float core = fillAA(dx - w * 0.35);
  emit(c, vec3(1.0), core * cut * fade * 1.1);
  emit(c, hotColor(0.4), glowOf(max(dx - w * 0.35, 0.0), w * 0.8) * cut * fade);
  // 柱身里上行的光纹。
  float n = vnoise(vec2(q.x * 0.12, q.y * 0.03 - uPhase * 6.0));
  emit(c, hotColor(0.8), smoothstep(0.65, 0.9, n) * (1.0 - smoothstep(0.0, w * 1.4, dx)) * cut * fade * 0.6);
  // 劈落头部的亮点。
  if (t <= 0.0) emit(c, vec3(1.0), glowOf(length(q - vec2(0.0, bottom)), 12.0) * 1.2);
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 30.0) * exp(-t * 11.0) * 1.4);
  emit(c, uColor, glowOf(r0, 110.0) * exp(-t * 6.0) * 0.55);

  // 六芒星冲击波: 外扩变细。
  float k = prog(t, 0.0, 0.45);
  float dHex = abs(sdHexagram(rot(q, uSeed * 2.0 + t * 1.5), 30.0 + 170.0 * easeOut3(k))) - mix(2.5, 0.4, k);
  emit(c, hotColor(0.55), (fillAA(dHex) + 0.5 * glowOf(max(dHex, 0.0), 7.0)) * (1.0 - k));

  // 两道涟漪: 稍晚、更大、更淡。
  for (int i = 0; i < 2; i++) {
    float lt = t - 0.08 - float(i) * 0.12;
    float kr = prog(lt, 0.0, 0.55);
    if (lt <= 0.0 || kr >= 1.0) continue;
    float dR = abs(r0 - (40.0 + 240.0 * easeOut3(kr))) - 0.8;
    emit(c, uColor, (fillAA(dR) * 0.7 + 0.4 * glowOf(max(dR, 0.0), 6.0)) * (1.0 - kr) * 0.8);
  }

  // 上飘星火。
  float sp = burst(q, t, uSeed, 14.0, 420.0, 0.6, -180.0, PI * 0.15, PI * 0.7)
           + burst(q, t, uSeed + 0.33, 10.0, 300.0, 0.45, 60.0, 0.0, 2.0 * PI) * 0.7;
  emit(c, hotColor(0.75), sp);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.3 * smoothstep(-0.7, -0.35, t) * (1.0 - smoothstep(0.05, 0.45, t));
  paint(c, vec3(0.03, 0.01, 0.08), dim * (1.0 - smoothstep(110.0, 280.0, length(q))));

  drawDisk(c, q, t);
  drawPillar(c, q, t);
  drawImpact(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
