/**
 * 毒素 · 腐蚀毒雾：毒珠向中心聚拢 → 爆点泼溅成团(metaball 滴溅向外甩开) →
 * 翻涌毒雾扩散，气泡上浮后破裂。
 */
export const GLSL_HIT_POISON = /* glsl */ `
#define SPLASH_BLOBS 7
#define BUBBLES 9

vec3 toxicTint(float n) {
  return mix(uColor * 0.5, vec3(0.30, 0.16, 0.38), 0.35 + 0.3 * n);
}

float splashField(vec2 q, float t) {
  float g = easeOut3(t / 0.25);
  float core = 30.0 * (1.0 - 0.55 * g) * (1.0 - smoothstep(0.2, 0.45, t));
  float f = core * core / (dot(q, q) + 1.0);
  for (int i = 0; i < SPLASH_BLOBS; i++) {
    float fi = float(i);
    float h = hash11(fi * 4.3 + uSeed * 17.0);
    float a = fi * (2.0 * PI / float(SPLASH_BLOBS)) + (h - 0.5) * 0.8;
    vec2 p = vec2(cos(a), sin(a) * 0.8) * (40.0 + 50.0 * h) * g - vec2(0.0, 30.0 * t * t);
    float r = (8.0 + 7.0 * h) * (1.0 - smoothstep(0.15, 0.48, t));
    vec2 d = q - p;
    f += r * r / (dot(d, d) + 1.0);
  }
  return f;
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 聚拢：毒珠自四周吸向中心。
  if (t < 0.0) {
    float k = smoothstep(-0.20, 0.0, t);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float a = fi * (PI / 3.0) + uSeed * 6.0;
      vec2 pos = vec2(cos(a), sin(a)) * 90.0 * pow(1.0 - k, 1.2);
      float d = length(q - pos) - 3.0 - 3.0 * k;
      paint(c, uColor * 0.8, fillAA(d) * k);
      emit(c, uColor, glowOf(d, 5.0) * 0.4 * k);
    }
  }

  if (t > 0.0) {
    float life = uTotal - uImpact;
    // 毒雾：fbm 云团扩散并缓慢上浮。
    vec2 m = q - vec2(0.0, 26.0 * t);
    float n = fbm(m * 0.03 + vec2(0.0, -uPhase * 0.8) + uSeed * 7.0);
    float radius = 30.0 + 85.0 * easeOut3(t / 0.4);
    float cloud = smoothstep(0.0, 0.5, 1.0 - length(m * vec2(1.0, 1.25)) / radius + (n - 0.5) * 0.9);
    paint(c, toxicTint(n), cloud * 0.55 * (1.0 - smoothstep(0.2, life, t)));
    emit(c, uColor, cloud * 0.18 * (1.0 - smoothstep(0.1, life, t)));

    // 泼溅：metaball 毒液团，亮边 + 暗芯。
    float f = splashField(q, t);
    float body = smoothstep(0.9, 1.05, f);
    float rim = body * (1.0 - smoothstep(1.05, 1.8, f));
    paint(c, uColor * 0.45, body * 0.9);
    emit(c, hotColor(0.35), rim * 0.9);

    // 气泡：错时生成、上浮、末尾破裂成一圈。
    for (int i = 0; i < BUBBLES; i++) {
      float fi = float(i);
      float h1 = hash11(fi * 2.9 + uSeed * 11.0);
      float h2 = hash11(fi * 6.1 + uSeed * 23.0);
      float born = 0.05 + 0.28 * h1;
      float age = (t - born) / 0.24;
      if (age <= 0.0 || age >= 1.0) continue;
      vec2 p = vec2((h2 - 0.5) * 100.0, (h1 - 0.5) * 40.0 + 60.0 * age);
      float popping = smoothstep(0.75, 1.0, age);
      float r = (3.0 + 4.0 * h2) * (1.0 + 1.2 * popping);
      float d = abs(length(q - p) - r) - 0.9;
      emit(c, hotColor(0.3), (fillAA(d) + 0.4 * glowOf(d, 2.5)) * (1.0 - popping));
    }
  }

  gl_FragColor = finalize(c * hitEndFade());
}
`;
