import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "../props/propFactory";

/**
 * 培育舱: 白色底座 + 玻璃圆筒 + 顶盖, 舱内营养液里立着一株幼苗, 气泡不断上升。
 * 调查: 营养液亮起、气泡加速(0~0.35) → 玻璃筒降入底座(0.35~0.7) → 幼苗顶端的发光萌芽被取下(0.72);
 * 已搜索后营养液降低、光芒变暗。
 */
const INCUBATOR_GLSL = /* glsl */ `
const float IR = 44.0;
const float BASE_H = 34.0;
const float TOP_Y = 176.0;
const vec3 I_WHITE = vec3(0.76, 0.79, 0.8);
const vec3 I_FLUID = vec3(0.3, 0.95, 0.7);

float sleeveTop() {
  return mix(TOP_Y - 18.0, BASE_H + 6.0, smoothstep(0.35, 0.7, uAnim));
}

float propSdf(vec2 p) {
  float base = sdRoundBox(p - vec2(0.0, BASE_H * 0.5), vec2(IR + 10.0, BASE_H * 0.5), 6.0);
  float cap = sdRoundBox(p - vec2(0.0, TOP_Y - 6.0), vec2(IR + 6.0, 12.0), 6.0);
  float tube = sdBox(p - vec2(0.0, (BASE_H + TOP_Y) * 0.5), vec2(IR, (TOP_Y - BASE_H) * 0.5));
  return min(min(base, cap), tube);
}

/** 幼苗: 细茎 + 两对叶子 + 顶端发光的萌芽(取走后消失)。返回覆盖度, 输出颜色。 */
float sapling(vec2 p, out vec3 col, inout vec3 emit) {
  float sway = sin(uTime * 1.1 + p.y * 0.04) * 2.0 * (p.y - BASE_H) / 100.0;
  vec2 q = vec2(p.x - sway, p.y);
  float stem = fillAA(abs(q.x) - 1.8) * step(BASE_H, q.y) * step(q.y, 128.0);
  vec2 l1 = rot2(-0.9) * vec2(abs(q.x), q.y - 96.0);
  vec2 l2 = rot2(-1.1) * vec2(abs(q.x), q.y - 72.0);
  float leaves = max(fillAA(sdEllipse(l1 - vec2(0.0, 14.0), vec2(6.0, 15.0))), fillAA(sdEllipse(l2 - vec2(0.0, 11.0), vec2(5.0, 12.0))));
  float m = max(stem, leaves);
  col = mix(vec3(0.12, 0.3, 0.1), vec3(0.4, 0.66, 0.2), leaves * clamp((q.y - 60.0) / 60.0, 0.3, 1.0));
  float bud = length(q - vec2(0.0, 132.0)) - 6.0;
  float keep = 1.0 - smoothstep(0.7, 0.74, uAnim);
  float bm = fillAA(bud) * keep;
  col = mix(col, vec3(0.8, 1.0, 0.6), bm);
  emit += vec3(0.6, 1.0, 0.5) * (bm * 1.6 + exp(-max(bud, 0.0) / 8.0) * 0.6) * keep * (0.6 + 0.4 * sin(uTime * 3.0));
  return max(m, bm);
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.45;
  float glow = (0.35 + smoothstep(0.0, 0.35, uAnim) * 1.0) * (1.0 - uSearched * 0.6);
  float level = mix(128.0, 70.0, uSearched);
  float cx = p.x / (IR + 10.0);

  // 顶盖
  float cap = sdRoundBox(p - vec2(0.0, TOP_Y - 6.0), vec2(IR + 6.0, 12.0), 6.0);
  if (cap < 0.0) {
    vec3 col = I_WHITE * (0.95 + 0.1 * fbm3(p * 0.03));
    float ring = fillAA(abs(p.y - (TOP_Y - 14.0)) - 1.5);
    col = mix(col, vec3(0.8, 1.0, 1.0), ring);
    emit += vec3(0.25, 0.95, 1.0) * ring * 0.8;
    n = normalize(vec3(cx, 0.3, 1.0));
    return vec4(col, 1.0);
  }
  // 底座
  float base = sdRoundBox(p - vec2(0.0, BASE_H * 0.5), vec2(IR + 10.0, BASE_H * 0.5), 6.0);
  if (base < 0.0) {
    vec3 col = I_WHITE * (0.93 + 0.1 * fbm3(p * 0.03 + uPSeed));
    float strip = fillAA(abs(p.y - 24.0) - 1.4) * step(abs(p.x), IR - 4.0);
    col = mix(col, vec3(0.8, 1.0, 1.0), strip);
    emit += I_FLUID * strip * glow * 0.8;
    col = mix(col, vec3(0.1, 0.12, 0.13), fillAA(p.y - 6.0));
    n = normalize(vec3(cx, bevelH(base, 4.0) * 0.4, 1.0));
    return vec4(col, 1.0);
  }
  float inTube = step(abs(p.x), IR) * step(BASE_H, p.y) * step(p.y, TOP_Y - 18.0);
  if (inTube < 0.5) return vec4(0.0);

  // 舱内: 营养液 + 气泡 + 幼苗
  float sTop = sleeveTop();
  float glass = step(p.y, sTop);
  float fluid = step(p.y, level + sin(p.x * 0.12 + uTime * 2.0) * 1.5) * glass;
  vec3 scol;
  float sm = sapling(p, scol, emit);
  vec2 bc = vec2(floor((p.x + IR) / 9.0), 0.0);
  float speed = 30.0 + smoothstep(0.0, 0.35, uAnim) * 60.0;
  float by = mod(p.y - uTime * speed * (0.6 + hash12(bc) * 0.8) + hash12(bc + 3.0) * 200.0, 60.0);
  float bubble = fillAA(length(vec2(mod(p.x + IR, 9.0) - 4.5, by - 30.0)) - 1.6 - hash12(bc) * 1.2) * step(0.45, hash12(bc + 7.0)) * fluid;
  vec3 col = vec3(0.06, 0.12, 0.12);
  col = mix(col, I_FLUID * 0.4, fluid);
  emit += I_FLUID * fluid * glow * 0.35 * (0.7 + 0.3 * (p.y - BASE_H) / 100.0);
  col = mix(col, scol, sm);
  col = mix(col, vec3(0.8, 1.0, 0.9), bubble);
  emit += I_FLUID * bubble * glow;
  // 液面亮线
  emit += I_FLUID * exp(-abs(p.y - level) / 2.0) * glass * glow * 0.8;
  // 玻璃: 圆筒明暗 + 竖向高光; 筒已降下的部分透出后方
  float a = 1.0;
  if (glass > 0.5) {
    float hl = exp(-abs(cx + 0.45) * 24.0) + exp(-abs(cx - 0.7) * 40.0) * 0.5;
    col = mix(col, vec3(0.7, 0.9, 0.92), 0.12 + pow(abs(cx), 4.0) * 0.4);
    col += vec3(0.5) * hl * 0.5;
    gloss = 0.95;
    float rim = fillAA(abs(p.y - sTop) - 2.0);
    col = mix(col, I_WHITE, rim);
    a = max(max(fluid, sm), 0.3 + hl * 0.3 + rim + pow(abs(cx), 4.0) * 0.5);
  } else {
    a = sm;
    // 立柱: 筒降下后仍撑着顶盖的两根细杆
    float post = fillAA(abs(abs(p.x) - IR + 4.0) - 2.5);
    col = mix(col, I_WHITE, post);
    a = max(a, post);
  }
  n = normalize(vec3(cx * 0.8, 0.0, sqrt(max(1.0 - cx * cx, 0.1))));
  return vec4(col, a);
}
`;

export const INCUBATOR_SPEC: PropSpec = {
  bounds: { w: 220, h: 250, x0: -110, y0: -40 },
  glsl: INCUBATOR_GLSL,
  shadow: [60, 18],
  promptH: 210,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const fluid = new THREE.Color(0.45, 1, 0.75);
    if (!view.light && cur > 0.05) view.light = ctx.lights.addDynamic({ x: def.x, h: 100, z: def.z + 20, color: fluid, intensity: 0, radius: 340 });
    if (view.light) view.light.intensity = Math.min(1, cur / 0.35) * (cur >= 1 ? 0.45 : 1.1);
    const y = worldY(def.z);
    if (prev < 0.36 && cur >= 0.36) ctx.fx.spawn("glint", def.x, y + 40, 10, y - 4, new THREE.Color(0.6, 1.3, 1.4));
    if (prev < 0.72 && cur >= 0.72) ctx.fx.spawn("glint", def.x, y + 132, 26, y - 6, new THREE.Color(0.8, 1.6, 0.6));
  },
};
