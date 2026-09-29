/**
 * 火焰 · 爆燃火团：火星向中心旋聚点燃 → fbm 火球膨胀、边缘火舌上卷，
 * 白黄核 → 主色 → 暗红，随后自外向内烧尽，余烬上飘。
 */
export const GLSL_HIT_FIRE = /* glsl */ `
vec3 fireRamp(float heat) {
  vec3 dark = uColor * vec3(0.55, 0.22, 0.12);
  vec3 hot = vec3(1.0, 0.96, 0.78);
  return heat < 0.5 ? mix(dark, uColor, heat * 2.0) : mix(uColor, hot, (heat - 0.5) * 2.0);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 点燃：火星旋聚，核心闪烁变亮。
  if (t < 0.0) {
    float k = smoothstep(-0.18, 0.0, t);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float a = fi * (PI / 3.0) + uSeed * 6.0 + k * 2.4;
      vec2 pos = vec2(cos(a), sin(a)) * 80.0 * (1.0 - k);
      float d = length(q - pos) - 2.6;
      emit(c, hotColor(0.4), (fillAA(d) + 0.6 * glowOf(d, 4.0)) * k);
    }
    float flicker = 0.8 + 0.2 * sin(uPhase * 90.0);
    emit(c, hotColor(0.7), glowOf(length(q) - 2.0, 3.0 + 10.0 * k) * k * flicker);
  }

  if (t > 0.0) {
    float life = uTotal - uImpact;
    float burn = clamp(t / life, 0.0, 1.0);
    float grow = easeOut3(t / 0.22);
    float radius = 18.0 + 72.0 * grow;
    vec2 qq = q - vec2(0.0, 18.0 * grow + 40.0 * t);
    vec2 e = qq / vec2(radius, radius * 1.2);
    float n = fbm(vec2(q.x * 0.028, q.y * 0.028 - uPhase * 3.2) + uSeed * 11.0);
    float n2 = fbm(q * 0.06 - vec2(0.0, uPhase * 5.0) + uSeed * 3.0);
    float shape = 1.0 - length(e) + (n - 0.5) * 1.1 + (n2 - 0.5) * 0.35;
    // 上半部让噪声更多地抬高轮廓，拉出上卷的火舌。
    shape += max(qq.y, 0.0) / radius * 0.35 * (n - 0.35);
    shape -= burn * burn * 1.6;
    float dens = smoothstep(0.0, 0.3, shape);
    float heat = clamp(shape * 1.6 + 0.35 - burn * 0.7, 0.0, 1.0);
    emit(c, uColor, glowOf(-shape * radius, 16.0) * 0.4 * (1.0 - burn));
    paint(c, fireRamp(heat), dens * 0.94);
    emit(c, hotColor(0.75), exp(-t * 12.0) * glowOf(length(q) - 4.0, 26.0));
  }

  // 余烬：全向迸出后上飘。
  emit(c, hotColor(0.3), burst(q, t, uSeed, 12.0, 260.0, 0.55, -150.0, 0.0, 2.0 * PI));

  gl_FragColor = finalize(c * hitEndFade());
}
`;
