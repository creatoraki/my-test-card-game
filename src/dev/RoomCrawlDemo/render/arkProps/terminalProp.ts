import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { PropSpec } from "../props/propFactory";

/**
 * 补给终端: 细长的白色立式终端, 正面一块叶形图标的屏幕, 头顶悬着缓慢旋转的全息叶片, 下方出货口。
 * 调查: 屏幕扫描、进度条走满(0~0.5) → 出货口弹出补给胶囊并在地上弹跳(0.5~0.9) → 屏幕显示对勾。
 */
const TERMINAL_GLSL = /* glsl */ `
const float TW = 74.0;
const float TH = 196.0;
const float TD = 26.0;
const vec3 T_WHITE = vec3(0.76, 0.79, 0.8);
const vec3 T_CYAN = vec3(0.25, 0.95, 1.0);

/** 胶囊弹出轨迹(本地 px)。 */
vec2 capsulePath(float k) {
  float t = clamp((k - 0.5) / 0.4, 0.0, 1.0);
  float x = 4.0 + t * 70.0;
  float bounce = abs(sin(t * 3.14159 * 3.0)) * exp(-t * 2.8) * 46.0;
  float y = mix(46.0, 8.0, smoothstep(0.0, 0.2, t)) + bounce;
  return vec2(x, y);
}

float tLeaf(vec2 q, float len, float wid) {
  float t = clamp(q.y / len, 0.0, 1.0);
  float w = wid * pow(sin(3.14159 * t), 0.7);
  return max(abs(q.x) - w, max(-q.y, q.y - len)) * 0.8;
}

float propSdf(vec2 p) {
  float body = sdBox(p - vec2(0.0, (TH + TD) * 0.5), vec2(TW * 0.5, (TH + TD) * 0.5));
  float cap = sdRoundBox(p - capsulePath(uAnim), vec2(12.0, 7.0), 6.0) + step(uAnim, 0.51) * 100.0;
  return min(body, cap);
}

/** 屏幕内容: 叶形图标 + 进度条 + 扫描线; 完成后换成对勾。 */
vec3 screenGlow(vec2 sq, float k) {
  float scanPhase = smoothstep(0.0, 0.5, uAnim);
  float leaf = fillAA(tLeaf(sq + vec2(0.0, 6.0), 26.0, 8.0));
  float bar = fillAA(sdBox(sq - vec2(0.0, -20.0), vec2(22.0, 2.5)));
  float fill = bar * step(sq.x + 22.0, scanPhase * 44.0);
  float scan = exp(-abs(sq.y - mix(26.0, -26.0, fract(uTime * 0.8))) / 2.0) * step(0.01, uAnim) * (1.0 - uSearched);
  vec2 cq = sq - vec2(0.0, 6.0);
  float check = min(sdSegment(cq, vec2(-10.0, 0.0), vec2(-3.0, -8.0)), sdSegment(cq, vec2(-3.0, -8.0), vec2(12.0, 10.0))) - 2.2;
  float done = smoothstep(0.9, 1.0, uAnim);
  vec3 c = T_CYAN * (leaf * (1.0 - done) + fill * 1.4 + bar * 0.25 + scan * 0.5);
  c += vec3(0.5, 1.0, 0.6) * fillAA(check) * done * 1.3;
  c += T_CYAN * 0.08;
  return c * k;
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.45;
  float power = 1.0 - uSearched * 0.5;

  // 头顶全息叶片: 投影光锥 + 绕竖轴旋转的叶片(横向压缩表现转动)
  vec2 hq = p - vec2(0.0, TH + TD + 14.0);
  float cone = step(0.0, hq.y) * step(hq.y, 70.0) * (1.0 - smoothstep(4.0 + hq.y * 0.35, 8.0 + hq.y * 0.35, abs(hq.x)));
  emit += T_CYAN * cone * 0.08 * power;
  float spin = cos(uTime * 1.3);
  vec2 lq = vec2(hq.x / max(abs(spin), 0.08), hq.y - 14.0);
  float holo = fillAA(tLeaf(lq, 44.0, 12.0) * max(abs(spin), 0.08));
  float lines = 0.6 + 0.4 * step(0.5, fract(hq.y / 4.0 - uTime * 2.0));
  emit += T_CYAN * holo * lines * (0.5 + smoothstep(0.0, 0.5, uAnim) * 0.8) * power;

  // 弹出的补给胶囊
  if (uAnim > 0.51) {
    vec2 cq = p - capsulePath(uAnim);
    cq = rot2(uAnim * 16.0 * (1.0 - smoothstep(0.86, 0.9, uAnim))) * cq;
    float cap = sdRoundBox(cq, vec2(12.0, 7.0), 6.0);
    if (cap < 0.0) {
      vec3 col = mix(vec3(0.85, 0.88, 0.88), vec3(0.3, 0.8, 0.5), step(0.0, cq.x));
      emit += vec3(0.4, 1.0, 0.6) * fillAA(abs(cq.x) - 1.0) * 0.8;
      n = normalize(vec3(0.0, cq.y / 8.0, 1.0));
      gloss = 0.8;
      return vec4(col, 1.0);
    }
  }

  vec2 fuv;
  float face = boxFace(p, TW, TH, TD, fuv);
  if (face < 0.5) return vec4(0.0);
  if (face > 1.5) {
    float topD = sdBox(fuv - vec2(0.0, TD * 0.5), vec2(TW * 0.5, TD * 0.5));
    float lens = fillAA(length(fuv - vec2(0.0, TD * 0.5)) - 7.0);
    vec3 col = mix(T_WHITE, vec3(0.1, 0.2, 0.22), lens);
    emit += T_CYAN * lens * 0.8 * power;
    n = bumpFloor(bevelH(topD, 4.0) * 3.0, 1.0);
    return vec4(col, 1.0);
  }
  float bodyD = sdRoundBox(p - vec2(0.0, TH * 0.5), vec2(TW * 0.5, TH * 0.5), 10.0);
  vec3 col = T_WHITE * (0.93 + 0.12 * fbm3(p * 0.02 + uPSeed));
  float h = bevelH(bodyD, 6.0) * 5.0;
  // 侧边竖向灯带
  float strip = fillAA(abs(abs(p.x) - TW * 0.5 + 6.0) - 1.3) * step(20.0, p.y) * step(p.y, TH - 16.0);
  col = mix(col, vec3(0.8, 1.0, 1.0), strip);
  emit += T_CYAN * strip * (0.5 + 0.3 * sin(uTime * 2.0 + p.y * 0.05)) * power;
  // 屏幕
  vec2 sq = p - vec2(0.0, 140.0);
  float screen = sdRoundBox(sq, vec2(28.0, 32.0), 4.0);
  if (screen < 0.0) {
    col = vec3(0.02, 0.05, 0.06);
    emit += screenGlow(sq, power);
    gloss = 0.9;
    col += vec3(0.08) * (1.0 - smoothstep(0.0, 1.0, abs(fract((sq.x + sq.y) / 50.0) - 0.5) * 8.0));
    h = -1.0;
  }
  float bezel = abs(screen) - 3.0;
  col = mix(col, vec3(0.2, 0.24, 0.26), fillAA(bezel));
  // 出货口: 开合的挡板
  vec2 dq = p - vec2(0.0, 46.0);
  float slot = sdRoundBox(dq, vec2(22.0, 10.0), 4.0);
  float open = smoothstep(0.48, 0.53, uAnim) * (1.0 - smoothstep(0.6, 0.68, uAnim));
  col = mix(col, mix(vec3(0.12, 0.15, 0.16), vec3(0.02), open), fillAA(slot));
  emit += vec3(0.4, 1.0, 0.6) * fillAA(slot) * open * 0.6;
  h += -bevelH(slot, 3.0) * 3.0;
  // 读卡感应区
  float pad = fillAA(abs(length(p - vec2(0.0, 86.0)) - 9.0) - 1.4);
  emit += T_CYAN * pad * (0.4 + 0.6 * smoothstep(0.0, 0.1, uAnim)) * power;
  col = mix(col, vec3(0.1, 0.12, 0.13), fillAA(p.y - 10.0));
  n = bumpWall(h, 1.0);
  return vec4(col, 1.0);
}
`;

export const TERMINAL_SPEC: PropSpec = {
  bounds: { w: 240, h: 360, x0: -110, y0: -40 },
  glsl: TERMINAL_GLSL,
  shadow: [48, 16],
  promptH: 250,
  choreo: (view, ctx, prev, cur) => {
    const { def } = view;
    const y = worldY(def.z);
    const flip = def.flip ? -1 : 1;
    const cyan = new THREE.Color(0.4, 1.3, 1.5);
    const green = new THREE.Color(0.5, 1.4, 0.7);
    if (prev < 0.05 && cur >= 0.05) ctx.fx.spawn("glint", def.x, y + 140, 8, y - 4, cyan);
    if (prev < 0.5 && cur >= 0.5) ctx.fx.spawn("glint", def.x + 4 * flip, y + 46, 12, y - 4, green);
    if (prev < 0.9 && cur >= 0.9) ctx.fx.spawn("glint", def.x + 74 * flip, y + 10, 16, y - 10, green);
  },
};
