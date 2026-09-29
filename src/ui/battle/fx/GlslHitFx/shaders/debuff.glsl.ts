/**
 * 减益 · 咒印压制：紫色咒环在目标头顶旋转收紧 → 爆点咒环坠落扣下、暗紫内爆 →
 * 「﹀」压纹接连向下压，暗雾缠绕目标后沉降消散。
 * 与增益互为镜像：增益向上、发金光；减益向下、以暗色吞光为主，只在边缘发紫光。
 */
export const GLSL_HIT_DEBUFF = /* glsl */ `
#define CURSE_CHEVRONS 3
#define CURSE_DARK vec3(0.07, 0.02, 0.11)

/** 咒环：外实线 + 内圈旋转短划，r 为半径。 */
float curseRing(vec2 p, float r, float spin) {
  float len = length(p * vec2(1.0, 1.9));
  float outer = abs(len - r) - 1.4;
  float ang = atan(p.y * 1.9, p.x) + spin;
  float dash = step(0.5, fract(ang / (2.0 * PI) * 12.0));
  float inner = abs(len - r * 0.76) - 1.0;
  return (fillAA(outer) + 0.55 * glowOf(outer, 5.0)) + fillAA(inner) * dash + 0.2 * glowOf(inner, 3.0);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);
  float life = uTotal - uImpact;

  // 咒环：预兆段悬在头顶旋转收紧，爆点前 0.06s 猛地坠到目标中心。
  float pre = smoothstep(-0.24, -0.06, t);
  float drop = easeOut3((t + 0.06) / 0.08);
  float ringY = mix(78.0, 0.0, drop);
  float ringR = mix(96.0, 62.0, pre) * mix(1.0, 0.7, drop);
  float ringFade = t < 0.0 ? smoothstep(-0.24, -0.16, t) : 1.0 - smoothstep(0.05, 0.3, t);
  float ring = curseRing(q - vec2(0.0, ringY), ringR, uPhase * 5.0);
  emit(c, uColor, ring * ringFade * 0.9);

  if (t > 0.0) {
    float fade = 1.0 - smoothstep(life * 0.45, life, t);

    // 内爆：先一圈亮紫边向内收，再留下暗色核心。
    float kIn = clamp(t / 0.16, 0.0, 1.0);
    float dIn = abs(length(q) - mix(70.0, 6.0, easeOut3(kIn))) - mix(3.0, 1.0, kIn);
    emit(c, hotColor(0.3), (fillAA(dIn) + 0.6 * glowOf(dIn, 6.0)) * (1.0 - kIn));

    // 暗雾：fbm 团缠在目标周围并缓慢下沉。
    vec2 m = q + vec2(0.0, 22.0 * t);
    float n = fbm(m * 0.035 + vec2(uPhase * 0.6, 0.0) + uSeed * 9.0);
    float radius = 24.0 + 70.0 * easeOut3(t / 0.3);
    float cloud = smoothstep(0.0, 0.45, 1.0 - length(m * vec2(1.0, 1.2)) / radius + (n - 0.5) * 0.9);
    paint(c, CURSE_DARK, cloud * 0.62 * fade);
    float edge = cloud * (1.0 - cloud) * 4.0;
    emit(c, uColor * 0.8, edge * 0.28 * fade);

    // 压纹：三道「﹀」自头顶依次压下，越低越宽越淡。
    for (int i = 0; i < CURSE_CHEVRONS; i++) {
      float fi = float(i);
      float age = (t - fi * 0.08) / 0.42;
      if (age <= 0.0 || age >= 1.0) continue;
      float y = mix(70.0, -80.0, easeOut3(age));
      float w = mix(24.0, 44.0, age);
      vec2 p = q - vec2(0.0, y);
      float d = min(sdSegment(p, vec2(-w, w * 0.5), vec2(0.0, 0.0)), sdSegment(p, vec2(w, w * 0.5), vec2(0.0, 0.0)));
      d -= mix(2.4, 0.9, age);
      emit(c, hotColor(0.2), (fillAA(d) + 0.5 * glowOf(d, 5.0)) * (1.0 - age));
    }

    // 沉降碎屑：紫色碎光向下散落。
    emit(c, uColor, burst(q, t, uSeed, 9.0, 160.0, life * 0.8, 140.0, -PI * 0.85, PI * 0.7) * 0.6);
  }

  gl_FragColor = finalize(c * hitEndFade());
}
`;
