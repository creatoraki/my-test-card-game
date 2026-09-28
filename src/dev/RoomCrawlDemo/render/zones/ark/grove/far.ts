// ③ 古树穹顶背景层: 穹顶内部。明亮的绿色天光、远处弧形玻璃壁与肋拱、三层环形绿台
// (台沿挂瀑布)、底部水潭与水雾、树冠缝隙漏下的光斑。

import { ARK_DOME_GLSL, ARK_SKY_GLSL } from "../kit";

export const GROVE_FAR = ARK_SKY_GLSL + ARK_DOME_GLSL + /* glsl */ `
/** 一层环形绿台(视差 par): 台面线 + 顶部树丛 + 下方白色台壁, 台沿随机挂瀑布。 */
vec3 groveTerrace(vec3 col, vec2 scr, float par, float ty, float fall, float seed, float fogK) {
  float x = scr.x + uCamX * par + seed * 400.0;
  float lump = (fbm3(vec2(x * 0.014, seed)) - 0.3) * 50.0;
  float d = scr.y - ty;
  if (d > lump + 2.0 || d < -70.0) {
    // 台壁以下: 只画瀑布
    if (d < -70.0) {
      float cell = floor(x / 430.0);
      if (hash11(cell * 2.7 + seed) > 0.5) {
        float fx = (cell + 0.3 + 0.4 * hash11(cell + seed)) * 430.0;
        return arkFall(col, vec2(x, scr.y), fx, 8.0 + hash11(cell * 4.0) * 8.0, ty - 60.0, ty - fall);
      }
    }
    return col;
  }
  vec3 wall = mix(vec3(0.46, 0.52, 0.52), vec3(0.78, 0.82, 0.8), smoothstep(-70.0, 0.0, d));
  wall += vec3(0.25, 0.95, 1.0) * exp(-abs(d + 8.0) * 0.7) * 0.6;
  float bush = step(0.0, d);
  vec3 green = mix(vec3(0.08, 0.24, 0.1), vec3(0.38, 0.6, 0.2), clamp(d / max(lump, 1.0), 0.0, 1.0) * 0.7 + vnoise(vec2(x, scr.y) * 0.07) * 0.3);
  vec3 c = mix(wall, green, bush);
  c = mix(c, vec3(0.7, 0.84, 0.8), fogK);
  return mix(col, c, px(d - max(lump, 0.0)));
}

vec3 zoneFar(vec2 scr) {
  float k = clamp((scr.y - 640.0) / 480.0, 0.0, 1.0);
  vec3 col = mix(vec3(0.46, 0.62, 0.58), vec3(0.82, 0.92, 0.9), k);
  // 远处弧形玻璃壁: 竖肋 + 两道环梁
  float gx = scr.x + uCamX * 0.04;
  float rib = 1.0 - smoothstep(1.0, 2.5, abs(mod(gx + (scr.y - 700.0) * 0.08, 150.0) - 75.0));
  col = mix(col, vec3(0.9, 0.94, 0.95), rib * 0.35);
  float ring = 1.0 - smoothstep(4.0, 6.0, abs(scr.y - 1020.0 + sin(gx * 0.002) * 20.0));
  col = mix(col, vec3(0.92, 0.95, 0.96), ring * 0.6);
  // 树冠漏下的光斑
  float spot = fbm3(vec2(scr.x + uCamX * 0.06, scr.y) * 0.006 + uTime * 0.02);
  col += vec3(1.0, 0.95, 0.7) * smoothstep(0.62, 0.8, spot) * 0.18 * k;
  // 三层环形绿台(由远及近)
  col = groveTerrace(col, scr, 0.08, 930.0, 150.0, 1.0, 0.5);
  col = groveTerrace(col, scr, 0.16, 830.0, 130.0, 5.0, 0.3);
  col = groveTerrace(col, scr, 0.26, 730.0, 120.0, 9.0, 0.12);
  // 底部水雾
  float mist = fbm3(vec2(scr.x + uCamX * 0.3 + uTime * 8.0, scr.y * 2.0) * 0.004);
  col = mix(col, vec3(0.88, 0.95, 0.94), smoothstep(0.3, 0.7, mist) * exp(-max(scr.y - 640.0, 0.0) / 90.0) * 0.6);
  return col;
}
`;
