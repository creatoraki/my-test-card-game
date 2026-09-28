import type { DecorKind } from "../../types";

/** 生态方舟装饰物的 KIND 编号(与废弃楼层装饰各自独立编译)。 */
export const ARK_DECOR_KIND: Partial<Record<DecorKind, number>> = { planter: 0, fern: 1, bench: 2, palmPot: 3, mossRock: 4 };

/** 各 KIND 的面片范围 [宽, 高, 左下角 x, 左下角 y]。 */
export const ARK_DECOR_BOUNDS: Record<number, readonly [number, number, number, number]> = {
  0: [260, 170, -130, -20],
  1: [260, 150, -130, -20],
  2: [200, 130, -100, -20],
  3: [300, 270, -150, -20],
  4: [190, 110, -95, -20],
};

/**
 * 生态方舟装饰物(静态烘焙): 白色长花箱、蕨叶丛、长椅、大叶盆栽、苔石。
 * 依赖 PROP_COMMON(boxFace、uPSeed); 光照由烘焙后的实时材质统一处理。
 */
export const ARK_DECOR_GLSL = /* glsl */ `
const vec3 D_WHITE = vec3(0.74, 0.77, 0.78);
const vec3 D_SLATE = vec3(0.1, 0.13, 0.15);
const vec3 D_LEAF_DARK = vec3(0.025, 0.085, 0.05);
const vec3 D_LEAF = vec3(0.1, 0.27, 0.085);
const vec3 D_LEAF_LIGHT = vec3(0.4, 0.6, 0.17);
const vec3 D_MOSS = vec3(0.2, 0.36, 0.1);

/** 叶片(近似距离): 叶柄在原点沿 +y 伸出 len, 最宽 wid。 */
float dLeaf(vec2 q, float len, float wid) {
  float t = clamp(q.y / len, 0.0, 1.0);
  float w = wid * pow(sin(3.14159 * t), 0.7);
  return max(abs(q.x) - w, max(-q.y, q.y - len)) * 0.8;
}

/** 叶团: 中心 c、半径 r, 表面由 Voronoi 叶片组成, 上亮下暗。d 输出距离。 */
vec4 leafMass(vec2 p, vec2 c, vec2 r, float seed, inout vec3 n, out float d) {
  vec2 q = (p - c) / r;
  d = (length(q) - 1.0 + (fbm3(p * 0.045 + seed) - 0.5) * 0.6) * min(r.x, r.y);
  if (d > 0.0) return vec4(0.0);
  vec3 v = voronoi(p * vec2(0.09, 0.12) + seed * 5.0);
  float leaf = 1.0 - smoothstep(0.0, 0.85, v.x);
  float vein = 1.0 - smoothstep(0.0, 0.08, v.y);
  float up = clamp(q.y * 0.5 + 0.55, 0.0, 1.0);
  vec3 base = mix(D_LEAF_DARK, D_LEAF, clamp(v.z * 0.5 + up * 0.7, 0.0, 1.0));
  vec3 col = mix(base, D_LEAF_LIGHT, leaf * up * up * 0.75) * (1.0 - vein * 0.5);
  // 零星小花
  vec2 fc = floor(p / 8.0);
  float flower = step(0.95, hash12(fc + seed)) * fillAA(length(mod(p, 8.0) - 4.0) - 2.3) * step(0.4, up);
  col = mix(col, mix(vec3(0.95, 0.92, 0.86), vec3(0.95, 0.52, 0.6), hash12(fc * 1.7)), flower);
  n = bumpWall(leaf * 5.0 - vein * 2.0 + flower * 2.0, 1.0);
  return vec4(col, 1.0);
}

/** 蕨叶丛: 9 片下弯的羽状叶。rib 输出到叶轴距离, tipK 输出沿叶长的位置。 */
float fernSdf(vec2 p, out float rib, out float tipK) {
  float best = 1e3;
  rib = 0.0;
  tipK = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float a = mix(-1.25, 1.25, fi / 8.0) + (hash11(fi + uPSeed) - 0.5) * 0.2;
    float len = 72.0 + hash11(fi * 3.1 + uPSeed) * 40.0 - abs(a) * 14.0;
    vec2 q = rot2(a) * p;
    q.x -= q.y * q.y / len * 0.45 * sign(a);
    float t = clamp(q.y / len, 0.0, 1.0);
    float w = 17.0 * sin(3.14159 * pow(t, 0.8));
    float comb = abs(fract(q.y / 7.0) - 0.5) * 2.0;
    float d = max(abs(q.x) - w * (0.5 + 0.5 * comb), max(-q.y, q.y - len));
    if (d < best) {
      best = d;
      rib = abs(q.x);
      tipK = t;
    }
  }
  return best;
}

/** 大叶(龟背竹式): 带几道裂口的宽叶。 */
float bigLeafSdf(vec2 q, float len, float wid) {
  float d = dLeaf(q, len, wid);
  float slit = abs(fract(q.y / 22.0 + 0.3) - 0.5) * 22.0 - 1.6;
  slit = max(slit, -(abs(q.x) - wid * 0.35));
  return max(d, -slit * step(0.2, q.y / len) * step(q.y / len, 0.85));
}

/** 大叶盆栽的五片叶子。rib 输出到叶脉距离, up 输出沿叶长的位置。 */
float palmLeaves(vec2 p, out float rib, out float up) {
  float best = 1e3;
  rib = 0.0;
  up = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float a = mix(-0.95, 0.95, fi / 4.0) + (hash11(fi * 2.3 + uPSeed) - 0.5) * 0.25;
    vec2 q = rot2(a) * (p - vec2(0.0, 66.0));
    float len = 120.0 + hash11(fi * 1.7 + uPSeed) * 40.0 - abs(a) * 20.0;
    q.x -= q.y * q.y / len * 0.3 * sign(a);
    float d = bigLeafSdf(q, len, len * 0.3);
    if (d < best) {
      best = d;
      rib = abs(q.x);
      up = q.y / len;
    }
  }
  return best;
}

float rockSdf(vec2 p) {
  return sdEllipse(p - vec2(0.0, 34.0), vec2(66.0, 40.0)) + (fbm3(p * 0.04 + uPSeed) - 0.5) * 16.0;
}

float propSdf(vec2 p) {
#if KIND == 0
  float box = sdBox(p - vec2(0.0, 36.0), vec2(100.0, 36.0));
  float bush = sdEllipse(p - vec2(0.0, 90.0), vec2(104.0, 44.0)) + (fbm3(p * 0.045 + uPSeed) - 0.5) * 16.0;
  return min(box, bush);
#elif KIND == 1
  float rib;
  float tipK;
  return fernSdf(p, rib, tipK);
#elif KIND == 2
  return sdBox(p - vec2(0.0, 50.0), vec2(80.0, 50.0));
#elif KIND == 3
  float rib;
  float up;
  return min(sdTrapezoid(p - vec2(0.0, 35.0), 24.0, 30.0, 35.0), palmLeaves(p, rib, up));
#else
  return rockSdf(p);
#endif
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.25;
  float seed = uPSeed;
#if KIND == 0
  // 长花箱: 白色箱体 + 深色腰线, 顶面是土, 上面长满叶团
  float ld;
  vec4 leaves = leafMass(p, vec2(0.0, 90.0), vec2(104.0, 44.0), seed, n, ld);
  if (ld < 0.0) return leaves;
  vec2 fuv;
  float face = boxFace(p, 200.0, 46.0, 26.0, fuv);
  if (face < 0.5) return vec4(0.0);
  if (face > 1.5) {
    n = bumpFloor(vnoise(fuv * 0.3) * 2.0, 1.0);
    return vec4(vec3(0.12, 0.08, 0.05) * (0.8 + 0.4 * vnoise(fuv * 0.2)), 1.0);
  }
  float edge = sdBox(p - vec2(0.0, 23.0), vec2(100.0, 23.0));
  vec3 col = D_WHITE * (0.93 + 0.12 * fbm3(p * 0.02 + seed));
  float band = fillAA(abs(p.y - 34.0) - 3.0);
  col = mix(col, D_SLATE * 1.5, band);
  col = mix(col, col * 0.5, fillAA(p.y - 4.0));
  n = bumpWall(bevelH(edge, 5.0) * 4.0 - band, 1.0);
  gloss = 0.4;
  return vec4(col, 1.0);
#elif KIND == 1
  float rib;
  float tipK;
  float d = fernSdf(p, rib, tipK);
  if (d > 0.0) return vec4(0.0);
  float midrib = 1.0 - smoothstep(0.6, 1.6, rib);
  vec3 col = mix(D_LEAF_DARK * 1.3, mix(D_LEAF, D_LEAF_LIGHT, 0.55), tipK * 0.8 + clamp(-d / 6.0, 0.0, 1.0) * 0.3);
  col *= 1.0 - midrib * 0.45;
  n = bumpWall(clamp(-d, 0.0, 4.0) - midrib * 2.0, 1.0);
  return vec4(col, 1.0);
#elif KIND == 2
  // 长椅: 白色侧板腿 + 木条座面与靠背
  float legs = sdBox(vec2(abs(p.x) - 62.0, p.y - 15.0), vec2(7.0, 15.0));
  if (legs < 0.0) {
    n = bumpWall(bevelH(legs, 3.0) * 3.0, 1.0);
    return vec4(D_WHITE * 0.95, 1.0);
  }
  vec3 wood = vec3(0.46, 0.31, 0.18);
  vec2 fuv;
  float face = boxFace(p - vec2(0.0, 30.0), 150.0, 10.0, 28.0, fuv);
  if (face > 1.5) {
    float slat = fillAA(abs(mod(fuv.y, 7.0) - 3.5) - 0.8);
    vec3 col = wood * (0.85 + 0.25 * vnoise(vec2(fuv.x * 0.05, fuv.y))) * (1.0 - slat * 0.6);
    n = bumpFloor(-slat, 1.0);
    gloss = 0.35;
    return vec4(col, 1.0);
  }
  if (face > 0.5) {
    n = vec3(0.0, -0.2, 1.0);
    return vec4(D_WHITE * 0.9, 1.0);
  }
  float back = sdBox(p - vec2(0.0, 84.0), vec2(72.0, 14.0));
  float frame = sdBox(vec2(abs(p.x) - 68.0, p.y - 76.0), vec2(4.0, 22.0));
  if (frame < 0.0) {
    n = bumpWall(bevelH(frame, 2.0) * 2.0, 1.0);
    return vec4(D_WHITE, 1.0);
  }
  if (back < 0.0) {
    float sd = abs(mod(p.y - 70.0, 9.0) - 4.5) - 3.5;
    if (sd > 0.0) return vec4(0.0);
    vec3 col = wood * (0.85 + 0.25 * vnoise(vec2(p.x * 0.05, p.y)));
    n = bumpWall(bevelH(sd, 2.0) * 2.0, 1.0);
    return vec4(col, 1.0);
  }
  return vec4(0.0);
#elif KIND == 3
  // 大叶盆栽: 白色锥形花盆 + 五片带裂口的大叶
  float rib;
  float up;
  float ld = palmLeaves(p, rib, up);
  if (ld < 0.0) {
    vec3 col = mix(D_LEAF_DARK * 1.2, D_LEAF * 1.3, clamp(up * 0.7 + clamp(-ld / 10.0, 0.0, 1.0) * 0.5, 0.0, 1.0));
    float vein = 1.0 - smoothstep(0.8, 2.0, rib);
    col = mix(col, D_LEAF_LIGHT * 0.9, vein * 0.5);
    n = bumpWall(clamp(-ld, 0.0, 5.0) * 0.8 + vein * 1.5, 1.0);
    gloss = 0.45;
    return vec4(col, 1.0);
  }
  float stem = fillAA(abs(p.x) - 3.0) * step(60.0, p.y) * step(p.y, 80.0);
  if (stem > 0.5) return vec4(D_LEAF_DARK * 1.5, 1.0);
  float pot = sdTrapezoid(p - vec2(0.0, 35.0), 24.0, 30.0, 35.0);
  if (pot > 0.0) return vec4(0.0);
  float cx = p.x / 30.0;
  vec3 col = D_WHITE * (0.95 + 0.1 * fbm3(p * 0.03 + seed));
  col = mix(col, D_SLATE * 1.6, fillAA(abs(p.y - 62.0) - 4.0));
  n = normalize(vec3(cx * 0.9, 0.0, sqrt(max(1.0 - cx * cx, 0.1))));
  gloss = 0.45;
  return vec4(col, 1.0);
#else
  // 苔石: 圆润岩块, 顶部覆盖苔藓
  float d = rockSdf(p);
  if (d > 0.0) return vec4(0.0);
  vec3 v = voronoi(p * 0.06 + seed);
  float facet = smoothstep(0.0, 0.15, v.y);
  vec3 col = mix(vec3(0.34, 0.35, 0.32), vec3(0.56, 0.55, 0.5), v.z) * (0.7 + 0.3 * facet);
  float moss = smoothstep(0.45, 0.6, fbm3(p * 0.05 + seed) + (p.y - 30.0) / 70.0);
  col = mix(col, D_MOSS * (0.8 + 0.4 * vnoise(p * 0.3)), moss);
  n = bumpWall(facet * 4.0 + (1.0 - smoothstep(-30.0, 0.0, d)) * 6.0 + moss * 2.0, 1.0);
  return vec4(col, 1.0);
#endif
}
`;
