// 程序化噪声: 哈希、值噪声、分形叠加、脊状噪声、Voronoi(含边界距离, 用于裂缝与瓷砖)。

export const NOISE_GLSL = /* glsl */ `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 FBM_ROT = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = FBM_ROT * p * 2.03 + 17.1;
    a *= 0.5;
  }
  return s / 0.96875;
}

float fbm3(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * vnoise(p);
    p = FBM_ROT * p * 2.07 + 9.3;
    a *= 0.5;
  }
  return s / 0.875;
}

float ridged(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(vnoise(p) * 2.0 - 1.0);
    s += a * n * n;
    p = FBM_ROT * p * 2.1 + 5.7;
    a *= 0.5;
  }
  return s / 0.9375;
}

/** Voronoi: x = 到最近格点距离, y = 到格子边界距离, z = 格子哈希。 */
vec3 voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  vec2 mg = vec2(0.0);
  vec2 mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float edge = 8.0;
  for (int j = -2; j <= 2; j++)
  for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) edge = min(edge, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(sqrt(md), edge, hash12(n + mg));
}

/** 只求到最近格点距离的 Voronoi(3×3 邻域), 比完整版便宜得多, 用于每帧的焦散。 */
float voronoiF1(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float md = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash22(n + g) - f;
    md = min(md, dot(r, r));
  }
  return sqrt(md);
}

/** 流动噪声: 用于烟雾、雾气、腐化。 */
float flowNoise(vec2 p, float t) {
  vec2 q = vec2(fbm3(p + vec2(0.0, t * 0.35)), fbm3(p + vec2(5.2, -t * 0.28)));
  return fbm(p + q * 1.6 + vec2(t * 0.12, 0.0));
}
`;
