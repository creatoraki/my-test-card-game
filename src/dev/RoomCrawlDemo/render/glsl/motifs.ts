// 各区域复用的程序化母题: 管道、铆钉、格栅、链条、指示灯、窗格。依赖噪声与 SDF 片段。

export const MOTIFS_GLSL = /* glsl */ `
/** 水平管道: 返回覆盖度, hgt 输出圆柱截面高度(求法线用)。 */
float pipeH(vec2 p, float cy, float r, out float hgt) {
  float dy = p.y - cy;
  hgt = sqrt(max(r * r - dy * dy, 0.0));
  return fillAA(abs(dy) - r);
}

float pipeV(vec2 p, float cx, float r, out float hgt) {
  float dx = p.x - cx;
  hgt = sqrt(max(r * r - dx * dx, 0.0));
  return fillAA(abs(dx) - r);
}

/** 管道法兰: 沿管道每 pitch px 一圈加厚的箍。 */
float flange(float x, float pitch, float width) {
  float u = abs(mod(x, pitch) - pitch * 0.5);
  return fillAA(u - width * 0.5);
}

/** 铆钉阵列的高度(0~r)。 */
float rivets(vec2 p, vec2 spacing, float r) {
  vec2 q = mod(p, spacing) - spacing * 0.5;
  float d = length(q);
  return sqrt(max(r * r - d * d, 0.0));
}

/** 格栅: 返回栅条覆盖度。 */
float grille(vec2 p, vec2 pitch, float bar) {
  vec2 q = abs(mod(p, pitch) - pitch * 0.5);
  float gx = fillAA(q.x - bar * 0.5);
  float gy = fillAA(q.y - bar * 0.5);
  return max(gx, gy);
}

/** 竖直链条(中心 x = 0), 链环交替正侧面。 */
float chainSdf(vec2 p, float link) {
  float i = floor(p.y / link);
  vec2 q = vec2(p.x, mod(p.y, link) - link * 0.5);
  float side = mod(i, 2.0);
  float ring = side < 0.5 ? abs(sdEllipse(q, vec2(link * 0.3, link * 0.62))) - 1.6 : sdBox(q, vec2(1.4, link * 0.62));
  return ring;
}

/** 指示灯闪烁: 每个格子独立的随机节奏, 返回亮度 0~1。 */
float ledBlink(vec2 cell, float t, float rate) {
  float h = hash12(cell);
  float phase = t * rate * (0.4 + h * 1.6) + h * 17.0;
  float on = step(0.45, fract(phase)) * step(0.15, hash12(cell + floor(phase)));
  return mix(0.15, 1.0, on);
}

/** 窗格: 返回框架覆盖度; cell 输出格子序号。 */
float windowGrid(vec2 p, vec2 size, float frame, out vec2 cell) {
  cell = floor(p / size);
  vec2 q = abs(mod(p, size) - size * 0.5);
  return 1.0 - fillAA(max(q.x - (size.x * 0.5 - frame), q.y - (size.y * 0.5 - frame)));
}

/** 地面裂缝(Voronoi 边界), 返回 0~1。 */
float cracks(vec2 p, float scale, float width) {
  vec3 v = voronoi(p * scale);
  float n = fbm3(p * scale * 2.3);
  return (1.0 - smoothstep(0.0, width, v.y + (n - 0.5) * 0.04)) * smoothstep(0.35, 0.6, n);
}

/** 霓虹管: 描边距离 d → 管芯 + 外晕。 */
vec3 neonTube(float d, vec3 color, float level) {
  float core = exp(-abs(d) * 0.9);
  float halo = exp(-abs(d) * 0.12) * 0.35;
  return color * (core * 2.6 + halo) * level + vec3(1.0) * pow(core, 3.0) * level * 0.8;
}
`;
