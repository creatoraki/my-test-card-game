// 统一调色板与「厚涂式」风化层: 污渍、锈迹、磨损、划痕。所有区域共用, 保证质感统一。
// 依赖 NOISE_GLSL。

export const PALETTE_GLSL = /* glsl */ `
const vec3 C_INK = vec3(0.018, 0.022, 0.028);
const vec3 C_SHADOW = vec3(0.03, 0.05, 0.062);
const vec3 C_CONCRETE = vec3(0.30, 0.295, 0.28);
const vec3 C_CONCRETE_DARK = vec3(0.16, 0.165, 0.165);
const vec3 C_STEEL = vec3(0.24, 0.27, 0.29);
const vec3 C_STEEL_DARK = vec3(0.09, 0.105, 0.118);
const vec3 C_PAINT_GREEN = vec3(0.13, 0.24, 0.21);
const vec3 C_RUST = vec3(0.36, 0.15, 0.06);
const vec3 C_RUST_LIGHT = vec3(0.58, 0.29, 0.1);
const vec3 C_HAZARD = vec3(0.82, 0.56, 0.08);
const vec3 C_AMBER = vec3(1.0, 0.6, 0.22);
const vec3 C_TEAL = vec3(0.16, 1.0, 0.8);
const vec3 C_MAGENTA = vec3(1.0, 0.2, 0.74);
const vec3 C_CYAN = vec3(0.18, 0.86, 1.0);
const vec3 C_ICE = vec3(0.45, 0.72, 1.0);
const vec3 C_ALARM = vec3(1.0, 0.1, 0.05);

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 desat(vec3 c, float k) {
  return mix(c, vec3(luma(c)), k);
}

/** 竖向流痕的污渍量 0~1(雨水、渗漏顺着立面往下淌)。 */
float streaks(vec2 p, float seed) {
  float col = vnoise(vec2(p.x * 0.045 + seed, seed * 3.1));
  float run = fbm3(vec2(p.x * 0.09 + seed, p.y * 0.006));
  return smoothstep(0.45, 0.95, col * 0.6 + run * 0.6) * smoothstep(0.0, 0.8, run);
}

/** 大块斑驳污渍 0~1。 */
float grime(vec2 p, float seed) {
  float n = fbm(p * 0.006 + seed);
  float m = fbm3(p * 0.03 + seed * 1.7);
  return clamp(smoothstep(0.42, 0.78, n) * 0.8 + (m - 0.5) * 0.35, 0.0, 1.0);
}

/** 锈迹遮罩: amount 越大锈得越多; 边缘带一点亮锈。 */
float rustMask(vec2 p, float amount, float seed) {
  float n = fbm(p * 0.02 + seed) + fbm3(p * 0.11 + seed) * 0.25;
  return smoothstep(1.05 - amount, 1.2 - amount, n);
}

/** 细划痕 0~1。 */
float scratches(vec2 p, float seed) {
  vec2 q = rot2(0.35 + seed) * p;
  float lines = abs(fract(q.y * 0.19 + vnoise(q * vec2(0.01, 0.2)) * 3.0) - 0.5);
  float mask = smoothstep(0.62, 0.8, vnoise(q * vec2(0.02, 0.05) + seed));
  return (1.0 - smoothstep(0.0, 0.05, lines)) * mask;
}

/**
 * 厚涂风化: 在底色上叠污渍、流痕、锈迹与边缘磨损。
 * edge 为到形体边缘的归一化距离(0 = 边缘), 磨损集中在边角。
 */
vec3 weather(vec3 base, vec2 p, float dirt, float rust, float edge, float seed) {
  vec3 c = base;
  // 低频明暗起伏: 手绘般的色块感
  c *= 0.86 + 0.28 * fbm3(p * 0.012 + seed);
  float g = grime(p, seed);
  c = mix(c, c * vec3(0.46, 0.44, 0.4), g * dirt);
  float s = streaks(p, seed);
  c = mix(c, c * vec3(0.55, 0.5, 0.44), s * dirt * 0.8);
  float r = rustMask(p, rust, seed);
  vec3 rc = mix(C_RUST, C_RUST_LIGHT, fbm3(p * 0.2 + seed));
  c = mix(c, rc, r * 0.85);
  float wear = (1.0 - smoothstep(0.0, 0.35, edge)) * smoothstep(0.35, 0.7, vnoise(p * 0.15 + seed));
  c = mix(c, c * 1.55 + 0.03, wear * 0.55);
  c += scratches(p, seed) * 0.05 * (1.0 - r);
  return c;
}

/** 危险斑马线(黄黑斜纹), 带掉漆。 */
vec3 hazard(vec2 p, float width, float seed) {
  float band = step(0.5, fract((p.x + p.y) / width));
  vec3 c = mix(C_INK * 2.0, C_HAZARD, band);
  float chip = smoothstep(0.55, 0.7, fbm3(p * 0.07 + seed));
  return mix(c, C_CONCRETE_DARK, chip * 0.8);
}
`;
