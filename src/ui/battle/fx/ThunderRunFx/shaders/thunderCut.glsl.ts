/**
 * 雷走 · 单刀构件(拼在 GLSL_COMMON + GLSL_HIT_COMMON 之后, 主程序之前)。
 * 刀路局部坐标 r: x 沿出刀方向、y 为法向; 刀路是一条浅弧, 斩痕落在 r.y = bend·x² 上。
 *   drawCut      —— 刃光掠过(刀头拖出单侧月牙残影) → 留下斩痕 → 斩痕上缠绕频闪的锯齿电弧;
 *   drawBranches —— 爆点后沿斩痕向两侧乱窜的分叉放电, 每 40ms 换形。
 */
export const GLSL_THUNDER_CUT = /* glsl */ `
#define CUT_LEN 230.0

/** 雷光辉色: 主色往冷紫偏一点, 让大范围光晕不至于一片死蓝。 */
vec3 thunderGlow() {
  return mix(uColor, vec3(0.62, 0.5, 1.0), 0.35);
}

/** 斩痕两端收尖: 中段满强度, 端点归零。 */
float cutTaper(float x) {
  return 1.0 - smoothstep(CUT_LEN * 0.5, CUT_LEN, abs(x));
}

/** 锯齿电弧的法向偏移: 低频大摆 + 高频细碎。 */
float arcJag(float x, float s, float amp) {
  return (vnoise(vec2(x * 0.042, s)) - 0.5) * amp + (vnoise(vec2(x * 0.17, s + 5.1)) - 0.5) * amp * 0.45;
}

/**
 * 一刀。lt = 出刃后秒数(负值不画); dur = 刀头掠过全程的秒数;
 * charge = 爆点/复闪时斩痕与电弧的额外充能(0 为平时); s = 电弧形状种子。
 */
void drawCut(inout vec4 c, vec2 r, float bend, float lt, float dur, float charge, float s) {
  if (lt < 0.0) return;
  float x = r.x;
  float y = r.y - bend * x * x;
  float taper = cutTaper(x);
  float head = mix(-CUT_LEN, CUT_LEN, clamp(lt / dur, 0.0, 1.0));
  float after = max(lt - dur, 0.0);
  float revealed = 1.0 - smoothstep(head - 2.0, head + 2.0, x);

  // 1) 刃光: 刀头后方拖一道单侧月牙, 越近刀头越厚越亮; 收刀后 50ms 散尽。
  float swoosh = 1.0 - smoothstep(0.0, 0.05, after);
  if (swoosh > 0.0) {
    float trail = CUT_LEN * 1.1;
    float along = clamp((x - (head - trail)) / trail, 0.0, 1.0);
    float headSoft = 1.0 - smoothstep(head - 3.0, head + 10.0, x);
    float w = mix(0.2, 5.5, along * along) * taper;
    float d = abs(y - w * 0.5) - w * 0.5;
    float k = swoosh * headSoft * along;
    emit(c, vec3(1.0), fillAA(d) * k * 1.1);
    emit(c, uColor, glowOf(max(d, 0.0), 7.0) * k * 0.9);
    emit(c, thunderGlow(), glowOf(max(d, 0.0), 26.0) * k * 0.35);
    // 刀头亮点: 只在掠过途中亮, 收刀即熄。
    float sweeping = 1.0 - smoothstep(0.0, 0.015, after);
    float dh = length(vec2((x - head) * 0.6, y));
    emit(c, vec3(1.0), glowOf(dh, 9.0) * sweeping * cutTaper(head) * 1.2);
  }

  // 2) 斩痕: 细亮线, 平时缓慢衰减, 充能时加粗爆亮。
  float scarAmp = (0.55 * exp(-after * 5.0) + charge) * revealed * taper;
  if (scarAmp > 0.005) {
    float ws = (0.6 + 2.4 * charge) * taper;
    float ds = abs(y) - ws;
    emit(c, hotColor(0.9), fillAA(ds) * scarAmp);
    emit(c, uColor, glowOf(max(ds, 0.0), 5.0) * scarAmp * 0.8);
    emit(c, thunderGlow(), glowOf(max(ds, 0.0), 18.0) * scarAmp * 0.25);
  }

  // 3) 缠绕电弧: 两条, 30fps 换形, 偶尔熄一帧形成频闪; 充能时摆幅骤增。
  float arcAmp = (0.7 * exp(-after * 7.0) + 1.3 * charge) * revealed * taper;
  if (arcAmp > 0.01) {
    float frame = floor(uPhase * 30.0);
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float fs = s + fi * 17.3 + frame * 3.1;
      float on = step(0.22, hash11(fs));
      float amp = 9.0 + 16.0 * charge + 6.0 * fi;
      float dj = abs(y - arcJag(x, fs, amp)) - 0.55;
      emit(c, hotColor(0.7), fillAA(dj) * arcAmp * on);
      emit(c, thunderGlow(), glowOf(max(dj, 0.0), 4.0) * arcAmp * on * 0.7);
    }
  }
}

/** 爆点后 0.3s 内, 沿斩痕向两侧乱窜的分叉放电。t = 爆点后秒数。 */
void drawBranches(inout vec4 c, vec2 r, float bend, float t, float s) {
  if (t < 0.0 || t > 0.3) return;
  float fade = 1.0 - smoothstep(0.12, 0.3, t);
  float frame = floor(uPhase * 25.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float h = hash11(fi * 3.7 + frame * 1.9 + s);
    if (h < 0.3) continue;
    float bx = (hash11(fi * 5.3 + frame * 0.7 + s) - 0.5) * CUT_LEN * 1.2;
    vec2 base = vec2(bx, bend * bx * bx);
    float side = hash11(fi * 9.1 + frame + s) < 0.5 ? -1.0 : 1.0;
    float ang = side * (PI * 0.5 + (hash11(fi * 2.3 + frame * 1.3 + s) - 0.5) * 1.4);
    float len = 26.0 + 46.0 * h;
    vec2 p = rot(r - base, -ang);
    if (p.x < 0.0 || p.x > len) continue;
    float along = p.x / len;
    float jag = (vnoise(vec2(p.x * 0.14, fi * 4.0 + frame + s)) - 0.5) * 14.0 * along;
    float d = abs(p.y - jag) - 0.8 * (1.0 - along);
    float k = fade * (1.0 - along * 0.6) * cutTaper(bx);
    emit(c, hotColor(0.65), fillAA(d) * k);
    emit(c, uColor, glowOf(max(d, 0.0), 4.0) * k * 0.6);
  }
}
`;
