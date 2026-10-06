import { GLSL_TORMENT_LAYERS } from "./tormentLayers.glsl";

/**
 * 痛楚 · 噬魂鬼火：怨雾旋拢、怨魂鬼火螺旋旋入 → 爆点痛刺向外扎出、冲击环炸开、
 * 紫焰自目标身上窜起、痛脉爬满全身 → 第二下抽痛再亮一次，鬼火上飘烧尽。
 * 与减益(咒环自上压下)区分：本特效以「向内汇聚 → 由内向外爆发 → 向上燃尽」为主。
 */
export const GLSL_HIT_TORMENT = GLSL_TORMENT_LAYERS + /* glsl */ `
/** 第二下抽痛的时刻(爆点后秒数)。 */
#define TORMENT_ECHO 0.36

/** 由内向外扩散的冲击环，dur 秒内扩到 maxR。 */
float tormentShock(float r, float age, float maxR, float dur) {
  if (age <= 0.0 || age >= dur) return 0.0;
  float k = age / dur;
  float d = abs(r - mix(18.0, maxR, easeOut3(k))) - mix(5.0, 0.6, k);
  return (fillAA(d) + 0.6 * glowOf(d, 8.0)) * (1.0 - smoothstep(0.3, 1.0, k));
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  float age = max(t, 0.0);
  float life = uTotal - uImpact;
  float r = length(q);
  vec4 c = vec4(0.0);

  float throb = 0.35 + tormentBeat(age, 0.0, 0.07) * 0.9 + tormentBeat(age, TORMENT_ECHO, 0.08) * 0.75;
  float fade = step(0.0, t) * (1.0 - smoothstep(life * 0.5, life, age));

  tormentMiasma(c, q, t, age, life);
  tormentFlames(c, q, age, life);
  tormentVeins(c, q, age, throb, fade);
  tormentWisps(c, q, t);

  // 蓄势：核心随怨魂汇入逐渐变亮、急促闪烁。
  if (t < 0.0) {
    float pre = smoothstep(-uImpact, 0.0, t);
    float flicker = 0.75 + 0.25 * sin(uPhase * 80.0);
    emit(c, hotColor(0.5), glowOf(r - 2.0, 4.0 + 14.0 * pre) * pre * pre * flicker);
  }

  tormentNeedles(c, q, age);

  if (t > 0.0) {
    // 爆点白闪 + 主冲击环；第二下抽痛补一圈较弱的回响环。
    emit(c, hotColor(0.85), glowOf(r - 6.0, 34.0) * exp(-age * 16.0) * 1.2);
    emit(c, uColor, tormentShock(r, age, 200.0, 0.32));
    emit(c, uColor * 0.8, tormentShock(r, age - TORMENT_ECHO, 140.0, 0.26) * 0.7);
    // 伤口余光随抽痛起伏。
    emit(c, uColor, glowOf(r - 4.0, 16.0) * throb * fade * 0.6);
  }

  // 魂屑：爆点与第二下抽痛各迸出一簇，向上飘散。
  emit(c, hotColor(0.35), burst(q, age, uSeed, 14.0, 280.0, 0.75, -170.0, 0.0, 2.0 * PI));
  emit(c, uColor, burst(q, age - TORMENT_ECHO, uSeed + 0.37, 10.0, 200.0, 0.5, -150.0, 0.0, 2.0 * PI) * 0.8);

  // 画布边缘软裁切，冲击环与痛刺越界时不出现硬边。
  vec2 room = uSize * 0.5 - abs(q);
  float edge = smoothstep(0.0, 36.0, min(room.x, room.y));
  gl_FragColor = finalize(c * hitEndFade() * edge);
}
`;
