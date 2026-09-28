// ④ 数据机房背景层: 玻璃墙后的全息数据瀑布。两层下落的数据块流(视差 0.18 / 0.32)、
// 网格底纹、横扫的扫描带、缓慢旋转的数据环。数据块只是抽象矩形, 不是文字。

export const SERVER_FAR = /* glsl */ `
float dataRain(vec2 scr, float par, float colW, float speed, float seed, out float head) {
  float x = scr.x + uCamX * par + seed * 300.0;
  float col = floor(x / colW);
  float u = fract(x / colW);
  float h = hash11(col * 1.7 + seed);
  float y = scr.y + uTime * speed * (0.6 + h * 0.8) + h * 2000.0;
  float cellH = colW * 1.2;
  float row = floor(y / cellH);
  float v = fract(y / cellH);
  // 数据块: 宽窄不一的短矩形
  float bw = 0.3 + hash12(vec2(col, row) + seed) * 0.6;
  float block = step(abs(u - 0.5), bw * 0.5) * step(0.15, v) * step(v, 0.85);
  float on = step(0.35, hash12(vec2(col * 3.0, row) + seed * 7.0));
  // 每列有一个亮头部向下走, 身后渐隐
  float trail = fract((y / cellH) * 0.05 + h);
  float tail = pow(trail, 3.0);
  head = step(0.97, trail) * block;
  return block * on * tail;
}

vec3 zoneFar(vec2 scr) {
  float t = uTime;
  vec3 col = mix(vec3(0.005, 0.012, 0.03), vec3(0.01, 0.025, 0.06), scr.y / 1080.0);
  // 网格
  vec2 g = vec2(scr.x + uCamX * 0.1, scr.y);
  vec2 gq = abs(fract(g / 48.0) - 0.5) * 48.0;
  float grid = (1.0 - smoothstep(0.0, 1.0, min(gq.x, gq.y))) * 0.5;
  col += vec3(0.02, 0.06, 0.12) * grid;

  float head2;
  float d2 = dataRain(scr, 0.18, 14.0, 90.0, 1.0, head2);
  col += vec3(0.04, 0.18, 0.4) * d2 * 0.6 + vec3(0.4, 0.7, 1.0) * head2 * 0.6;
  float head1;
  float d1 = dataRain(scr, 0.32, 22.0, 140.0, 5.0, head1);
  col += vec3(0.08, 0.35, 0.7) * d1 * 0.7 + vec3(0.7, 0.9, 1.0) * head1 * 0.9;

  // 数据环: 分段圆弧缓慢旋转
  float rx = scr.x + uCamX * 0.24;
  float rc = floor(rx / 1100.0);
  vec2 rp = vec2(rx - (rc + 0.5) * 1100.0, scr.y - 860.0);
  float r = length(rp);
  float ang = atan(rp.y, rp.x) + t * (0.2 + hash11(rc) * 0.3) * (hash11(rc * 3.0) > 0.5 ? 1.0 : -1.0);
  float seg = step(0.3, fract(ang / 6.2832 * 12.0));
  float ring = exp(-abs(r - 110.0) * 0.35) * seg + exp(-abs(r - 80.0) * 0.6) * step(0.6, fract(ang / 6.2832 * 40.0)) * 0.6;
  col += vec3(0.2, 0.55, 1.0) * ring * 0.35 * step(0.3, hash11(rc * 5.0));

  // 扫描带
  float scan = exp(-abs(fract(t * 0.12) * 1400.0 - 200.0 - scr.y) * 0.02);
  col += vec3(0.05, 0.15, 0.3) * scan * 0.4;
  // 玻璃后的冷雾
  col += vec3(0.03, 0.06, 0.1) * smoothstep(0.4, 0.8, fbm(vec2(scr.x + uCamX * 0.2 + t * 8.0, scr.y) * 0.004));
  return col;
}
`;
