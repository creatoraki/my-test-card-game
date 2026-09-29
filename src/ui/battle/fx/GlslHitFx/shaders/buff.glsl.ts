/**
 * 增益 · 金辉升腾：脚下金色刻度法阵沿圆周画满 → 爆点法阵一亮、中心四芒星闪现 →
 * 上扬的「︿」光纹与细光线自法阵升起，金尘缓缓上飘。
 * 与治疗同属辅助系：柔光、上升、无冲击；以「向上的箭纹」区别于治疗的「十字」。
 */
export const GLSL_HIT_BUFF = /* glsl */ `
#define BUFF_CHEVRONS 3
#define BUFF_STREAKS 7
#define GROUND vec2(0.0, -58.0)
#define GROUND_R vec2(82.0, 22.0)

/** 地面刻度法阵：沿圆周按 reveal 画出，外圈连续、内圈为刻度短划。 */
float groundSigil(vec2 q, float reveal) {
  vec2 p = q - GROUND;
  float ang = atan(p.y / GROUND_R.y, p.x / GROUND_R.x);
  float along = fract((ang + PI * 0.5) / (2.0 * PI) + uSeed);
  float shown = smoothstep(reveal + 0.02, reveal - 0.02, along);
  float outer = abs(sdEllipse(p, GROUND_R)) - 1.2;
  float inner = abs(sdEllipse(p, GROUND_R * 0.78)) - 0.9;
  float ticks = step(0.55, fract(along * 24.0));
  return ((fillAA(outer) + 0.5 * glowOf(outer, 4.0)) + (fillAA(inner) * ticks + 0.25 * glowOf(inner, 3.0))) * shown;
}

/** 四芒星：一横一竖两道细长椭圆。 */
float sparkle(vec2 p, float r) {
  float d = min(sdEllipse(p, vec2(r, r * 0.12)), sdEllipse(p, vec2(r * 0.12, r)));
  return fillAA(d) + 0.6 * glowOf(d, r * 0.18);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);
  float life = uTotal - uImpact;

  // 法阵：预兆段画满一圈，爆点后停留并淡出。
  // 多画 5%：让终点的抗锯齿过渡越过接缝，画满后不留缺口。
  float reveal = easeOut3((t + 0.22) / 0.22) * 1.05;
  float sigilFade = t < 0.0 ? 1.0 : 1.0 - smoothstep(life * 0.4, life * 0.9, t);
  float flash = t > 0.0 ? exp(-t * 9.0) : 0.0;
  emit(c, uColor, groundSigil(q, reveal) * (0.55 + 0.9 * flash) * sigilFade);

  if (t > 0.0) {
    float fade = 1.0 - smoothstep(life * 0.5, life, t);

    // 核心四芒星：爆点瞬间最大，随后缩小并缓慢旋转。
    float sr = 38.0 * exp(-t * 5.0);
    if (sr > 1.0) emit(c, hotColor(0.7), sparkle(rot(q - vec2(0.0, 6.0), t * 1.5), sr));
    emit(c, hotColor(0.5), glowOf(length(q) - 4.0, 26.0) * exp(-t * 8.0) * 0.8);

    // 升腾光纹：三道「︿」错时自法阵升起，越高越细越淡。
    for (int i = 0; i < BUFF_CHEVRONS; i++) {
      float fi = float(i);
      float age = (t - fi * 0.09) / 0.5;
      if (age <= 0.0 || age >= 1.0) continue;
      float y = GROUND.y + 170.0 * easeOut3(age);
      float w = mix(40.0, 26.0, age);
      vec2 p = q - vec2(0.0, y);
      float d = min(sdSegment(p, vec2(-w, -w * 0.55), vec2(0.0, 0.0)), sdSegment(p, vec2(w, -w * 0.55), vec2(0.0, 0.0)));
      d -= mix(2.2, 0.8, age);
      emit(c, hotColor(0.35), (fillAA(d) + 0.6 * glowOf(d, 5.0)) * (1.0 - age));
    }

    // 细光线：从法阵边缘竖直上冲的短光束。
    for (int i = 0; i < BUFF_STREAKS; i++) {
      float fi = float(i);
      float h1 = hash11(fi * 5.1 + uSeed * 19.0);
      float h2 = hash11(fi * 2.3 + uSeed * 7.0);
      float age = (t - 0.03 * fi) / (0.35 + 0.2 * h2);
      if (age <= 0.0 || age >= 1.0) continue;
      float x = (h1 - 0.5) * 2.0 * GROUND_R.x * 0.9;
      float y0 = GROUND.y + 150.0 * easeOut3(age);
      float len = 26.0 + 20.0 * h2;
      float d = sdSegment(q, vec2(x, y0 - len), vec2(x, y0)) - 0.9;
      emit(c, hotColor(0.5), (fillAA(d) + 0.45 * glowOf(d, 3.0)) * (1.0 - age) * 0.9);
    }

    // 金尘：缓慢上飘。
    emit(c, hotColor(0.4), burst(q - GROUND * 0.4, t, uSeed, 10.0, 150.0, life * 0.9, -90.0, PI * 0.15, PI * 0.7) * 0.7 * fade);
  }

  gl_FragColor = finalize(c * hitEndFade());
}
`;
