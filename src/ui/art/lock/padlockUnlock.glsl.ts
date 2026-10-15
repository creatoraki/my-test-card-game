/**
 * 锁头开锁演出的时间轴与特效(秒，uPhase 从演出挂载起算，总长 1.4s，与 TownScreen/buildingReveal.ts 对齐)：
 *   0.00–0.45  锁孔亮起，整把锁的光色由警示红转成据点青
 *   0.35–0.62  锁梁带过冲弹起
 *   0.70–1.30  锁头按方块碎散(先亮后消失)，火花外溅、冲击环外扩，刻度环外扩淡出
 */
export const GLSL_PADLOCK_UNLOCK = /* glsl */ `
#define UNLOCK_BURST_AT 0.7
#define UNLOCK_BURST_LEN 0.6

/** 光色转青的进度。 */
float unlockTint(float t) {
  return uUnlock * smoothstep(0.0, 0.45, t);
}

/** 锁梁弹起高度(px)，带一点过冲。 */
float unlockPop(float t) {
  float k = clamp((t - 0.35) / 0.27, 0.0, 1.0);
  float s = k - 1.0;
  float back = 1.0 + 2.7 * s * s * s + 1.7 * s * s;
  return uUnlock * back * 16.0;
}

/** 碎散进度 0→1。 */
float unlockBurst(float t) {
  return uUnlock * clamp((t - UNLOCK_BURST_AT) / UNLOCK_BURST_LEN, 0.0, 1.0);
}

/** 方块碎片：x = 已消失(0/1)，y = 即将消失的亮度。每块 11px，阈值按块随机并偏向外圈先碎。 */
vec2 shardState(vec2 p, float burst) {
  vec2 cell = floor(p / 11.0);
  float h = hash21(cell + uSeed * 17.0) * 0.75 + 0.25 * (1.0 - clamp(length(p) / 60.0, 0.0, 1.0));
  float edge = burst * 1.2;
  return vec2(step(h, edge - 0.08), smoothstep(edge + 0.18, edge, h));
}

/** 火花外溅 + 冲击环。 */
void drawUnlockBurst(inout vec4 c, vec2 p, vec3 col, float burst) {
  if (burst <= 0.0 || burst >= 1.0) return;
  float fade = 1.0 - burst;
  float r = length(p);
  emit(c, col, 0.8 * fade * fade * fillAA(abs(r - (36.0 + burst * 70.0)) - 2.5 * fade - 0.6));
  emit(c, col, 0.45 * fade * exp(-r * r / (900.0 + burst * 2600.0)));
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    float a = (fi + hash21(vec2(fi, uSeed)) * 0.8) / 18.0 * 2.0 * PI;
    float reach = 50.0 + hash21(vec2(uSeed, fi)) * 50.0;
    vec2 pos = vec2(cos(a), sin(a)) * reach * sqrt(burst) - vec2(0.0, 22.0 * burst * burst);
    vec2 d = abs(p - pos) - vec2(3.2 * fade + 0.6);
    emit(c, col, 0.9 * fade * fillAA(max(d.x, d.y)));
  }
}
`;
