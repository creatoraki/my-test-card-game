import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "./propFactory";

/**
 * 物资保险箱: 厚重钢箱、转盘锁、磨损漆面。
 * 调查: 转盘转动(0~0.26) → 箱门沿左侧铰链向外打开(0.26~0.62) → 箱内暖光溢出 → 光点浮起(由编排发射)。
 */
const SAFE_GLSL = /* glsl */ `
const float SW = 112.0;
const float SH = 118.0;
const float SD = 46.0;
const float HINGE = -50.0;
const float DOOR_W = 100.0;

float doorAngle() {
  return smoothstep(0.26, 0.62, uAnim) * 1.95;
}

float propSdf(vec2 p) {
  float body = sdBox(p - vec2(0.0, (SH + SD) * 0.5), vec2(SW * 0.5, (SH + SD) * 0.5));
  float dw = DOOR_W * cos(doorAngle());
  float door = sdBox(p - vec2(HINGE + dw * 0.5, 59.0), vec2(abs(dw) * 0.5 + 3.0, 53.0));
  return min(body, door);
}

vec3 safePaint(vec2 q, float edge) {
  vec3 base = mix(vec3(0.14, 0.19, 0.2), vec3(0.2, 0.17, 0.12), step(0.5, fract(uPSeed * 0.37)));
  return weather(base, q + uPSeed * 50.0, 1.1, 0.55, edge, uPSeed);
}

vec4 safeDoor(vec2 p, float c, float ang, out vec3 n, inout vec3 emit) {
  float u = (p.x - HINGE) / max(abs(c), 0.02);
  vec2 dq = vec2(u * sign(c) - DOOR_W * 0.5, p.y - 59.0);
  float edgeD = sdBox(dq, vec2(DOOR_W * 0.5, 53.0));
  float edge = clamp(-edgeD / 16.0, 0.0, 1.0);
  float h = bevelH(edgeD, 5.0) * 4.0;
  vec3 col;
  if (c > 0.0) {
    col = safePaint(dq, edge);
    // 转盘: 刻度环 + 旋钮, 随调查进度转动
    vec2 dp = dq - vec2(16.0, 6.0);
    float spin = smoothstep(0.0, 0.26, uAnim) * 9.0 + sin(uAnim * 60.0) * 0.05 * step(uAnim, 0.26);
    vec2 rp = rot2(spin) * dp;
    float dial = length(dp) - 17.0;
    float ticks = step(0.82, fract(atan(rp.y, rp.x) / 6.2832 * 24.0)) * fillAA(abs(length(dp) - 14.0) - 2.2);
    float knob = length(dp) - 8.0;
    float grip = step(0.5, fract(atan(rp.y, rp.x) / 6.2832 * 10.0)) * fillAA(abs(length(dp) - 7.0) - 1.2);
    col = mix(col, vec3(0.32, 0.32, 0.3), fillAA(dial));
    col = mix(col, vec3(0.08), ticks);
    col = mix(col, vec3(0.5, 0.48, 0.42) * (1.0 - grip * 0.4), fillAA(knob));
    h += bevelH(dial, 3.0) * 3.0 + bevelH(knob, 2.0) * 3.0;
    // 刻度零位
    float mark = fillAA(sdBox(dp - vec2(0.0, 20.0), vec2(1.2, 3.0)));
    col = mix(col, vec3(0.8, 0.2, 0.1), mark);
    // 三辐把手
    vec2 hp = dq - vec2(-18.0, 6.0);
    vec2 hr = rot2(smoothstep(0.2, 0.3, uAnim) * 0.8) * hp;
    float spokes = min(min(sdSegment(hr, vec2(0.0), vec2(0.0, 15.0)), sdSegment(hr, vec2(0.0), vec2(13.0, -7.5))), sdSegment(hr, vec2(0.0), vec2(-13.0, -7.5))) - 2.6;
    float hub = length(hp) - 5.0;
    float hm = fillAA(min(spokes, hub));
    col = mix(col, vec3(0.45, 0.42, 0.36), hm);
    h += hm * 4.0;
    // 黄色模板漆条纹 + 铆钉边
    float stripe = fillAA(abs(dq.y + 38.0) - 4.0) * step(abs(dq.x), 40.0);
    col = mix(col, C_HAZARD * 0.7, stripe * (1.0 - smoothstep(0.4, 0.6, fbm3(dq * 0.1))));
    float riv = rivets(dq + vec2(0.0, 1.5), vec2(12.0, 101.0), 1.8) * step(DOOR_W * 0.5 - 6.0, abs(dq.x) + 0.0);
    h += riv;
    n = bumpWall(h, 1.0);
    n = normalize(vec3(n.x * c - sin(ang) * n.z, n.y, n.z * c + n.x * sin(ang)));
  } else {
    // 门内侧: 衬板 + 锁舌机构
    col = vec3(0.09, 0.1, 0.1) * (0.8 + 0.3 * fbm3(dq * 0.1));
    float bolts = fillAA(sdBox(vec2(abs(dq.x) - 30.0, dq.y), vec2(3.0, 40.0)));
    col = mix(col, vec3(0.3, 0.28, 0.25), bolts);
    h += bolts * 3.0;
    n = bumpWall(h, 1.0);
    n = normalize(vec3(sin(ang) * 0.6 + n.x, n.y, abs(c) + 0.3));
  }
  return vec4(col, 1.0);
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.35;
  float ang = doorAngle();
  float c = cos(ang);
  float glowK = smoothstep(0.34, 0.72, uAnim) * (1.0 - uSearched * 0.65);
  vec3 warm = vec3(1.0, 0.68, 0.32);
  // 地面上的溢光
  vec2 sp = vec2(p.x / 80.0, (p.y + 6.0) / 18.0);
  emit += warm * exp(-dot(sp, sp) * 1.4) * glowK * 0.4 * step(p.y, 6.0);

  float dw = DOOR_W * c;
  float doorD = sdBox(p - vec2(HINGE + dw * 0.5, 59.0), vec2(max(abs(dw) * 0.5, 0.5), 53.0));
  if (doorD < 0.0) return safeDoor(p, c, ang, n, emit);
  // 门的厚度边
  float thick = sdBox(p - vec2(HINGE + dw, 59.0), vec2(3.0 * abs(sin(ang)) + 0.01, 53.0));
  if (thick < 0.0 && ang > 0.05) return vec4(vec3(0.2, 0.2, 0.19), 1.0);

  vec2 fuv;
  float face = boxFace(p, SW, SH, SD, fuv);
  if (face < 0.5) return vec4(0.0);
  float bodyD = sdBox(p - vec2(0.0, SH * 0.5), vec2(SW * 0.5, SH * 0.5));
  if (face > 1.5) {
    float topD = sdBox(fuv - vec2(0.0, SD * 0.5), vec2(SW * 0.5, SD * 0.5));
    vec3 col = safePaint(fuv * vec2(1.0, 2.0) + 40.0, clamp(-topD / 12.0, 0.0, 1.0)) * 1.15;
    col = mix(col, vec3(0.3, 0.29, 0.27), smoothstep(0.5, 0.8, fbm3(fuv * 0.06)) * 0.4);
    n = bumpFloor(bevelH(topD, 4.0) * 3.0, 1.0);
    gloss = 0.3;
    return vec4(col, 1.0);
  }
  float opening = sdBox(p - vec2(0.0, 59.0), vec2(48.0, 51.0));
  if (opening < 0.0) {
    // 箱内: 两层隔板、物资剪影、暖光
    float depth = clamp(-opening / 30.0, 0.0, 1.0);
    vec3 col = vec3(0.05, 0.04, 0.035) * (0.6 + depth);
    float shelf = fillAA(abs(p.y - 58.0) - 2.5);
    col = mix(col, vec3(0.2, 0.18, 0.15), shelf);
    float box1 = fillAA(sdRoundBox(p - vec2(-22.0, 72.0), vec2(14.0, 11.0), 2.0));
    float box2 = fillAA(sdRoundBox(p - vec2(4.0, 70.0), vec2(9.0, 9.0), 2.0));
    float can = fillAA(sdRoundBox(p - vec2(26.0, 20.0), vec2(8.0, 12.0), 3.0));
    col = mix(col, vec3(0.35, 0.28, 0.16), box1);
    col = mix(col, vec3(0.2, 0.3, 0.26), box2);
    col = mix(col, vec3(0.5, 0.12, 0.08), can);
    // 发光的物资核心(被取走后熄灭)
    float orb = length(p - vec2(-8.0, 28.0));
    float left = 1.0 - uSearched;
    emit += warm * (exp(-orb / 7.0) * 2.5 + exp(-orb / 30.0) * 0.6) * glowK * left;
    emit += warm * 0.35 * glowK * (1.0 - depth * 0.5);
    n = vec3(0.0, 0.0, 1.0);
    return vec4(col * (0.6 + glowK * 0.8), 1.0);
  }
  // 正面箱体: 倒角边框
  float edge = clamp(-bodyD / 10.0, 0.0, 1.0);
  vec3 col = safePaint(p, edge);
  float h = bevelH(bodyD, 6.0) * 5.0 - bevelH(-opening, 3.0) * 3.0;
  float foot = fillAA(sdBox(vec2(abs(p.x) - 46.0, p.y + 2.0), vec2(8.0, 4.0)));
  col = mix(col, vec3(0.05), foot);
  n = bumpWall(h, 1.0);
  return vec4(col, 1.0);
}
`;

export const SAFE_SPEC: PropSpec = {
  bounds: { w: 300, h: 260, x0: -170, y0: -40 },
  glsl: SAFE_GLSL,
  shadow: [74, 20],
  promptH: 190,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const warm = new THREE.Color(1, 0.62, 0.3);
    if (!view.light && cur > 0.3) view.light = ctx.lights.addDynamic({ x: def.x, h: 60, z: def.z + 30, color: warm, intensity: 0, radius: 420 });
    if (view.light) view.light.intensity = Math.min(1, Math.max(0, (cur - 0.34) / 0.3)) * (cur >= 1 ? 0.8 : 1.6);
    const y = worldY(def.z);
    if (prev < 0.62 && cur >= 0.62) ctx.fx.spawn("glint", def.x - 8, y + 40, 26, y - 6, warm);
    if (prev < 0.28 && cur >= 0.28) ctx.fx.spawn("dust", def.x - 40, y + 60, 10, y - 4);
  },
};
