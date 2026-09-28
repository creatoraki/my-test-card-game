// ② 空中花园廊桥前景层(视差 1.3): 顶部近景廊架横梁与成帘的垂藤, 偶尔从上角垂下的大叶丛与下缘探出的蕨叶。

import { ARK_FORE_GLSL } from "../kit";

export const GARDEN_FORE = ARK_FORE_GLSL + /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 近景廊架横梁
  float beam = 1.0 - smoothstep(24.0, 26.0, top);
  col = mix(col, mix(vec3(0.04, 0.05, 0.05), vec3(0.1, 0.12, 0.12), top / 26.0), beam);
  a = max(a, beam);

  // 垂藤帘: 两层不同疏密
  float v1 = foreVines(scr, fx, 240.0, 58.0, 1.0);
  float v2 = foreVines(scr, fx + 23.0, 150.0, 41.0, 7.0);
  float vm = max(v1, v2);
  vec3 vc = mix(C_FORE_LEAF, C_FORE_RIM, (1.0 - top / 260.0) * 0.4 + v2 * 0.25);
  col = mix(col, vc, vm);
  a = max(a, vm);

  // 上角垂下的大叶丛
  float cell = floor(fx / 1900.0);
  if (hash11(cell * 2.3 + 1.0) > 0.4) {
    float cx = (cell + 0.5) * 1900.0 + (hash11(cell + 3.0) - 0.5) * 600.0;
    float shade;
    float fr = foreFrond(vec2(fx, scr.y), vec2(cx, 1070.0), 200.0, 1.2, -1.0, cell + 3.0, shade);
    col = mix(col, mix(C_FORE_LEAF, C_FORE_RIM, shade), fr);
    a = max(a, fr);
  }

  // 下缘蕨叶
  float lcell = floor(fx / 2300.0);
  if (hash11(lcell * 4.1 + 2.0) > 0.4 && scr.y < 520.0) {
    float lx = (lcell + 0.5) * 2300.0 + (hash11(lcell + 5.0) - 0.5) * 800.0;
    float shade;
    float fr = foreFrond(vec2(fx, scr.y), vec2(lx, 250.0), 230.0, 1.25, 1.0, lcell + 40.0, shade);
    col = mix(col, mix(C_FORE_LEAF, C_FORE_RIM, shade), fr);
    a = max(a, fr);
  }
  return vec4(col * a, a);
}
`;
