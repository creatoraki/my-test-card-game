// 生态方舟共用植物母题(烘焙段): 叶簇、垂藤、苔藓、树皮。依赖公共前缀与 ROOM_HEADER。
// 颜色约定: 暗部偏蓝绿、亮部偏黄绿, 顶部迎光(日光从上方来)。

export const ARK_FLORA_GLSL = /* glsl */ `
const vec3 C_LEAF_DARK = vec3(0.025, 0.085, 0.05);
const vec3 C_LEAF = vec3(0.1, 0.27, 0.085);
const vec3 C_LEAF_LIGHT = vec3(0.4, 0.6, 0.17);
const vec3 C_MOSS = vec3(0.2, 0.36, 0.1);

/**
 * 叶簇: 中心 c、半径 r 的蓬松团块, 表面由一片片叶子组成(Voronoi 细胞: 中心亮、边界暗), 上亮下暗。
 * 返回覆盖度; col / hgt 输出颜色与高度。
 */
float foliage(vec2 p, vec2 c, vec2 r, float seed, out vec3 col, out float hgt) {
  vec2 q = (p - c) / r;
  float rough = fbm3(p * 0.03 + seed) - 0.5;
  float d = (length(q) - 1.0 + rough * 0.55) * min(r.x, r.y);
  float m = fillAA(d);
  vec3 v = voronoi(p * vec2(0.07, 0.09) + seed * 7.0);
  float leaf = 1.0 - smoothstep(0.0, 0.85, v.x);
  float vein = 1.0 - smoothstep(0.0, 0.07, v.y);
  float up = clamp(q.y * 0.5 + 0.55, 0.0, 1.0);
  float inner = clamp(-d / (min(r.x, r.y) * 0.6), 0.0, 1.0);
  vec3 base = mix(C_LEAF_DARK, C_LEAF, clamp(v.z * 0.5 + up * 0.7 - inner * 0.3, 0.0, 1.0));
  col = mix(base, C_LEAF_LIGHT, leaf * up * up * 0.75);
  col *= 1.0 - vein * 0.55;
  hgt = leaf * 5.0 + (1.0 - inner) * 2.0;
  return m;
}

/** 叠一个叶簇到表面上(不透明, 盖住背后的开口)。 */
void layerFoliage(inout Surf s, vec2 p, vec2 c, vec2 r, float seed, float lift) {
  vec3 col;
  float hgt;
  float m = foliage(p, c, r, seed, col, hgt);
  layerSurf(s, m, col, lift + hgt, 0.3);
  s.alpha = max(s.alpha, m);
  s.ao = mix(s.ao, 1.0, m);
}

/**
 * 垂藤: 从 topY 往下垂, 每 pitch 一列, 长度按列随机; 藤条 + 互生小叶, 越往下叶越小。
 * 返回覆盖度, col 输出颜色。
 */
float vines(vec2 p, float topY, float maxLen, float pitch, float seed, out vec3 col) {
  float cell = floor(p.x / pitch);
  float len = maxLen * (0.3 + 0.7 * hash11(cell * 3.1 + seed));
  float present = step(0.3, hash11(cell * 1.7 + seed));
  float y = topY - p.y;
  float sway = sin(y * 0.018 + cell * 2.3) * 7.0 * clamp(y / maxLen, 0.0, 1.0);
  float u = p.x - (cell + 0.5) * pitch - (hash11(cell + seed * 2.0) - 0.5) * pitch * 0.4 - sway;
  float inside = step(0.0, y) * step(y, len + 5.0);
  float stem = fillAA(abs(u) - 1.3) * step(y, len);
  float seg = floor(y / 15.0);
  float side = mod(seg, 2.0) * 2.0 - 1.0;
  vec2 lq = rot2(side * 0.7) * vec2(u - side * 6.0, mod(y, 15.0) - 7.5);
  float taper = 1.0 - smoothstep(len * 0.6, len + 5.0, y) * 0.5;
  float leaf = fillAA(sdEllipse(lq, vec2(6.5, 3.2) * taper));
  float m = max(stem, leaf) * inside * present;
  float tone = hash11(seg * 1.3 + cell);
  col = mix(C_LEAF_DARK * 1.4, mix(C_LEAF, C_LEAF_LIGHT, tone * 0.7), leaf);
  return m;
}

/** 叠两层垂藤。 */
void layerVines(inout Surf s, vec2 p, float topY, float maxLen, float seed, float lift) {
  vec3 col;
  float m = vines(p, topY, maxLen, 34.0, seed, col);
  layerSurf(s, m, col * 0.8, lift, 0.25);
  s.alpha = max(s.alpha, m);
  m = vines(p + vec2(17.0, 0.0), topY + 6.0, maxLen * 0.7, 46.0, seed + 5.0, col);
  layerSurf(s, m, col, lift + 3.0, 0.25);
  s.alpha = max(s.alpha, m);
}

/** 苔藓遮罩 0~1: 成片生长, 边缘碎。 */
float mossMask(vec2 p, float amount, float seed) {
  float n = fbm3(p * 0.012 + seed) + (vnoise(p * 0.12 + seed) - 0.5) * 0.25;
  return smoothstep(1.0 - amount, 1.12 - amount, n);
}

/** 树皮: 竖向扭转纤维与深沟, hgt 输出起伏。 */
vec3 bark(vec2 p, float seed, out float hgt) {
  vec2 w = vec2(p.x + fbm3(p * vec2(0.004, 0.01) + seed) * 60.0, p.y);
  float fiber = ridged(vec2(w.x * 0.035, w.y * 0.005) + seed);
  float groove = smoothstep(0.55, 0.9, fiber);
  vec3 c = mix(vec3(0.1, 0.075, 0.055), vec3(0.3, 0.24, 0.17), groove);
  c *= 0.85 + 0.3 * vnoise(p * vec2(0.05, 0.01) + seed);
  hgt = groove * 8.0;
  return c;
}
`;
