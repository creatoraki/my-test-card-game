// ② 空中花园廊桥背景层: 更近的巨树穹顶(只露出下半截与环梁)、层叠的悬崖绿台与飞瀑、
// 瀑布汇入的水潭与水雾、远处稀疏的尖塔与积云。

import { ARK_DOME_GLSL, ARK_SKY_GLSL } from "../kit";

export const GARDEN_FAR = ARK_SKY_GLSL + ARK_DOME_GLSL + /* glsl */ `
/**
 * 一层悬崖绿台(视差 par): 每 pitch 一段台地, 台面高度随机; 顶部树丛、岩壁、部分台沿挂着瀑布。
 * fogK 为大气透视。
 */
vec3 gardenCliffs(vec3 col, vec2 scr, float par, float pitch, float y0, float rise, float seed, float fogK) {
  float x = scr.x + uCamX * par + seed * 517.0;
  float cell = floor(x / pitch);
  float u = x - cell * pitch;
  float topY = y0 + hash11(cell * 1.7 + seed) * rise;
  // 台沿收成斜坡, 与相邻段衔接
  float nextY = y0 + hash11((cell + 1.0) * 1.7 + seed) * rise;
  float edge = smoothstep(pitch * 0.82, pitch, u);
  float ty = mix(topY, min(topY, nextY), edge);
  float lump = (fbm3(vec2(x * 0.018, seed)) - 0.35) * 34.0;
  float rockD = scr.y - ty;
  if (rockD > lump + 2.0) return col;
  vec3 rock = mix(vec3(0.22, 0.26, 0.24), vec3(0.46, 0.5, 0.46), vnoise(vec2(x * 0.03, scr.y * 0.012)));
  rock *= 0.8 + 0.3 * smoothstep(-80.0, 0.0, rockD);
  float moss = smoothstep(-26.0, -4.0, rockD + vnoise(vec2(x * 0.05, 1.0)) * 16.0);
  vec3 c = mix(rock, vec3(0.16, 0.34, 0.12), moss * 0.8);
  float bush = step(0.0, rockD) * px(rockD - lump);
  vec3 green = mix(vec3(0.06, 0.2, 0.08), vec3(0.34, 0.54, 0.16), clamp(rockD / max(lump, 1.0), 0.0, 1.0) * 0.8 + vnoise(vec2(x, scr.y) * 0.08) * 0.3);
  c = mix(c, green, bush);
  // 台沿飞瀑
  if (hash11(cell * 3.9 + seed) > 0.45) {
    float fx = cell * pitch + pitch * (0.25 + 0.5 * hash11(cell * 5.3 + seed));
    c = arkFall(c, vec2(x, scr.y), fx, 10.0 + hash11(cell) * 10.0, ty - 2.0, 700.0);
  }
  c = mix(c, C_HAZE, fogK);
  return mix(col, c, px(rockD - max(lump, 0.0)));
}

vec3 zoneFar(vec2 scr) {
  float horizon = 700.0;
  vec3 col = arkSky(scr, horizon);
  col = arkLake(col, scr, horizon);
  col = arkClouds(col, scr, 0.03, 880.0, 1080.0, 6.0, 11.0);
  col = arkSpireLayer(col, scr, 0.05, 190.0, horizon - 10.0, 120.0, 360.0, 3.0, 0.72);
  col = arkSaucers(col, scr, 0.07, 820.0, 980.0, 50.0, 6.0);
  col = gardenCliffs(col, scr, 0.1, 520.0, 730.0, 90.0, 2.0, 0.4);
  col = arkDome(col, scr, 1500.0 - uCamX * 0.16, horizon + 40.0, 560.0, 0.12);
  col = gardenCliffs(col, scr, 0.22, 700.0, 700.0, 120.0, 8.0, 0.16);
  // 瀑布落点水雾
  float mist = fbm3(vec2(scr.x + uCamX * 0.2 + uTime * 10.0, scr.y * 2.0) * 0.004);
  col = mix(col, vec3(0.86, 0.93, 0.95), smoothstep(0.35, 0.75, mist) * exp(-max(scr.y - 700.0, 0.0) / 60.0) * 0.55);
  return col;
}
`;
