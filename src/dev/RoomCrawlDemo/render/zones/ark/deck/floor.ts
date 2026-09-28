// ① 方舟观景台地面: 错缝铺的浅色抛光石材(淡纹理、高光泽, 倒映日光), 中段一条深色石板步道,
// 步道两侧嵌入青色灯带, 每隔一段一道指向玻璃幕墙的短灯带。

import { ARK_FLOOR_LIVE, ARK_STRUCTURE_GLSL } from "../kit";

export const DECK_FLOOR = ARK_STRUCTURE_GLSL + /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  float row = floor(z / 60.0);
  vec2 tp = vec2(x + mod(row, 2.0) * 120.0, z);
  vec2 q = abs(mod(tp, vec2(240.0, 60.0)) - vec2(120.0, 30.0));
  float e = max(q.x - 119.0, q.y - 29.2);
  float seam = 1.0 - fillAA(e);
  vec2 cell = floor(tp / vec2(240.0, 60.0));
  float tone = hash12(cell + uSeed);
  vec3 stone = mix(vec3(0.6, 0.62, 0.61), vec3(0.7, 0.71, 0.69), tone);
  vec2 wp = vec2(x, z * 2.0);
  stone = arkClean(stone, wp, uSeed + 3.0);
  float vein = smoothstep(0.86, 0.96, ridged(wp * 0.008 + tone * 10.0));
  stone = mix(stone, stone * 0.8, vein * 0.45);

  // 中段深色步道
  float path = abs(z - 150.0) - 44.0;
  float pm = fillAA(path);
  vec3 slate = arkClean(C_ARK_SLATE * 2.2, wp + 50.0, uSeed + 7.0);
  vec2 sq = abs(mod(vec2(x, z - 106.0), vec2(88.0, 44.0)) - vec2(44.0, 22.0));
  float sseam = 1.0 - fillAA(max(sq.x - 43.2, sq.y - 21.4));
  vec3 base = mix(stone * (1.0 - seam * 0.45), slate * (1.0 - sseam * 0.4), pm);
  Surf s = surfOf(base);
  s.height = -mix(seam, sseam, pm) * 1.5;
  s.gloss = mix(0.62, 0.75, pm);
  s.wet = mix(0.28, 0.4, pm);
  // 灯带: 步道两侧 + 指向幕墙的短灯带
  arkStrip(s, fillAA(abs(path + 2.0) - 1.3));
  float dash = fillAA(abs(mod(x + 180.0, 720.0) - 360.0) - 1.3) * step(8.0, z) * step(z, 96.0);
  arkStrip(s, dash);
  // 墙根花槽投下的暗部
  s.ao = mix(0.55, 1.0, smoothstep(0.0, 36.0, z));
  return s;
}
`;

export const DECK_FLOOR_LIVE = ARK_FLOOR_LIVE;
