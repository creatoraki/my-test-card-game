// ⑤ 冷却核心背景层: 圆形风道里旋转的巨型风扇, 背后是灼热的核心红光, 光束穿过叶片间隙射出,
// 叶片带动烟雾流动。视差 0.25。

export const CORE_FAR = /* glsl */ `
vec3 zoneFar(vec2 scr) {
  float t = uTime;
  vec3 col = vec3(0.02, 0.004, 0.004);
  float fx = scr.x + uCamX * 0.25;
  float cell = floor(fx / 1150.0 * 0.8);
  float cellW = 1150.0 / 0.8;
  float cx = (floor(fx / cellW) + 0.5) * cellW;
  vec2 p = vec2(fx - cx, scr.y - 840.0);
  float r = length(p);
  float ang = atan(p.y, p.x);
  float spin = t * 1.6 + floor(fx / cellW) * 1.3;
  // 核心红光: 中心最亮
  vec3 hot = vec3(1.0, 0.25, 0.08) * exp(-r / 180.0) * 1.2 + vec3(0.5, 0.06, 0.02) * exp(-r / 420.0);
  // 叶片: 7 片带弧度的扇叶
  float blades = 7.0;
  float a = ang - spin + r * 0.004;
  float sector = abs(fract(a / 6.2832 * blades) - 0.5);
  float blade = step(sector, 0.28 - r * 0.0002) * step(60.0, r) * step(r, 360.0);
  // 光束: 从叶片间隙径向射出, 带烟雾噪声
  float gap = 1.0 - smoothstep(0.26, 0.34, 0.5 - sector);
  float smoke = fbm(vec2(ang * 3.0 - spin * 0.5, r * 0.01 - t * 0.4));
  float beams = gap * smoothstep(60.0, 200.0, r) * exp(-max(r - 360.0, 0.0) / 260.0) * (0.5 + smoke);
  col += hot * (1.0 - blade);
  col += vec3(1.0, 0.35, 0.12) * beams * 0.5;
  // 叶片本体: 暗金属, 迎光边缘发红
  vec3 bladeC = vec3(0.02, 0.012, 0.012) + vec3(0.4, 0.08, 0.02) * smoothstep(0.2, 0.28, sector) * exp(-r / 300.0);
  col = mix(col, bladeC, blade);
  // 轮毂与螺栓
  float hub = step(r, 64.0);
  float bolt = step(length(vec2(mod(ang - spin, 0.8976) - 0.4488, (r - 44.0) / 44.0) * vec2(44.0, 44.0)), 5.0);
  col = mix(col, vec3(0.05, 0.03, 0.03) + bolt * 0.08, hub);
  // 风道外壳与辐条护网
  float shroud = step(360.0, r) * step(r, 400.0);
  float guard = step(abs(fract(ang / 6.2832 * 24.0) - 0.5), 0.03) * step(r, 400.0) * step(60.0, r) + step(abs(r - 220.0), 3.0) + step(abs(r - 320.0), 3.0);
  col = mix(col, vec3(0.03, 0.02, 0.02), clamp(shroud + guard * 0.8, 0.0, 1.0));
  // 外部的烟与余烬光
  col += vec3(0.25, 0.04, 0.02) * smoothstep(0.45, 0.85, fbm(vec2(fx, scr.y) * 0.003 + vec2(t * 0.05, -t * 0.08))) * 0.35;
  return col;
}
`;
