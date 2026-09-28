// ① 货运入口背景层: 破天窗外的夜城。三层楼宇剪影(视差 0.12 / 0.22 / 0.34)与缓慢移动的低云。

export const DOCK_FAR = /* glsl */ `
vec3 skyline(vec2 scr, float par, float base, float range, float bw, float seed, vec3 tint, float lit) {
  float x = scr.x + uCamX * par + seed * 1000.0;
  float cell = floor(x / bw);
  float u = fract(x / bw);
  float h1 = hash11(cell * 3.1 + seed);
  float top = base + h1 * range;
  // 楼顶细节: 退台与天线
  float step1 = step(0.55, hash11(cell + seed * 7.0));
  float inset = step1 * step(abs(u - 0.5), 0.28) * 30.0;
  float antenna = step(0.7, h1) * step(abs(u - 0.62), 0.012) * 70.0;
  float gap = step(u, 0.06) * step(0.4, hash11(cell * 1.9 + seed));
  float roof = top + inset + antenna;
  if (scr.y > roof || gap > 0.5) return vec3(-1.0);
  // 窗户
  vec2 wp = vec2(u * bw, scr.y);
  vec2 wc = floor(wp / vec2(14.0, 18.0));
  vec2 wf = fract(wp / vec2(14.0, 18.0));
  float win = step(0.25, wf.x) * step(wf.x, 0.75) * step(0.3, wf.y) * step(wf.y, 0.75);
  float on = step(1.0 - lit, hash12(wc + cell * 13.0 + seed));
  float warm = hash12(wc + 7.7 + cell);
  vec3 wcol = mix(vec3(1.0, 0.62, 0.3), vec3(0.45, 0.8, 1.0), step(0.7, warm));
  float edgeFade = step(scr.y, top - 6.0);
  vec3 c = tint * (0.8 + 0.4 * hash11(cell));
  c += wcol * win * on * edgeFade * (0.5 + 0.5 * hash12(wc + 3.0)) * 0.9;
  return c;
}

vec3 zoneFar(vec2 scr) {
  float t = uTime;
  float y = scr.y / 1080.0;
  vec3 col = mix(vec3(0.012, 0.016, 0.032), vec3(0.05, 0.065, 0.11), smoothstep(0.35, 1.0, y));
  // 城市光污染把低空染成暗橙
  col += vec3(0.26, 0.12, 0.05) * exp(-max(scr.y - 560.0, 0.0) / 170.0) * 0.4;
  // 低云缓慢移动
  vec2 cp = vec2(scr.x + uCamX * 0.05 + t * 9.0, scr.y * 1.8);
  float cloud = fbm(cp * 0.0022);
  col += vec3(0.07, 0.075, 0.1) * smoothstep(0.42, 0.85, cloud) * smoothstep(0.45, 0.9, y);

  vec3 b3 = skyline(scr, 0.12, 690.0, 260.0, 120.0, 1.3, vec3(0.03, 0.035, 0.055), 0.12);
  if (b3.x >= 0.0) col = mix(col, b3, 0.85);
  vec3 b2 = skyline(scr, 0.22, 660.0, 200.0, 170.0, 4.1, vec3(0.018, 0.022, 0.036), 0.2);
  if (b2.x >= 0.0) col = b2;
  // 两层之间的雾
  col = mix(col, vec3(0.08, 0.085, 0.11), 0.18 * smoothstep(900.0, 650.0, scr.y));
  vec3 b1 = skyline(scr, 0.34, 640.0, 130.0, 240.0, 8.7, vec3(0.008, 0.01, 0.016), 0.28);
  if (b1.x >= 0.0) col = b1;
  return col;
}
`;
