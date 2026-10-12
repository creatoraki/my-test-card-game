/**
 * 魔法攻击演示的公共着色器片段(拼在 GLSL_COMMON + GLSL_HIT_COMMON 之后)。
 * 坐标约定沿用命中特效: q 以画布中心(目标中心)为原点、y 朝上、单位设计 px; t = hitTime() 以爆点为零点。
 */
export const GLSL_MAGIC_COMMON = /* glsl */ `
/** 0~1 区间进度。 */
float prog(float t, float a, float b) {
  return clamp((t - a) / (b - a), 0.0, 1.0);
}

/** 在 [a, b] 内淡入、[c, d] 内淡出的窗口。 */
float window4(float t, float a, float b, float c, float d) {
  return smoothstep(a, b, t) * (1.0 - smoothstep(c, d, t));
}

/** 五角星 SDF(r 外接半径, rf 内凹比例)。 */
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

/** 六芒星 SDF。 */
float sdHexagram(vec2 p, float r) {
  const vec4 k = vec4(-0.5, 0.8660254038, 0.5773502692, 1.7320508076);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= 2.0 * min(dot(k.yx, p), 0.0) * k.yx;
  p -= vec2(clamp(p.x, r * k.z, r * k.w), r);
  return length(p) * sign(p.y);
}

/** 两端尖的杏仁形(横向): 半宽 w、半高 h。 */
float sdAlmond(vec2 p, float w, float h) {
  h = max(h, 0.5);
  float r = (w * w / h + h) * 0.5;
  float d = r - h;
  p = abs(p.yx);
  float b = w;
  return ((p.y - b) * d > p.x * b) ? length(p - vec2(0.0, b)) : length(p - vec2(-d, 0.0)) - r;
}

/** 自原点沿 a 方向伸出的细长光芒(两端对称)。 */
float rayAt(vec2 q, float a, float len, float w) {
  vec2 r = rot(q, -a);
  return glowOf(abs(r.y), w) * (1.0 - smoothstep(0.0, len, abs(r.x)));
}

/** 四芒小星闪: 十字细芒 + 圆心柔光。 */
float twinkle(vec2 p, float size) {
  vec2 a = abs(p);
  float arms = glowOf(a.y, 0.7) * (1.0 - smoothstep(0.0, size, a.x))
              + glowOf(a.x, 0.7) * (1.0 - smoothstep(0.0, size, a.y));
  return arms * 0.6 + glowOf(length(p), size * 0.12);
}

/** 画布边缘 48px 内渐隐, 大光晕不在矩形边界切出硬边。 */
float edgeFade(vec2 q) {
  return smoothstep(0.0, 48.0, min(uSize.x * 0.5 - abs(q.x), uSize.y * 0.5 - abs(q.y)));
}
`;
