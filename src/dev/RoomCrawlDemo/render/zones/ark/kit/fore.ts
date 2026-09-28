// 生态方舟前景层(视差 1.3)共用: 近景叶丛与垂藤剪影。返回值为预乘颜色, 不参与打光,
// 日光下近景是逆光的深绿剪影, 只在上缘带一点透光的黄绿。

export const ARK_FORE_GLSL = /* glsl */ `
const vec3 C_FORE_LEAF = vec3(0.012, 0.035, 0.02);
const vec3 C_FORE_RIM = vec3(0.09, 0.2, 0.06);

/** 叶片(近似距离): 叶柄在原点沿 +y 伸出 len, 最宽 wid。 */
float foreLeaf(vec2 q, float len, float wid) {
  float t = clamp(q.y / len, 0.0, 1.0);
  float w = wid * pow(sin(3.14159 * t), 0.7);
  return max(abs(q.x) - w, max(-q.y, q.y - len)) * 0.8;
}

/**
 * 扇形叶丛: 从 base 向 dir 方向(1 = 向上, -1 = 下垂)展开 7 片叶子, 叶片随长度下弯。
 * 返回覆盖度; shade 输出 0~1(叶脉暗、上缘透光亮)。
 */
float foreFrond(vec2 p, vec2 base, float size, float spread, float dir, float seed, out float shade) {
  float m = 0.0;
  shade = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float fan = mix(-spread, spread, (fi + 0.5) / 7.0) + (hash11(fi * 3.7 + seed) - 0.5) * 0.35;
    vec2 q = rot2(dir < 0.0 ? fan + 3.14159 : fan) * (p - base);
    float len = size * (0.65 + 0.45 * hash11(fi * 1.9 + seed));
    // 叶尖受重力下弯: 上举的叶子向外弯, 下垂的叶子向内收
    q.x -= q.y * q.y / len * 0.35 * sign(fan) * dir;
    float d = foreLeaf(q, len, len * 0.2);
    float k = 1.0 - smoothstep(-1.5, 1.5, d);
    float rib = 1.0 - smoothstep(0.6, 1.8, abs(q.x));
    float edge = 1.0 - smoothstep(0.0, 6.0, -d);
    float sh = clamp(edge * 0.9 - rib * 0.5 + 0.2, 0.0, 1.0);
    shade = mix(shade, sh, k);
    m = max(m, k);
  }
  return m;
}

/** 前景垂藤: 从屏幕顶 top 往下垂, 每 pitch 一列, 长度随机。返回覆盖度。 */
float foreVines(vec2 scr, float fx, float maxLen, float pitch, float seed) {
  float cell = floor(fx / pitch);
  float len = maxLen * (0.3 + 0.7 * hash11(cell * 2.9 + seed)) * step(0.35, hash11(cell * 1.3 + seed));
  float y = 1080.0 - scr.y;
  float sway = sin(uTime * 0.7 + cell) * 6.0 * clamp(y / maxLen, 0.0, 1.0);
  float u = fx - (cell + 0.5) * pitch - sway;
  float stem = 1.0 - smoothstep(1.5, 3.0, abs(u));
  float seg = floor(y / 22.0);
  float side = mod(seg, 2.0) * 2.0 - 1.0;
  vec2 lq = rot2(side * 0.6) * vec2(u - side * 9.0, mod(y, 22.0) - 11.0);
  float leaf = 1.0 - smoothstep(-1.0, 1.0, sdEllipse(lq, vec2(10.0, 5.0)));
  return max(stem, leaf) * step(y, len);
}
`;
