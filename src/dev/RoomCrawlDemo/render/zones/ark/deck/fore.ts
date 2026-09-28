// ① 方舟观景台前景层(视差 1.3): 顶部檐口的近景剪影(底缘青色灯线)、吊在檐口下的花钵与垂叶、
// 偶尔从画面下缘探出的大叶植物。

import { ARK_FORE_GLSL } from "../kit";

export const DECK_FORE = ARK_FORE_GLSL + /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 檐口
  float beam = 1.0 - smoothstep(30.0, 32.0, top);
  vec3 bc = mix(vec3(0.03, 0.04, 0.05), vec3(0.08, 0.1, 0.11), top / 32.0);
  bc += vec3(0.25, 0.95, 1.0) * exp(-abs(top - 29.0) * 0.9) * 1.2;
  col = mix(col, bc, beam);
  a = max(a, beam);

  // 吊钵: 吊索 + 白色碗形花钵 + 下垂的叶丛
  float cell = floor(fx / 1500.0);
  float cx = (cell + 0.5) * 1500.0 + (hash11(cell + 5.0) - 0.5) * 400.0;
  if (hash11(cell * 3.3) > 0.3) {
    float dx = fx - cx;
    float drop = 110.0 + hash11(cell * 7.1) * 60.0;
    float rope = (1.0 - smoothstep(1.0, 2.2, abs(abs(dx) - (top - 30.0) / drop * 26.0))) * step(30.0, top) * step(top, drop);
    float bowl = sdEllipse(vec2(dx, top - drop - 14.0), vec2(34.0, 18.0));
    bowl = max(bowl, drop - top);
    float bm = 1.0 - smoothstep(-1.0, 1.0, bowl);
    vec3 pot = mix(vec3(0.05, 0.06, 0.07), vec3(0.16, 0.18, 0.19), clamp(dx / 34.0 * 0.5 + 0.5, 0.0, 1.0));
    float shade;
    float fr = foreFrond(vec2(fx, scr.y), vec2(cx, 1080.0 - drop - 4.0), 120.0, 1.1, -1.0, cell, shade);
    vec3 lc = mix(C_FORE_LEAF, C_FORE_RIM, shade);
    col = mix(col, vec3(0.02), rope);
    col = mix(col, lc, fr);
    col = mix(col, pot, bm);
    a = max(a, max(rope * 0.9, max(fr, bm)));
  }

  // 下缘的大叶植物
  float lcell = floor(fx / 2700.0);
  if (hash11(lcell * 1.9 + 4.0) > 0.35 && scr.y < 560.0) {
    float lx = (lcell + 0.5) * 2700.0 + (hash11(lcell + 9.0) - 0.5) * 900.0;
    float shade;
    float fr = foreFrond(vec2(fx, scr.y), vec2(lx, 230.0), 270.0, 1.0, 1.0, lcell + 20.0, shade);
    col = mix(col, mix(C_FORE_LEAF, C_FORE_RIM, shade), fr);
    a = max(a, fr);
  }
  return vec4(col * a, a);
}
`;
