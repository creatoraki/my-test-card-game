// ① 方舟观景台背景层: 玻璃幕墙外的全景。晴空积云、三层尖塔楼群(大气透视)、悬浮平台、
// 远处的巨树穹顶、横穿画面的轻轨高架与列车、地平线下的远湖。

import { ARK_DOME_GLSL, ARK_SKY_GLSL } from "../kit";

export const DECK_FAR = ARK_SKY_GLSL + ARK_DOME_GLSL + /* glsl */ `
/** 轻轨高架(视差 0.2): 缓弯的桥面 + 桥墩 + 青色护栏灯 + 往返的列车。 */
vec3 deckMonorail(vec3 col, vec2 scr) {
  float x = scr.x + uCamX * 0.2;
  float yc = 850.0 + sin(x * 0.0011 + 1.3) * 36.0;
  float d = scr.y - yc;
  // 桥墩
  float pu = abs(mod(x, 920.0) - 460.0);
  float pier = px(pu - 11.0 + d * 0.02) * step(d, 0.0) * step(700.0, scr.y);
  col = mix(col, mix(vec3(0.32, 0.38, 0.44), vec3(0.68, 0.73, 0.77), step(0.0, mod(x, 920.0) - 460.0)), pier * 0.9);
  if (abs(d) > 44.0) return mix(col, C_HAZE, pier * 0.25);
  float deck = px(abs(d) - 8.0);
  vec3 dc = mix(vec3(0.28, 0.34, 0.4), vec3(0.84, 0.87, 0.88), smoothstep(-8.0, 8.0, d));
  col = mix(col, dc, deck);
  col += vec3(0.25, 0.95, 1.0) * step(0.55, fract(x / 34.0)) * exp(-abs(d - 9.0) * 0.9) * 0.8;
  // 列车: 圆头长车厢, 车窗一条青色灯带
  float tx = mod(x - uTime * 240.0, 5200.0) - 400.0;
  float car = sdRoundBox(vec2(tx, d - 21.0), vec2(360.0, 12.0), 10.0);
  float cm = px(car);
  vec3 tc = mix(vec3(0.5, 0.56, 0.62), vec3(0.92, 0.94, 0.95), smoothstep(-8.0, 12.0, d - 21.0));
  tc = mix(tc, vec3(0.3, 0.9, 1.0), (1.0 - smoothstep(1.5, 3.0, abs(d - 23.0))) * step(0.3, fract(tx / 26.0)));
  col = mix(col, tc, cm);
  return mix(col, C_HAZE, 0.22 * max(deck, cm));
}

vec3 zoneFar(vec2 scr) {
  float horizon = 728.0;
  vec3 col = arkSky(scr, horizon);
  col = arkLake(col, scr, horizon);
  col = arkClouds(col, scr, 0.03, 900.0, 1080.0, 5.0, 3.0);
  col = arkSpireLayer(col, scr, 0.05, 150.0, horizon - 10.0, 110.0, 330.0, 1.0, 0.7);
  col = arkSaucers(col, scr, 0.07, 760.0, 930.0, 60.0, 2.0);
  col = arkDome(col, scr, 1180.0 - uCamX * 0.1, horizon - 28.0, 260.0, 0.3);
  col = arkSpireLayer(col, scr, 0.14, 270.0, horizon - 30.0, 150.0, 430.0, 5.0, 0.4);
  col = deckMonorail(col, scr);
  col = arkSpireLayer(col, scr, 0.26, 430.0, horizon - 70.0, 260.0, 560.0, 9.0, 0.16);
  return col;
}
`;
