// ② 空中花园廊桥地面: 错缝防腐木甲板(木纹、板缝、少量钉帽), 贴墙一条草边,
// 靠前沿一条石砌浅水渠(水面焦散由实时段叠加), 渠边嵌一道青色灯带。

import { ARK_FLOOR_LIVE, ARK_FLORA_GLSL, ARK_STRUCTURE_GLSL } from "../kit";

export const GARDEN_FLOOR = ARK_STRUCTURE_GLSL + ARK_FLORA_GLSL + /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  // 木甲板: 沿 x 铺的长板, 每排错缝
  float row = floor(z / 18.0);
  float off = hash11(row * 3.1 + uSeed) * 200.0;
  float bx = x + off;
  float plank = floor(bx / 200.0);
  float gapZ = abs(mod(z, 18.0) - 9.0) - 8.2;
  float gapX = abs(mod(bx, 200.0) - 100.0) - 99.0;
  float gap = 1.0 - fillAA(max(gapZ, gapX));
  float tone = hash12(vec2(plank, row) + uSeed);
  vec3 wood = mix(vec3(0.4, 0.26, 0.15), vec3(0.52, 0.36, 0.2), tone);
  float grain = vnoise(vec2(bx * 0.02, z * 0.9 + tone * 30.0)) * 0.6 + vnoise(vec2(bx * 0.004, z * 0.3)) * 0.4;
  wood *= 0.82 + 0.3 * grain;
  wood = arkClean(wood, vec2(x, z * 2.0), uSeed + 4.0);
  float nail = fillAA(length(vec2(abs(mod(bx, 200.0) - 100.0) - 92.0, mod(z, 18.0) - 9.0)) - 1.2);
  Surf s = surfOf(mix(wood * (1.0 - gap * 0.75), vec3(0.3), nail));
  s.height = -gap * 2.0 + grain * 0.6;
  s.gloss = 0.3;
  s.wet = 0.08;

  // 贴墙草边
  float grassEdge = 20.0 + vnoise(vec2(x * 0.05, 3.0)) * 8.0;
  float blade = vnoise(vec2(x * 0.45, z * 0.08));
  float gm = 1.0 - smoothstep(grassEdge - 3.0, grassEdge + 1.0, z - blade * 6.0);
  vec3 grass = mix(C_LEAF_DARK * 1.6, C_LEAF_LIGHT * 0.85, blade * 0.8 + z / 40.0);
  layerSurf(s, gm, grass, blade * 3.0, 0.2);
  s.wet = mix(s.wet, 0.0, gm);

  // 浅水渠 + 石砌渠沿
  float chan = abs(z - 262.0) - 18.0;
  float curb = abs(chan) - 5.0;
  float wm = fillAA(chan + 4.0);
  vec3 stone = arkClean(vec3(0.6, 0.6, 0.56), vec2(x, z * 2.0), uSeed + 9.0);
  vec2 sq = abs(mod(vec2(x, z), vec2(60.0, 100.0)) - vec2(30.0, 50.0));
  stone *= 1.0 - (1.0 - fillAA(sq.x - 29.0)) * 0.4;
  float cm = fillAA(curb);
  layerSurf(s, cm, stone, 3.0 + bevelH(curb, 2.0) * 2.0, 0.4);
  vec3 water = mix(vec3(0.03, 0.14, 0.15), vec3(0.08, 0.26, 0.24), smoothstep(-14.0, 14.0, z - 262.0));
  float pebbles = smoothstep(0.55, 0.8, vnoise(vec2(x, z) * 0.12)) * 0.3;
  layerSurf(s, wm, water + pebbles * vec3(0.1, 0.12, 0.08), -3.0, 0.95);
  s.wet = mix(s.wet, 0.9, wm);
  s.anim.y = wm;
  s.ao = mix(s.ao, 0.8, wm);
  arkStrip(s, fillAA(abs(z - 236.0) - 1.2));
  s.ao *= mix(0.6, 1.0, smoothstep(0.0, 30.0, z));
  return s;
}
`;

export const GARDEN_FLOOR_LIVE = ARK_FLOOR_LIVE;
