// ③ 古树穹顶前景层(视差 1.3): 顶部横过的粗枝与叶幕、从枝上垂下的藤帘, 以及下缘拱起的近景树根。

import { ARK_FORE_GLSL } from "../kit";

export const GROVE_FORE = ARK_FORE_GLSL + /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 顶部叶幕: 起伏的下缘
  float canopy = 40.0 + (fbm3(vec2(fx * 0.006, 2.0)) - 0.5) * 70.0 + (vnoise(vec2(fx * 0.05, 0.0)) - 0.5) * 16.0;
  float cm = 1.0 - smoothstep(canopy - 2.0, canopy + 2.0, top);
  vec3 cc = mix(C_FORE_LEAF, C_FORE_RIM * 0.8, smoothstep(canopy - 26.0, canopy, top) * vnoise(vec2(fx, top) * 0.08));
  col = mix(col, cc, cm);
  a = max(a, cm);

  // 粗枝: 缓弯穿过画面上部
  float by = 70.0 + sin(fx * 0.0017 + 1.0) * 40.0 + sin(fx * 0.0041) * 14.0;
  float bw = 18.0 + sin(fx * 0.0009) * 8.0;
  float branch = 1.0 - smoothstep(bw - 1.5, bw + 1.5, abs(top - by));
  vec3 bc = mix(vec3(0.02, 0.016, 0.012), vec3(0.08, 0.07, 0.05), smoothstep(bw, -bw, top - by) * 0.8);
  col = mix(col, bc, branch);
  a = max(a, branch);

  // 藤帘
  float vm = max(foreVines(scr, fx, 260.0, 64.0, 3.0), foreVines(scr, fx + 31.0, 180.0, 47.0, 9.0));
  col = mix(col, mix(C_FORE_LEAF, C_FORE_RIM, 0.3), vm);
  a = max(a, vm);

  // 下缘拱起的树根
  float rcell = floor(fx / 3100.0);
  if (hash11(rcell * 1.7 + 6.0) > 0.35 && scr.y < 470.0) {
    float rx = fx - (rcell + 0.5) * 3100.0 - (hash11(rcell) - 0.5) * 900.0;
    float span = 360.0;
    float archY = 250.0 + sqrt(max(1.0 - (rx * rx) / (span * span), 0.0)) * 190.0;
    float thick = 26.0 + abs(rx) / span * 20.0;
    float rd = abs(scr.y - archY) - thick;
    float rm = (1.0 - smoothstep(-1.5, 1.5, rd)) * step(abs(rx), span * 1.1);
    vec3 rc = mix(vec3(0.02, 0.018, 0.014), vec3(0.09, 0.14, 0.05), smoothstep(-thick, thick, scr.y - archY) * 0.9);
    col = mix(col, rc, rm);
    a = max(a, rm);
    float shade;
    float fr = foreFrond(vec2(fx, scr.y), vec2(fx - rx + span * 0.6, 260.0), 190.0, 1.1, 1.0, rcell + 60.0, shade);
    col = mix(col, mix(C_FORE_LEAF, C_FORE_RIM, shade), fr);
    a = max(a, fr);
  }
  return vec4(col * a, a);
}
`;
