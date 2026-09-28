// 2D 有向距离场与抗锯齿填充工具。所有形体都以设计 px 为单位。

export const SDF_GLSL = /* glsl */ `
mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  return sdBox(p, b - r) - r;
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdEllipse(vec2 p, vec2 r) {
  float k = length(p / r);
  return (k - 1.0) * min(r.x, r.y);
}

/** 梯形: 底半宽 r1(y = -h), 顶半宽 r2(y = +h)。 */
float sdTrapezoid(vec2 p, float r1, float r2, float h) {
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  p.x = abs(p.x);
  vec2 ca = vec2(p.x - min(p.x, (p.y < 0.0) ? r1 : r2), abs(p.y) - h);
  vec2 cb = p - k1 + k2 * clamp(dot(k1 - p, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}

/**
 * 抗锯齿宽度。烘焙材质定义 FIXED_AA, 用固定宽度(0.75 / 烘焙密度)代替屏幕导数:
 * 分支 / 循环里不出现梯度指令, D3D 编译器就不必展开循环、展平分支, 编译与烘焙都快得多。
 */
#ifdef FIXED_AA
uniform float uAAWidth;
float aaWidth(float d) {
  return uAAWidth;
}
#else
float aaWidth(float d) {
  return fwidth(d) * 0.75 + 1e-4;
}
#endif

/** 抗锯齿填充: d < 0 为内部。 */
float fillAA(float d) {
  float w = aaWidth(d);
  return 1.0 - smoothstep(-w, w, d);
}

/** 柔边填充: soft 为羽化宽度(px)。 */
float fillSoft(float d, float soft) {
  return 1.0 - smoothstep(-soft, soft, d);
}

/** 描边: 距离 |d| < w/2 的带状区域。 */
float strokeAA(float d, float w) {
  return fillAA(abs(d) - w * 0.5);
}

/** 斜切高度: 从边缘向内 width px 由 0 升到 1, 配合 bumpNormal 得到倒角。 */
float bevelH(float d, float width) {
  float x = clamp(-d / width, 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

/**
 * 由高度场的屏幕导数求法线。坐标约定 (x, 高度 h, 纵深 z):
 * 立面(墙、物体正面)基础法线为 (0, 0, 1), 地面为 (0, 1, 0)。
 */
vec3 bumpWall(float height, float strength) {
  vec2 g = vec2(dFdx(height), dFdy(height)) * strength;
  return normalize(vec3(-g.x, -g.y, 1.0));
}

vec3 bumpFloor(float height, float strength) {
  vec2 g = vec2(dFdx(height), dFdy(height)) * strength;
  // 屏幕向上 = 纵深变远(z 减小)
  return normalize(vec3(-g.x, 1.0, g.y));
}
`;
