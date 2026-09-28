// 生态方舟共用远景母题(实时, 只用于背景层): 晴空、积云、尖塔楼群、悬浮平台、湖面。
// 坐标 scr = 屏幕 px(y 向上), 视差按 uCamX 自行计算。成本约束: 每像素 fbm 不超过三次。

export const ARK_SKY_GLSL = /* glsl */ `
const vec3 C_SKY_TOP = vec3(0.07, 0.2, 0.56);
const vec3 C_SKY_LOW = vec3(0.4, 0.55, 0.66);
const vec3 C_HAZE = vec3(0.5, 0.62, 0.7);

/** 1 px 抗锯齿阶跃: d < 0 为内部。 */
float px(float d) {
  return clamp(0.5 - d, 0.0, 1.0);
}

/** 天空: 地平线 horizon 往上由浅雾蓝过渡到深天蓝, 右上方画外有太阳。 */
vec3 arkSky(vec2 scr, float horizon) {
  float k = clamp((scr.y - horizon) / (1180.0 - horizon), 0.0, 1.0);
  vec3 col = mix(C_SKY_LOW, C_SKY_TOP, pow(k, 0.75));
  vec2 sp = vec2(scr.x - 1760.0 + uCamX * 0.01, scr.y - 1300.0);
  col += vec3(1.0, 0.9, 0.72) * exp(-length(sp) / 460.0) * 0.55;
  return col;
}

/**
 * 积云带: y0~y1 之间, 横向拉伸的 fbm 团块。顶部迎光为亮白, 底部偏蓝灰;
 * 以下方偏移的第二次采样判断「朝上」的边缘。par 为视差, drift 为漂移速度。
 */
vec3 arkClouds(vec3 col, vec2 scr, float par, float y0, float y1, float drift, float seed) {
  if (scr.y < y0 - 40.0 || scr.y > y1 + 60.0) return col;
  vec2 cp = vec2((scr.x + uCamX * par + uTime * drift) * 0.0022, scr.y * 0.0048) + seed;
  float band = smoothstep(y0 - 40.0, y0 + 90.0, scr.y) * smoothstep(y1 + 60.0, y1 - 80.0, scr.y);
  float n = fbm(cp) - (1.0 - band) * 0.55;
  float m = smoothstep(0.46, 0.58, n);
  if (m < 0.001) return col;
  float below = fbm3(cp + vec2(0.0, -0.09)) - (1.0 - band) * 0.55;
  float lit = clamp((n - below) * 5.0 + 0.55, 0.0, 1.0);
  vec3 cc = mix(vec3(0.52, 0.6, 0.72), vec3(1.0, 0.99, 0.96), lit);
  cc = mix(cc, C_HAZE, 0.15);
  return mix(col, cc, m);
}

/**
 * 一层尖塔楼群: 每 pitch 一栋, 塔身三段收分 + 尖顶 + 腰部圆环平台。
 * 返回覆盖度; lit 输出迎光系数(右侧迎光), win 输出青色窗灯。
 */
float arkSpires(vec2 scr, float par, float pitch, float base, float hMin, float hMax, float seed, out float lit, out float win) {
  float x = scr.x + uCamX * par + seed * 731.0;
  float cell = floor(x / pitch);
  float u = x - (cell + 0.5) * pitch;
  float r1 = hash11(cell * 1.31 + seed);
  float r2 = hash11(cell * 2.77 + seed);
  float r3 = hash11(cell * 4.13 + seed);
  u -= (r3 - 0.5) * pitch * 0.35;
  float w = pitch * (0.12 + 0.13 * r1);
  float h = mix(hMin, hMax, r2 * r2);
  float y = scr.y - base;
  float k = y / h;
  float ww = w * (1.0 - step(0.55, k) * 0.22 - step(0.82, k) * 0.28);
  float body = px(abs(u) - ww) * px(y - h);
  float sh = h * (0.12 + 0.2 * r3);
  float sk = clamp((y - h) / sh, 0.0, 1.0);
  float spire = px(abs(u) - w * 0.2 * (1.0 - sk)) * step(h, y) * step(y, h + sh);
  float ry = h * (0.42 + 0.3 * r1);
  float ring = px(length(vec2(u / (w * 2.4), (y - ry) / 7.0)) - 1.0) * step(0.45, r2);
  lit = clamp(u / max(ww, 1.0) * 0.5 + 0.5, 0.0, 1.0);
  lit = mix(lit, 0.9, ring);
  win = step(0.55, fract(y / 13.0)) * step(0.5, fract(u / 7.0)) * step(0.62, hash12(vec2(cell, floor(y / 13.0)))) * body;
  win += (1.0 - smoothstep(0.0, 2.0, abs(y - ry + 5.0))) * ring * 2.0;
  return max(max(body, spire), ring);
}

/** 叠一层楼群: fogK 为大气透视(越远越接近天色), tint 为该层底色。 */
vec3 arkSpireLayer(vec3 col, vec2 scr, float par, float pitch, float base, float hMin, float hMax, float seed, float fogK) {
  float lit;
  float win;
  float m = arkSpires(scr, par, pitch, base, hMin, hMax, seed, lit, win);
  vec3 c = mix(vec3(0.16, 0.22, 0.3), vec3(0.62, 0.7, 0.76), lit);
  c += vec3(0.2, 0.9, 1.0) * win * 0.35;
  float up = clamp((scr.y - base) / hMax, 0.0, 1.0);
  c = mix(c, C_HAZE, clamp(fogK * (1.0 - up * 0.4), 0.0, 1.0));
  return mix(col, c, m);
}

/** 悬浮平台(飞碟状): 碟面 + 上方小穹 + 下方收尖的吊舱 + 青色环灯, 缓慢起伏。 */
vec3 arkSaucers(vec3 col, vec2 scr, float par, float pitch, float y0, float size, float seed) {
  float x = scr.x + uCamX * par + seed * 311.0;
  float cell = floor(x / pitch);
  if (hash11(cell * 5.1 + seed) < 0.45) return col;
  float cy = y0 + (hash11(cell * 2.3 + seed) - 0.5) * 120.0 + sin(uTime * 0.4 + cell) * 6.0;
  vec2 q = vec2(x - (cell + 0.5) * pitch - (hash11(cell + seed) - 0.5) * pitch * 0.4, scr.y - cy) / size;
  float disc = length(q * vec2(1.0, 7.0)) - 1.0;
  float cap = length((q - vec2(0.0, 0.08)) * vec2(2.6, 3.4)) - 1.0;
  float pod = max(abs(q.x) - 0.28 * clamp(1.0 + q.y * 1.6, 0.0, 1.0), max(q.y, -q.y - 0.6));
  float d = min(min(disc, max(cap, -q.y)), pod) * size;
  float m = px(d);
  if (m < 0.001) return col;
  float lit = clamp(q.y * 3.0 + 0.5 + q.x * 0.4, 0.0, 1.0);
  vec3 c = mix(vec3(0.2, 0.26, 0.33), vec3(0.72, 0.78, 0.82), lit);
  c += vec3(0.25, 0.95, 1.0) * exp(-abs(disc * size + 1.0) * 0.8) * 0.9;
  c = mix(c, C_HAZE, 0.35);
  return mix(col, c, m);
}

/** 地平线以下的远湖: 波光横纹 + 近处更深。 */
vec3 arkLake(vec3 col, vec2 scr, float horizon) {
  if (scr.y > horizon) return col;
  float k = clamp((horizon - scr.y) / 160.0, 0.0, 1.0);
  vec3 water = mix(vec3(0.3, 0.55, 0.62), vec3(0.06, 0.3, 0.38), k);
  float glint = step(0.8, vnoise(vec2((scr.x + uCamX * 0.05) * 0.03, scr.y * 0.6 + uTime * 0.8)));
  water += vec3(0.6, 0.7, 0.7) * glint * (1.0 - k) * 0.35;
  return water;
}
`;
