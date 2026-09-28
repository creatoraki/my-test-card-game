/**
 * 传送门着色器公共片段：噪声、SDF、固定宽度抗锯齿与预乘合成。
 * 约定：坐标为设计 px；颜色一律预乘 alpha；循环只用常量上界，循环内不使用 fwidth/dFdx。
 */
export const GLSL_COMMON = /* glsl */ `
#define PI 3.14159265

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}

/** d<0 为内部；过渡宽度为一个屏幕像素(uAA 由宿主按像素比传入)。 */
float fillAA(float d) {
  return clamp(0.5 - d / uAA, 0.0, 1.0);
}

/** 椭圆近似距离(按梯度归一化)。 */
float sdEllipse(vec2 p, vec2 r) {
  float e = length(p / r);
  vec2 g = p / (r * r) / max(e, 0.0001);
  return (e - 1.0) / max(length(g), 0.0001);
}

/** 不透明叠加一层颜色。 */
void paint(inout vec4 c, vec3 rgb, float a) {
  c = vec4(rgb, 1.0) * a + c * (1.0 - a);
}

/** 自发光叠加：颜色直接相加，alpha 至少提升到新增亮度，保证在透明背景上也能看见光晕。 */
void emit(inout vec4 c, vec3 rgb, float k) {
  vec3 add = rgb * max(k, 0.0);
  c.rgb += add;
  c.a = max(c.a, max(add.r, max(add.g, add.b)));
}

/** 输出前修正为合法的预乘颜色。 */
vec4 finalize(vec4 c) {
  c.a = clamp(max(c.a, max(c.r, max(c.g, c.b))), 0.0, 1.0);
  c.rgb = min(c.rgb, vec3(c.a));
  return c;
}
`;
