import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "../props/propFactory";

/**
 * 种子保险柜: 白色圆角柜体、门上的叶形徽标、顶部状态灯带。
 * 调查: 徽标被一圈扫描光点亮(0~0.3) → 柜门上滑收进顶箱(0.3~0.65) → 露出三层发光的种子试管,
 * 中间一格被取走(光点浮起由编排发射)。
 */
const SEED_VAULT_GLSL = /* glsl */ `
const float VW = 116.0;
const float VH = 150.0;
const float VD = 34.0;
const vec3 V_WHITE = vec3(0.76, 0.79, 0.8);
const vec3 V_CYAN = vec3(0.25, 0.95, 1.0);
const vec3 V_SEED = vec3(0.45, 1.0, 0.55);

float doorLift() {
  return smoothstep(0.3, 0.65, uAnim) * 104.0;
}

float vLeaf(vec2 q, float len, float wid) {
  float t = clamp(q.y / len, 0.0, 1.0);
  float w = wid * pow(sin(3.14159 * t), 0.7);
  return max(abs(q.x) - w, max(-q.y, q.y - len)) * 0.8;
}

float vEmblem(vec2 q, float r) {
  vec2 b = q + vec2(0.0, r * 0.55);
  float mid = vLeaf(b, r * 1.3, r * 0.26);
  float side = min(vLeaf(rot2(0.8) * b, r, r * 0.24), vLeaf(rot2(-0.8) * b, r, r * 0.24));
  float ring = max(abs(length(q) - r) - r * 0.08, q.y + r * 0.05);
  return min(min(mid, side), ring);
}

float propSdf(vec2 p) {
  return sdBox(p - vec2(0.0, (VH + VD) * 0.5), vec2(VW * 0.5, (VH + VD) * 0.5));
}

/** 柜内: 三层隔板上的种子试管, 取走后中间一格空着。 */
vec4 vaultInside(vec2 p, inout vec3 emit, float glowK) {
  vec3 col = vec3(0.04, 0.06, 0.07);
  float shelfY = floor((p.y - 30.0) / 34.0);
  float sy = mod(p.y - 30.0, 34.0);
  float shelf = fillAA(abs(sy - 1.5) - 1.5);
  col = mix(col, vec3(0.5, 0.55, 0.56), shelf);
  float slot = floor((p.x + 44.0) / 14.0);
  float sx = mod(p.x + 44.0, 14.0) - 7.0;
  float taken = uSearched * step(abs(slot - 3.0), 0.5) * step(abs(shelfY - 1.0), 0.5);
  float tube = sdRoundBox(vec2(sx, sy - 16.0), vec2(4.0, 11.0), 3.5);
  float inside = step(0.0, p.y - 30.0) * step(p.y, 132.0) * step(abs(p.x), 44.0);
  float tm = fillAA(tube) * inside * (1.0 - taken);
  float liquid = fillAA(tube + 1.2) * step(sy, 20.0 + hash12(vec2(slot, shelfY)) * 4.0) * inside * (1.0 - taken);
  vec3 hue = mix(V_SEED, vec3(0.5, 0.95, 1.0), hash12(vec2(slot * 3.0, shelfY)));
  col = mix(col, vec3(0.6, 0.7, 0.72), tm * 0.5);
  col = mix(col, hue * 0.5, liquid);
  emit += hue * liquid * (0.35 + glowK * 1.4);
  emit += V_SEED * exp(-abs(sy - 18.0) / 14.0) * inside * glowK * 0.12;
  return vec4(col, 1.0);
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.45;
  float lift = doorLift();
  float glowK = smoothstep(0.35, 0.7, uAnim) * (1.0 - uSearched * 0.6);
  // 地面上的溢光
  vec2 gp = vec2(p.x / 70.0, (p.y + 6.0) / 16.0);
  emit += V_SEED * exp(-dot(gp, gp) * 1.5) * glowK * 0.35 * step(p.y, 6.0);

  vec2 fuv;
  float face = boxFace(p, VW, VH, VD, fuv);
  if (face < 0.5) return vec4(0.0);
  if (face > 1.5) {
    float topD = sdBox(fuv - vec2(0.0, VD * 0.5), vec2(VW * 0.5, VD * 0.5));
    vec3 col = V_WHITE * (0.95 + 0.1 * fbm3(fuv * 0.05 + uPSeed));
    // 顶面状态灯带
    float strip = fillAA(abs(fuv.y - 6.0) - 1.4) * step(abs(fuv.x), VW * 0.5 - 8.0);
    col = mix(col, vec3(0.8, 1.0, 1.0), strip);
    emit += V_CYAN * strip * (0.8 + 0.4 * sin(uTime * 2.0));
    n = bumpFloor(bevelH(topD, 5.0) * 3.0, 1.0);
    return vec4(col, 1.0);
  }
  float bodyD = sdRoundBox(p - vec2(0.0, VH * 0.5), vec2(VW * 0.5, VH * 0.5), 8.0);
  float opening = sdBox(p - vec2(0.0, 81.0), vec2(46.0, 53.0));
  float h = bevelH(bodyD, 6.0) * 5.0;
  vec3 col = V_WHITE * (0.93 + 0.12 * fbm3(p * 0.02 + uPSeed));
  if (opening < 0.0) {
    // 门: 圆角白板 + 徽标, 上滑后露出柜内
    vec2 dq = p - vec2(0.0, 81.0 + lift);
    float door = sdRoundBox(dq, vec2(45.0, 52.0), 5.0);
    if (door < 0.0) {
      col = V_WHITE * 1.02;
      float em = vEmblem(dq - vec2(0.0, 6.0), 20.0);
      float emm = fillAA(em);
      float scan = smoothstep(0.0, 0.3, uAnim);
      float ringR = scan * 34.0;
      float sweep = exp(-abs(length(dq - vec2(0.0, 6.0)) - ringR) / 3.0) * step(0.01, uAnim) * (1.0 - smoothstep(0.28, 0.34, uAnim));
      col = mix(col, vec3(0.2, 0.3, 0.32), emm);
      emit += V_CYAN * emm * (0.25 + scan * 1.6) * (1.0 - uSearched * 0.7);
      emit += V_CYAN * sweep * 1.2;
      float grip = fillAA(sdRoundBox(dq - vec2(0.0, -38.0), vec2(18.0, 2.5), 2.0));
      col = mix(col, vec3(0.35, 0.4, 0.42), grip);
      h += bevelH(door, 3.0) * 3.0 + emm * 1.5 - grip;
      n = bumpWall(h, 1.0);
      return vec4(col, 1.0);
    }
    vec4 inside = vaultInside(p, emit, glowK);
    n = vec3(0.0, 0.0, 1.0);
    gloss = 0.7;
    return inside;
  }
  // 门框凹槽与侧边分缝
  float frame = abs(opening) - 3.0;
  col = mix(col, col * 0.6, fillAA(frame));
  float seam = fillAA(abs(abs(p.x) - VW * 0.5 + 10.0) - 0.8);
  col *= 1.0 - seam * 0.25;
  // 踢脚
  col = mix(col, vec3(0.1, 0.12, 0.13), fillAA(p.y - 9.0));
  h += -bevelH(-opening, 3.0) * 3.0;
  n = bumpWall(h, 1.0);
  return vec4(col, 1.0);
}
`;

export const SEED_VAULT_SPEC: PropSpec = {
  bounds: { w: 260, h: 240, x0: -130, y0: -40 },
  glsl: SEED_VAULT_GLSL,
  shadow: [70, 20],
  promptH: 220,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const green = new THREE.Color(0.5, 1, 0.6);
    if (!view.light && cur > 0.32) view.light = ctx.lights.addDynamic({ x: def.x, h: 80, z: def.z + 30, color: green, intensity: 0, radius: 360 });
    if (view.light) view.light.intensity = Math.min(1, Math.max(0, (cur - 0.35) / 0.3)) * (cur >= 1 ? 0.5 : 1.2);
    const y = worldY(def.z);
    if (prev < 0.3 && cur >= 0.3) ctx.fx.spawn("glint", def.x, y + 90, 10, y - 6, new THREE.Color(0.4, 1.4, 1.6));
    if (prev < 0.66 && cur >= 0.66) ctx.fx.spawn("glint", def.x, y + 80, 24, y - 6, green);
  },
};
