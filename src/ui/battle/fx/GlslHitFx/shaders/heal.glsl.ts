/**
 * 治疗 · 生命光泉：翠绿光点自四周螺旋汇入 → 爆点柔光绽开、脚下光环扩散 →
 * 一道自下而上的光柱涌起，十字光粒错时上浮、闪烁后消散。
 * 通篇只用柔光与缓动，不做冲击感(辅助系不震屏、不闪白)。
 */
export const GLSL_HIT_HEAL = /* glsl */ `
#define HEAL_MOTES 8
#define HEAL_CROSSES 9

float sdCross(vec2 p, float len, float w) {
  return min(sdBox(p, vec2(len, w)), sdBox(p, vec2(w, len)));
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 汇聚：光点沿螺线吸向中心，越近越亮。
  if (t < 0.0) {
    float k = smoothstep(-0.26, 0.0, t);
    for (int i = 0; i < HEAL_MOTES; i++) {
      float fi = float(i);
      float a = fi * (2.0 * PI / float(HEAL_MOTES)) + uSeed * 6.0 + k * 2.2;
      vec2 pos = vec2(cos(a), sin(a) * 0.85) * 96.0 * pow(1.0 - k, 1.3);
      float d = length(q - pos) - 2.2 - 1.6 * k;
      emit(c, hotColor(0.45), (fillAA(d) + 0.7 * glowOf(d, 4.5)) * (0.35 + 0.65 * k));
    }
    emit(c, uColor, glowOf(length(q) - 2.0, 4.0 + 16.0 * k) * 0.5 * k);
  }

  if (t > 0.0) {
    float life = uTotal - uImpact;
    float fade = 1.0 - smoothstep(life * 0.45, life, t);

    // 绽开：核心柔光迅速亮起再缓缓收回。
    emit(c, hotColor(0.55), exp(-t * 7.0) * glowOf(length(q) - 6.0, 30.0) * 0.9);

    // 光环：略扁的椭圆(贴合「站在地面上」的视角)向外扩散变细。
    float kr = easeOut3(t / 0.55);
    float dRing = abs(length(q * vec2(1.0, 1.6) + vec2(0.0, 26.0)) - (14.0 + 100.0 * kr)) - mix(3.0, 0.6, kr);
    emit(c, uColor, (fillAA(dRing) + 0.6 * glowOf(dRing, 6.0)) * (1.0 - kr) * 0.9);

    // 光柱：宽度随时间收窄，内部 fbm 条纹持续上涌。
    float colW = mix(46.0, 20.0, easeOut3(t / 0.6));
    float stream = fbm(vec2(q.x * 0.06, q.y * 0.02 - uPhase * 2.6) + uSeed * 5.0);
    float colX = exp(-q.x * q.x / (colW * colW));
    float colY = smoothstep(-90.0, -30.0, q.y) * riseFade(q.y + 40.0, uSize.y * 0.62);
    float rise = smoothstep(0.0, 0.1, t);
    float column = colX * colY * rise * (0.45 + 0.8 * stream);
    paint(c, uColor * 0.55, column * 0.28 * fade);
    emit(c, hotColor(0.35), column * 0.42 * fade);

    // 十字光粒：错时生成，边上浮边轻微左右摆动，先放大后缩小淡出。
    for (int i = 0; i < HEAL_CROSSES; i++) {
      float fi = float(i);
      float h1 = hash11(fi * 3.1 + uSeed * 13.0);
      float h2 = hash11(fi * 8.7 + uSeed * 29.0);
      float born = 0.02 + 0.32 * h1;
      float age = (t - born) / (0.42 + 0.2 * h2);
      if (age <= 0.0 || age >= 1.0) continue;
      vec2 p = vec2((h2 - 0.5) * 130.0 + sin(age * 5.0 + fi) * 6.0, -50.0 + 40.0 * h1 + 120.0 * age);
      float size = (4.0 + 4.0 * h2) * sin(age * PI);
      float d = sdCross(q - p, size, size * 0.3);
      float a = sin(age * PI);
      emit(c, hotColor(0.6), (fillAA(d) + 0.55 * glowOf(d, 3.5)) * a);
    }
  }

  gl_FragColor = finalize(c * hitEndFade());
}
`;
