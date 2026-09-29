/**
 * 斩击 · 裂爪斩痕：三道平行弧形斩痕依次扫过(白芯 + 主色辉光、两端锥形)，
 * 第三道收刀即爆点 → 斩痕发亮一瞬、向两侧迸出光屑，随后变细淡出。
 * 方向按种子随机左右镜像。
 */
export const GLSL_HIT_SLASH = /* glsl */ `
#define SLASH_LEN 200.0
#define SLASH_GAP 30.0
#define SLASH_SWEEP 0.07

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  q.x *= uSeed < 0.5 ? 1.0 : -1.0;
  float ang = radians(-36.0) + (hash11(uSeed * 17.0) - 0.5) * 0.3;
  vec4 c = vec4(0.0);

  float flash = t > 0.0 ? exp(-t * 16.0) : 0.0;
  float thin = mix(1.0, 0.15, smoothstep(0.06, 0.34, t));
  float fade = 1.0 - smoothstep(0.12, 0.40, t);
  vec2 r0 = rot(q, -ang);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float start = -0.15 + fi * 0.05;
    float raw = (uPhase - uImpact - start) / SLASH_SWEEP;
    if (raw <= 0.0) continue;
    float head = easeOut3(raw);
    vec2 r = r0;
    r.y -= (fi - 1.0) * SLASH_GAP + (hash11(fi + uSeed * 5.0) - 0.5) * 8.0;
    // 中段外凸成弧：越往两端越向下弯。
    r.y += 0.0018 * r.x * r.x - 9.0;
    float u = r.x / SLASH_LEN + 0.5;
    if (u < 0.0 || u > head + 0.03) continue;
    float body = pow(max(sin(PI * clamp(u, 0.0, 1.0)), 0.0), 0.7);
    float width = (6.0 - fi * 0.8) * body * thin * (1.0 + 0.5 * flash);
    float d = abs(r.y) - width;
    float cut = 1.0 - smoothstep(head - 0.01, head + 0.03, u);
    float headHot = exp(-abs(u - head) * SLASH_LEN / 14.0) * (1.0 - clamp(raw - 1.0, 0.0, 1.0));
    float k = cut * fade;
    emit(c, uColor, glowOf(d, 9.0) * 0.55 * k);
    emit(c, hotColor(0.6), headHot * glowOf(d, 6.0) * 0.8 * k);
    paint(c, hotColor(0.85), fillAA(d) * k);
  }

  // 爆点：中心闪光 + 沿斩痕法线两侧迸出的光屑。
  float nAng = ang + PI * 0.5;
  emit(c, hotColor(0.5), flash * glowOf(length(q) - 4.0, 22.0) * 0.9);
  float sparks = burst(q, t, uSeed, 8.0, 420.0, 0.34, 160.0, nAng - 0.55, 1.1)
    + burst(q, t, uSeed + 0.37, 8.0, 420.0, 0.34, 160.0, nAng + PI - 0.55, 1.1);
  emit(c, hotColor(0.45), sparks);

  gl_FragColor = finalize(c * hitEndFade());
}
`;
