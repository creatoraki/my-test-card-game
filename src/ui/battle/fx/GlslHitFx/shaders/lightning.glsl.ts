/**
 * 雷电 · 落雷电弧：先导细电弧自上而下探下 → 主电弧劈中(爆点) → 两次换形复闪，
 * 命中点有乱窜的短电弧与一圈闪光环。电弧永远自天而降，不随阵营翻转。
 */
export const GLSL_HIT_LIGHTNING = /* glsl */ `
#define BOLT_TOP (uSize.y * 0.5 + 8.0)

float boltX(float y, float s, float lean) {
  float taper = smoothstep(0.0, 40.0, y);
  float x = (vnoise(vec2(y * 0.045, s)) - 0.5) * 54.0 + (vnoise(vec2(y * 0.15, s + 3.7)) - 0.5) * 16.0;
  return x * taper + y * lean;
}

/** 单次电弧(主干 + 一条分叉)，返回亮度；reveal 为自上而下的显现进度。 */
float bolt(vec2 q, float s, float lean, float reveal) {
  float yMin = mix(BOLT_TOP, 0.0, reveal);
  float acc = 0.0;
  if (q.y > yMin - 2.0 && q.y < BOLT_TOP) {
    float d = abs(q.x - boltX(q.y, s, lean)) * 0.8 - 1.4;
    acc += fillAA(d) * 1.2 + glowOf(d, 7.0) * 0.8;
  }
  float yf = 60.0 + 30.0 * hash11(s);
  if (reveal > 0.6 && q.y < yf + 2.0) {
    vec2 base = vec2(boltX(yf, s, lean), yf);
    float side = hash11(s + 1.3) < 0.5 ? -1.0 : 1.0;
    vec2 r = rot(q - base, -(-PI * 0.5 + side * 0.75));
    float len = 46.0;
    if (r.x > 0.0 && r.x < len) {
      float along = r.x / len;
      float jag = (vnoise(vec2(r.x * 0.12, s + 9.0)) - 0.5) * 12.0 * along;
      float d = abs(r.y - jag) - 0.9 * (1.0 - along);
      acc += (fillAA(d) + 0.5 * glowOf(d, 4.0)) * (1.0 - along * 0.7);
    }
  }
  return acc;
}

/** 在 [t0, t0+dur] 内显示一次电弧，强度 amp。 */
float strike(vec2 q, float t, float t0, float dur, float amp, float s, float lean) {
  if (t < t0 || t > t0 + dur) return 0.0;
  return bolt(q, s, lean, 1.0) * amp * (1.0 - 0.4 * (t - t0) / dur);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);
  float lean = (uSeed - 0.5) * 0.5;
  float s0 = uSeed * 40.0;

  float light = 0.0;
  if (t > -0.12 && t < -0.04) light += bolt(q, s0, lean, clamp((t + 0.12) / 0.06, 0.0, 1.0)) * 0.3;
  light += strike(q, t, 0.0, 0.07, 1.0, s0, lean);
  light += strike(q, t, 0.11, 0.05, 0.8, s0 + 7.0, lean);
  light += strike(q, t, 0.22, 0.04, 0.45, s0 + 13.0, lean);
  emit(c, uColor, light * 0.7);
  emit(c, hotColor(0.85), light * 0.6);

  if (t > 0.0) {
    // 命中点：闪光 + 扩散环 + 每 40ms 换形的乱窜短电弧。
    emit(c, hotColor(0.7), exp(-t * 10.0) * glowOf(length(q) - 4.0, 28.0));
    float k = clamp(t / 0.25, 0.0, 1.0);
    float dRing = abs(length(q) - (10.0 + 80.0 * easeOut3(k))) - mix(2.5, 0.5, k);
    emit(c, uColor, (fillAA(dRing) + 0.5 * glowOf(dRing, 5.0)) * (1.0 - k));

    float frame = floor(uPhase * 25.0);
    float arcFade = 1.0 - smoothstep(0.18, 0.34, t);
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float h = hash11(fi * 3.7 + frame * 1.9 + uSeed * 7.0);
      if (h < 0.35) continue;
      float a = hash11(fi * 5.3 + frame * 0.7 + uSeed) * 2.0 * PI;
      float len = 26.0 + 34.0 * h;
      vec2 r = rot(q, -a);
      if (r.x < 0.0 || r.x > len) continue;
      float along = r.x / len;
      float jag = (vnoise(vec2(r.x * 0.14, fi * 4.0 + frame)) - 0.5) * 14.0 * along;
      float d = abs(r.y - jag) - 0.9 * (1.0 - along);
      emit(c, hotColor(0.6), (fillAA(d) + 0.6 * glowOf(d, 4.0)) * arcFade);
    }
  }

  gl_FragColor = finalize(c * hitEndFade());
}
`;
