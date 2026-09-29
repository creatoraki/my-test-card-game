/**
 * 重击 · 冲击震波：爆点前一圈能量向内收缩成白点(蓄力) →
 * 径向白闪 + 两道扁椭圆冲击环扩散 + 放射裂纹光 + 碎屑下落。
 */
export const GLSL_HIT_SMASH = /* glsl */ `
#define CRACKS 7

float shockRing(vec2 q, float t, float reach, float width, float life) {
  if (t <= 0.0 || t >= life) return 0.0;
  float k = t / life;
  vec2 e = q / vec2(1.0, 0.55);
  float radius = 10.0 + reach * easeOut3(k * 1.3);
  float d = abs(length(e) - radius) - mix(width, 0.8, k);
  return (fillAA(d) + 0.6 * glowOf(d, 6.0)) * (1.0 - k);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 蓄力：能量圈向内收紧，核心越来越亮。
  if (t < 0.0) {
    float k = smoothstep(-0.14, 0.0, t);
    float radius = mix(70.0, 6.0, k * k);
    float d = abs(length(q) - radius) - 1.5;
    emit(c, uColor, (fillAA(d) + 0.5 * glowOf(d, 5.0)) * k);
    emit(c, hotColor(0.8), glowOf(length(q) - 2.0, 4.0 + 8.0 * k) * k);
  }

  // 爆点闪光。
  float flash = t > 0.0 ? exp(-t * 14.0) : 0.0;
  emit(c, hotColor(0.7), flash * glowOf(length(q) - 6.0, 30.0) * 1.2);

  // 冲击环。
  emit(c, hotColor(0.35), shockRing(q, t, 150.0, 6.0, 0.42));
  emit(c, uColor, shockRing(q, t - 0.06, 105.0, 3.0, 0.36) * 0.8);

  // 放射裂纹：从中心迅速伸长的锯齿光线。
  if (t > 0.0) {
    float grow = easeOut3(t / 0.08);
    float fade = 1.0 - smoothstep(0.10, 0.40, t);
    for (int i = 0; i < CRACKS; i++) {
      float fi = float(i);
      float len = 60.0 + 55.0 * hash11(fi * 3.1 + uSeed * 13.0);
      float a = fi * (2.0 * PI / float(CRACKS)) + (hash11(fi + uSeed * 29.0) - 0.5) * 0.6;
      vec2 r = rot(q * vec2(1.0, 1.25), -a);
      if (r.x < 0.0 || r.x > len * grow) continue;
      float along = r.x / len;
      float wob = (vnoise(vec2(r.x * 0.09, fi * 9.1 + uSeed * 20.0)) - 0.5) * 16.0 * along;
      float d = abs(r.y - wob) - 1.8 * (1.0 - along);
      emit(c, hotColor(0.5), (fillAA(d) + 0.5 * glowOf(d, 4.0)) * fade * (1.0 - along * 0.6));
    }
  }

  // 碎屑：全向迸出后下坠。
  emit(c, hotColor(0.25), burst(q, t, uSeed, 12.0, 380.0, 0.48, 420.0, 0.0, 2.0 * PI));

  gl_FragColor = finalize(c * hitEndFade());
}
`;
