// ③ 古树穹顶地面: 不规则石板小径(缝里长苔)、横穿地面的巨树根、左段一汪浅水潭(浮着几片睡莲叶,
// 焦散由实时段叠加), 贴墙一条苔藓边。

import { ARK_FLOOR_LIVE, ARK_FLORA_GLSL, ARK_STRUCTURE_GLSL } from "../kit";

export const GROVE_FLOOR = ARK_STRUCTURE_GLSL + ARK_FLORA_GLSL + /* glsl */ `
/** 横穿地面的树根: 从巨树脚下向两侧蜿蜒, 返回到根中线的距离(px)与根的半宽。 */
float groveRoot(vec2 p, float trunkX, float i, out float halfW) {
  float side = mod(i, 2.0) * 2.0 - 1.0;
  float along = (p.x - trunkX) * side;
  float z0 = 30.0 + i * 70.0 + sin(along * 0.004 + i) * 40.0 + along * (0.03 + i * 0.015);
  halfW = max(16.0 - along * 0.012, 0.0) * step(-200.0, along);
  return abs(p.y - z0) - halfW;
}

Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  vec2 wp = vec2(x, z * 2.0);
  // 石板: Voronoi 块, 缝隙长苔
  vec3 v = voronoi(wp * 0.012 + uSeed);
  float crack = 1.0 - smoothstep(0.02, 0.07, v.y);
  vec3 stone = mix(vec3(0.46, 0.46, 0.42), vec3(0.62, 0.6, 0.55), v.z);
  stone = arkClean(stone, wp, uSeed + 2.0) * (0.9 + 0.2 * fbm3(wp * 0.03));
  float moss = max(crack, mossMask(wp, 0.35, uSeed + 4.0) * 0.8);
  Surf s = surfOf(mix(stone, C_MOSS * (0.8 + 0.4 * vnoise(wp * 0.1)), moss));
  s.height = -crack * 2.5 + smoothstep(0.0, 0.2, v.y) * 1.5;
  s.gloss = 0.2;

  // 浅水潭
  float trunkX = uWidth * 0.55;
  vec2 pc = vec2((x - trunkX * 0.42) / 300.0, (z - 140.0) / 70.0);
  float pond = (length(pc) - 1.0 + (fbm3(wp * 0.01) - 0.5) * 0.4) * 70.0;
  float pm = fillAA(pond);
  float bank = fillAA(abs(pond + 3.0) - 5.0);
  layerSurf(s, bank, mix(stone, C_MOSS, 0.5), 2.0, 0.3);
  vec3 water = mix(vec3(0.04, 0.16, 0.14), vec3(0.1, 0.28, 0.22), clamp(-pond / 40.0, 0.0, 1.0));
  layerSurf(s, pm, water, -3.0, 0.95);
  s.wet = pm * 0.9;
  s.anim.y = pm;
  // 睡莲叶
  vec2 lc = floor(wp / 70.0);
  vec2 lq = mod(wp, 70.0) - 35.0 - (hash22(lc) - 0.5) * 30.0;
  float pad = length(lq) - 12.0 - hash12(lc) * 6.0;
  float notch = abs(atan(lq.y, lq.x) - 0.4) - 0.18;
  float lm = fillAA(max(pad, -notch * 12.0)) * step(0.55, hash12(lc + 3.0)) * fillAA(pond + 10.0);
  layerSurf(s, lm, mix(C_LEAF, C_LEAF_LIGHT, 0.4), 1.0, 0.5);
  s.anim.y *= 1.0 - lm;
  s.wet *= 1.0 - lm;

  // 树根
  for (int i = 0; i < 3; i++) {
    float rw;
    float rd = groveRoot(p, trunkX, float(i), rw);
    float rm = fillAA(rd) * step(1.0, rw);
    float bh;
    vec3 bc = bark(vec2(x * 0.4, z * 6.0), uSeed + float(i), bh);
    bc = mix(bc, C_MOSS, mossMask(wp * 1.5, 0.45, float(i) + uSeed) * 0.7);
    layerSurf(s, rm, bc * 1.1, 6.0 + bevelH(rd, rw) * 8.0 + bh * 0.3, 0.2);
    s.anim.y *= 1.0 - rm;
    s.wet *= 1.0 - rm;
    s.ao *= 1.0 - fillSoft(rd - 4.0, 6.0) * (1.0 - rm) * 0.45;
  }
  // 贴墙苔藓边
  float edge = 1.0 - smoothstep(10.0, 22.0, z - vnoise(vec2(x * 0.04, 1.0)) * 10.0);
  layerSurf(s, edge, C_MOSS * 0.9, 2.0, 0.2);
  s.ao *= mix(0.6, 1.0, smoothstep(0.0, 34.0, z));
  return s;
}
`;

export const GROVE_FLOOR_LIVE = ARK_FLOOR_LIVE;
