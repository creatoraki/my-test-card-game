import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "./propFactory";

/**
 * 故障售货机: 碎玻璃橱窗、货架与罐子剪影、闪烁小屏、按键、出货口。
 * 调查: 屏幕乱码狂闪(0~0.45) → 罐子从出货口弹出并在地上弹跳(0.45~0.9) → 电火花(由编排发射)。
 */
const VENDING_GLSL = /* glsl */ `
const float VW = 120.0;
const float VH = 226.0;
const float VD = 56.0;

/** 罐子弹出轨迹: 返回罐子中心(本地 px), 以及是否可见。 */
vec2 canPath(float k) {
  float t = clamp((k - 0.45) / 0.45, 0.0, 1.0);
  float x = 10.0 + t * 92.0;
  float bounce = abs(sin(t * 3.14159 * 3.0)) * exp(-t * 2.6) * 60.0;
  float y = mix(34.0, -14.0, smoothstep(0.0, 0.18, t)) + bounce;
  return vec2(x, y);
}

float propSdf(vec2 p) {
  float body = sdBox(p - vec2(0.0, (VH + VD) * 0.5), vec2(VW * 0.5, (VH + VD) * 0.5));
  vec2 c = canPath(uAnim);
  float can = sdRoundBox(p - c, vec2(8.0, 12.0), 3.0) + step(uAnim, 0.46) * 100.0;
  return min(body, can);
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.3;
  float t = uTime;
  float glitch = smoothstep(0.0, 0.08, uAnim) * (1.0 - smoothstep(0.42, 0.5, uAnim));
  float power = 1.0 - uSearched * 0.55;

  // 弹出的罐子
  if (uAnim > 0.46) {
    vec2 cq = p - canPath(uAnim);
    cq = rot2(uAnim * 20.0 * (1.0 - smoothstep(0.85, 0.9, uAnim))) * cq;
    float can = sdRoundBox(cq, vec2(8.0, 12.0), 3.0);
    if (can < 0.0) {
      float band = fillAA(abs(cq.y) - 4.0);
      vec3 col = mix(vec3(0.6, 0.62, 0.6), vec3(0.7, 0.1, 0.12), band);
      n = normalize(vec3(cq.x / 9.0, 0.0, 1.0));
      gloss = 0.8;
      return vec4(col, 1.0);
    }
  }

  vec2 fuv;
  float face = boxFace(p, VW, VH, VD, fuv);
  if (face < 0.5) return vec4(0.0);
  float bodyD = sdBox(p - vec2(0.0, VH * 0.5), vec2(VW * 0.5, VH * 0.5));
  vec3 shell = weather(mix(vec3(0.34, 0.06, 0.07), vec3(0.06, 0.2, 0.24), step(0.5, fract(uPSeed * 0.53))), p + uPSeed * 30.0, 1.0, 0.45, clamp(-bodyD / 10.0, 0.0, 1.0), uPSeed);
  if (face > 1.5) {
    float topD = sdBox(fuv - vec2(0.0, VD * 0.5), vec2(VW * 0.5, VD * 0.5));
    vec3 col = shell * 1.1;
    col = mix(col, vec3(0.3, 0.29, 0.28), smoothstep(0.45, 0.8, fbm3(fuv * 0.05)) * 0.5);
    // 顶上的旧纸箱
    float box = sdBox(fuv - vec2(-18.0, 26.0), vec2(26.0, 16.0));
    col = mix(col, vec3(0.34, 0.25, 0.14), fillAA(box));
    n = bumpFloor(bevelH(topD, 4.0) * 3.0 + fillAA(box) * 2.0, 1.0);
    return vec4(col, 1.0);
  }

  vec3 col = shell;
  float h = bevelH(bodyD, 6.0) * 5.0;
  // 顶部灯箱: 抽象标志(圆 + 波纹), 故障闪烁
  vec2 hq = p - vec2(0.0, 211.0);
  float header = sdRoundBox(hq, vec2(52.0, 11.0), 3.0);
  float logo = min(abs(length(hq - vec2(-30.0, 0.0)) - 6.0) - 1.4, abs(hq.y - sin(hq.x * 0.25) * 3.0) - 1.3 + step(hq.x, -18.0) * 50.0 + step(40.0, hq.x) * 50.0);
  float flick = step(0.3, vnoise(vec2(t * 7.0, uPSeed))) * power;
  col = mix(col, vec3(0.05, 0.05, 0.06), fillAA(header));
  emit += vec3(1.0, 0.35, 0.3) * fillAA(logo) * fillAA(header) * (0.3 + flick * 1.6);
  emit += vec3(1.0, 0.4, 0.35) * fillAA(header) * 0.08 * flick;

  // 橱窗: 货架 + 罐子 + 螺旋出货弹簧, 冷光管照明, 裂纹玻璃
  vec2 wq = p - vec2(-15.0, 128.0);
  float window = sdBox(wq, vec2(38.0, 62.0));
  if (window < 0.0) {
    float row = floor((wq.y + 62.0) / 31.0);
    float ry = mod(wq.y + 62.0, 31.0);
    float slot = floor((wq.x + 38.0) / 15.2);
    float sx = mod(wq.x + 38.0, 15.2) - 7.6;
    float present = step(0.3, hash12(vec2(slot, row) + uPSeed));
    float can = fillAA(sdRoundBox(vec2(sx, ry - 14.0), vec2(5.0, 8.0), 2.0)) * present;
    vec3 canC = mix(vec3(0.6, 0.12, 0.1), vec3(0.15, 0.4, 0.6), hash12(vec2(slot * 3.0, row)));
    canC = mix(canC, vec3(0.7, 0.6, 0.2), step(0.75, hash12(vec2(slot, row * 5.0))));
    float coil = fillAA(abs(sin((wq.x + 38.0) * 0.8) * 2.0 - (ry - 4.0)) - 1.0) * step(ry, 7.0);
    vec3 inner = vec3(0.03, 0.035, 0.04);
    inner = mix(inner, canC * 0.8, can);
    inner = mix(inner, vec3(0.3), coil * 0.6);
    float tube = 0.6 + 0.4 * step(0.25, vnoise(vec2(t * 11.0, uPSeed + 3.0)));
    float lit = (0.5 + glitch * 0.8 * step(0.5, fract(t * 23.0))) * tube * power;
    emit += (inner + vec3(0.1, 0.12, 0.12)) * lit * 0.5;
    vec3 v = voronoi(wq * 0.05 + uPSeed);
    float crack = (1.0 - smoothstep(0.0, 0.035, v.y)) * smoothstep(0.7, 0.2, length(wq - vec2(10.0, 20.0)) / 60.0);
    col = inner + vec3(0.5, 0.6, 0.65) * crack * 0.5;
    gloss = 0.95;
    h = -2.0 + crack * 0.8;
    // 斜向玻璃高光
    col += vec3(0.08) * (1.0 - smoothstep(0.0, 1.0, abs(fract((wq.x + wq.y * 0.8) / 90.0) - 0.5) * 7.0));
  }
  float wframe = abs(window) - 3.0;
  col = mix(col, vec3(0.1, 0.1, 0.11), fillAA(wframe));
  h += bevelH(-abs(window) + 3.0, 2.0) * 2.0 * fillAA(wframe);

  // 右侧面板: 乱码小屏 + 按键 + 投币口
  vec2 sq = p - vec2(40.0, 160.0);
  float screen = sdRoundBox(sq, vec2(12.0, 12.0), 2.0);
  if (screen < 0.0) {
    vec2 cell = floor((sq + 12.0) / vec2(3.0, 2.0));
    float nz = hash12(cell + floor(t * mix(4.0, 30.0, glitch)));
    float scan = 0.7 + 0.3 * sin(sq.y * 3.0 + t * 20.0);
    float bars = step(0.5, nz) * mix(step(abs(sq.y), 3.0), 1.0, glitch);
    vec3 sc = mix(vec3(0.1, 0.9, 0.8), vec3(1.0, 0.2, 0.6), step(0.8, nz) * glitch);
    emit += sc * (0.25 + bars * (0.8 + glitch * 2.0)) * scan * power;
    col = vec3(0.02, 0.05, 0.05);
    gloss = 0.9;
  }
  vec2 kq = p - vec2(40.0, 124.0);
  vec2 kc = abs(mod(kq + vec2(9.0, 12.0), vec2(6.0)) - 3.0);
  float keys = fillAA(max(kc.x, kc.y) - 2.0) * fillAA(sdBox(kq, vec2(9.0, 12.0)));
  col = mix(col, vec3(0.5, 0.48, 0.44), keys);
  h += keys * 1.5;
  float coin = fillAA(sdRoundBox(p - vec2(40.0, 98.0), vec2(1.6, 6.0), 1.0));
  col = mix(col, vec3(0.02), coin);
  // 出货口
  vec2 fq = p - vec2(-12.0, 34.0);
  float flap = sdRoundBox(fq, vec2(36.0, 13.0), 3.0);
  float fopen = smoothstep(0.44, 0.5, uAnim) * (1.0 - smoothstep(0.55, 0.62, uAnim));
  col = mix(col, mix(vec3(0.05), vec3(0.01), fopen), fillAA(flap));
  h += -bevelH(flap, 3.0) * 3.0;
  // 踢脚
  col = mix(col, vec3(0.04), fillAA(p.y - 10.0));
  n = bumpWall(h, 1.0);
  return vec4(col, 1.0);
}
`;

export const VENDING_SPEC: PropSpec = {
  bounds: { w: 320, h: 360, x0: -150, y0: -50 },
  glsl: VENDING_GLSL,
  shadow: [74, 22],
  promptH: 300,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const y = worldY(def.z);
    const flip = def.flip ? -1 : 1;
    const cyan = new THREE.Color(0.4, 1, 0.9);
    if (prev < 0.12 && cur >= 0.12) ctx.fx.spawn("sparks", def.x + 40 * flip, y + 160, 14, y - 4);
    if (prev < 0.34 && cur >= 0.34) ctx.fx.spawn("sparks", def.x + 30 * flip, y + 200, 22, y - 4);
    if (prev < 0.47 && cur >= 0.47) ctx.fx.spawn("dust", def.x - 12 * flip, y + 30, 8, y - 4);
    if (prev < 0.9 && cur >= 0.9) ctx.fx.spawn("glint", def.x + 102 * flip, y + 10, 16, y - 10, cyan);
  },
};
