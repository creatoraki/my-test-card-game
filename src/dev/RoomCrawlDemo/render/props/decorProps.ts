import * as THREE from "three";
import { worldY } from "../../data/layout";
import type { DecorDef, DecorKind, LightDef } from "../../types";
import { orderForZ } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import { MOTIFS_GLSL } from "../glsl/motifs";
import type { LightRig } from "../lighting/lightRig";
import type { Disposer } from "../core/disposer";
import { buildBakedDecor, type BakedDecor } from "./decorBaked";
import { PROP_COMMON, PROP_MAIN } from "./propHighlight";

const KIND_ID: Record<DecorKind, number> = { crates: 0, barrel: 1, pallet: 2, debris: 3, cone: 4, spool: 5 };
const LAMP_KIND = 6;

/** 装饰物(不可调查): 与交互物共用着色主体, 按 KIND 编译不同形体。静态摆件进房时烘焙, 吊灯实时绘制。 */
const DECOR_GLSL = /* glsl */ `
uniform int uLightIndex;

vec4 woodBox(vec2 p, vec2 c, float w, float h, float d, float seed, inout vec3 n, out bool hit) {
  vec2 fuv;
  float face = boxFace(p - c, w, h, d, fuv);
  hit = face > 0.5;
  if (!hit) return vec4(0.0);
  vec3 wood = mix(vec3(0.32, 0.22, 0.12), vec3(0.4, 0.3, 0.17), hash11(seed));
  if (face > 1.5) {
    float plank = fillAA(abs(fract(fuv.x / 20.0) - 0.5) * 20.0 - 9.0);
    vec3 col = weather(wood * (1.0 - plank * 0.4), fuv * vec2(1.0, 2.0) + seed * 40.0, 1.0, 0.0, 1.0, seed);
    n = bumpFloor(-plank * 1.5, 1.0);
    return vec4(col * 1.1, 1.0);
  }
  vec2 q = fuv - vec2(0.0, h * 0.5);
  float edge = sdBox(q, vec2(w * 0.5, h * 0.5));
  float frame = 1.0 - fillAA(sdBox(q, vec2(w * 0.5 - 8.0, h * 0.5 - 8.0)));
  float plank = fillAA(abs(fract(q.y / 17.0) - 0.5) * 17.0 - 7.8);
  float brace = fillAA(abs(q.y - q.x * (h / w)) - 5.0) * (1.0 - frame);
  vec3 col = wood * (0.85 + 0.3 * fbm3(vec2(q.x * 0.02, q.y * 0.3) + seed));
  col *= 1.0 - plank * 0.45;
  col = mix(col, wood * 1.15, max(frame, brace));
  // 模板漆记号: 一个空心菱形
  float mark = fillAA(abs(sdBox(rot2(0.785) * (q - vec2(w * 0.18, 0.0)), vec2(9.0))) - 1.8) * step(0.5, hash11(seed * 3.0));
  col = mix(col, vec3(0.08), mark * 0.7);
  col = weather(col, q * 1.5 + seed * 30.0, 1.1, 0.0, clamp(-edge / 10.0, 0.0, 1.0), seed);
  float corner = fillAA(sdBox(vec2(abs(q.x) - w * 0.5 + 5.0, abs(q.y) - h * 0.5 + 5.0), vec2(5.0)));
  col = mix(col, vec3(0.2, 0.2, 0.2), corner);
  n = bumpWall(bevelH(edge, 3.0) * 3.0 + max(frame, brace) * 2.0 - plank + corner * 2.0, 1.0);
  return vec4(col, 1.0);
}

float propSdf(vec2 p) {
#if KIND == 0
  return min(sdBox(p - vec2(0.0, 55.0), vec2(62.0, 55.0)), sdBox(p - vec2(-10.0, 123.0), vec2(40.0, 43.0)));
#elif KIND == 1
  return sdBox(p - vec2(0.0, 48.0), vec2(28.0, 48.0));
#elif KIND == 2
  return sdBox(p - vec2(0.0, 28.0), vec2(62.0, 28.0));
#elif KIND == 3
  return sdEllipse(p - vec2(0.0, 6.0), vec2(80.0, 30.0)) + (fbm3(p * 0.08) - 0.5) * 16.0;
#elif KIND == 4
  return min(sdTrapezoid(p - vec2(0.0, 30.0), 13.0, 3.0, 26.0), sdBox(p - vec2(0.0, 3.0), vec2(18.0, 4.0)));
#elif KIND == 5
  return sdBox(p - vec2(0.0, 56.0), vec2(52.0, 56.0));
#else
  return sdTrapezoid(p - vec2(0.0, 6.0), 26.0, 8.0, 12.0);
#endif
}

vec4 propShade(vec2 p, out vec3 n, out vec3 emit, out float gloss) {
  n = vec3(0.0, 0.0, 1.0);
  emit = vec3(0.0);
  gloss = 0.15;
  float seed = uPSeed;
#if KIND == 0
  bool hit;
  vec4 top = woodBox(p, vec2(-10.0, 80.0), 80.0, 56.0, 30.0, seed + 1.0, n, hit);
  if (hit) return top;
  return woodBox(p, vec2(0.0, 0.0), 124.0, 80.0, 30.0, seed, n, hit);
#elif KIND == 1
  float w = 28.0;
  if (p.y > 84.0) {
    vec2 e = (p - vec2(0.0, 84.0)) / vec2(w, 12.0);
    if (length(e) > 1.0) return vec4(0.0);
    float rim = 1.0 - smoothstep(0.75, 0.9, length(e));
    vec3 col = mix(vec3(0.1), vec3(0.25, 0.24, 0.22), rim);
    float cap = fillAA((length(e - vec2(0.4, 0.1)) - 0.14) * 12.0);
    col = mix(col, vec3(0.3), cap);
    n = normalize(vec3(e.x * 0.3, 1.0, 0.0));
    gloss = 0.5;
    return vec4(col, 1.0);
  }
  if (abs(p.x) > w || p.y < 0.0) return vec4(0.0);
  vec3 paint = hash11(seed) < 0.33 ? vec3(0.08, 0.16, 0.3) : hash11(seed) < 0.66 ? vec3(0.35, 0.07, 0.05) : vec3(0.5, 0.36, 0.05);
  float cx = p.x / w;
  float rib = fillAA(abs(p.y - 26.0) - 2.5) + fillAA(abs(p.y - 62.0) - 2.5);
  vec3 col = weather(paint, p * vec2(1.0, 1.0) + seed * 20.0, 1.2, 0.7, 1.0 - abs(cx), seed);
  float sym = fillAA(abs(length(p - vec2(4.0, 44.0)) - 9.0) - 2.0) * step(0.5, hash11(seed * 7.0));
  col = mix(col, vec3(0.8, 0.75, 0.6), sym * 0.7);
  n = normalize(vec3(cx * 1.2, rib * 0.4, sqrt(max(1.0 - cx * cx, 0.05))));
  gloss = 0.35;
  return vec4(col * (1.0 + rib * 0.2), 1.0);
#elif KIND == 2
  vec2 fuv;
  float face = boxFace(p, 124.0, 16.0, 40.0, fuv);
  if (face < 0.5) return vec4(0.0);
  vec3 wood = vec3(0.36, 0.26, 0.15);
  if (face > 1.5) {
    float gap = fillAA(abs(fract(fuv.x / 24.0) - 0.5) * 24.0 - 9.0);
    if (gap < 0.5 && fract(fuv.x / 24.0) < 0.1) return vec4(0.0);
    vec3 col = weather(wood, fuv * vec2(1.0, 2.0) + seed * 9.0, 1.2, 0.0, 1.0, seed);
    n = bumpFloor(-gap * 2.0, 1.0);
    return vec4(col * (1.0 - gap * 0.7), 1.0);
  }
  float block = fillAA(abs(abs(p.x) - 48.0) - 10.0) + fillAA(abs(p.x) - 10.0);
  float slot = (1.0 - clamp(block, 0.0, 1.0)) * step(3.0, p.y) * step(p.y, 13.0);
  vec3 col = mix(weather(wood * 0.9, p + seed * 7.0, 1.2, 0.0, 1.0, seed), vec3(0.02), slot);
  return vec4(col, 1.0);
#elif KIND == 3
  float d = propSdf(p);
  if (d > 0.0) return vec4(0.0);
  vec3 v = voronoi(p * 0.07 + seed);
  float chunk = smoothstep(0.0, 0.12, v.y);
  float hgt = chunk * (1.0 - smoothstep(-30.0, 0.0, d)) * 8.0 + (1.0 - v.x) * 3.0;
  vec3 col = mix(C_CONCRETE_DARK, C_CONCRETE, v.z) * (0.6 + 0.4 * chunk);
  float rebar = fillAA(abs(p.y - 18.0 - p.x * 0.3) - 1.4) * step(abs(p.x - 20.0), 30.0);
  col = mix(col, C_RUST, rebar);
  n = bumpWall(hgt + rebar * 3.0, 1.0);
  return vec4(col, 1.0);
#elif KIND == 4
  float d = propSdf(p);
  if (d > 0.0) return vec4(0.0);
  float band = fillAA(abs(p.y - 32.0) - 5.0) * step(8.0, p.y);
  vec3 col = mix(vec3(0.75, 0.2, 0.03), vec3(0.8, 0.8, 0.75), band);
  col = mix(col, vec3(0.06), step(p.y, 7.0));
  col = weather(col, p * 2.0 + seed, 1.0, 0.0, 1.0, seed);
  float cx = p.x / (13.0 - p.y * 0.18);
  n = normalize(vec3(cx, 0.2, 1.0));
  gloss = 0.4;
  return vec4(col, 1.0);
#elif KIND == 5
  // 横放的线缆盘: 两侧圆盘侧影 + 中间缠绕的电缆
  float flangeL = sdEllipse(p - vec2(-44.0, 56.0), vec2(8.0, 56.0));
  float flangeR = sdEllipse(p - vec2(44.0, 56.0), vec2(8.0, 56.0));
  float drum = sdBox(p - vec2(0.0, 56.0), vec2(40.0, 44.0));
  if (min(flangeR, min(flangeL, drum)) > 0.0) return vec4(0.0);
  if (flangeR < 0.0 || flangeL < 0.0) {
    vec3 wood = weather(vec3(0.38, 0.27, 0.15), p * 2.0 + seed, 1.2, 0.0, 0.5, seed);
    float fx = (p.x - sign(p.x) * 44.0) / 8.0;
    n = normalize(vec3(fx, 0.0, 1.0));
    return vec4(wood, 1.0);
  }
  float wrap = abs(fract((p.y - 12.0) / 7.0) - 0.5);
  vec3 cable = mix(vec3(0.02), vec3(0.08, 0.07, 0.06), 1.0 - wrap * 2.0);
  float cy = (p.y - 56.0) / 44.0;
  n = normalize(vec3(0.0, cy, sqrt(max(1.0 - cy * cy, 0.05))));
  gloss = 0.5;
  return vec4(cable, 1.0);
#else
  // 吊灯: 细线吊着锥形灯罩, 灯泡亮度跟随对应灯的闪烁
  float level = uLightCol[uLightIndex].w;
  vec3 lc = uLightCol[uLightIndex].rgb / max(max(uLightCol[uLightIndex].r, max(uLightCol[uLightIndex].g, uLightCol[uLightIndex].b)), 1e-3);
  float cable = fillAA(abs(p.x) - 1.2) * step(18.0, p.y);
  float shadeD = sdTrapezoid(p - vec2(0.0, 6.0), 26.0, 8.0, 12.0);
  float bulb = length((p - vec2(0.0, -7.0)) * vec2(1.0, 1.4)) - 7.0;
  emit += lc * (fillAA(bulb) * (0.6 + level * 5.0) + exp(-max(bulb, 0.0) / 10.0) * level * 0.8);
  emit += lc * exp(-length(p * vec2(0.4, 1.0) + vec2(0.0, 18.0)) / 30.0) * level * 0.25 * step(p.y, 0.0);
  if (shadeD < 0.0) {
    n = normalize(vec3(p.x / 30.0, 0.5, 1.0));
    gloss = 0.6;
    return vec4(vec3(0.12, 0.13, 0.12), 1.0);
  }
  if (cable > 0.0) return vec4(vec3(0.02), cable);
  return vec4(0.0);
#endif
}
`;

const BOUNDS: Record<number, [number, number, number, number]> = {
  0: [180, 230, -90, -20],
  1: [80, 130, -40, -20],
  2: [150, 90, -75, -20],
  3: [200, 80, -100, -30],
  4: [60, 80, -30, -12],
  5: [140, 140, -70, -20],
  6: [80, 700, -40, -30],
};

function decorMaterial(kind: number, rig: LightRig, seed: number, flip: boolean, x: number, z: number): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + PROP_COMMON + DECOR_GLSL + PROP_MAIN,
    defines: { KIND: kind },
    uniforms: {
      uAnim: { value: 0 },
      uSearched: { value: 0 },
      uFocus: { value: 0 },
      uFlip: { value: flip ? -1 : 1 },
      uPSeed: { value: seed },
      uProp: { value: new THREE.Vector3(x, 0, z) },
      uAccent: { value: new THREE.Color(0) },
      uLightIndex: { value: 0 },
    },
    rig: rig.uniforms,
  });
}

/** 静态装饰物: 形体与风化材质烘焙成贴图(烘焙工作随结果返回, 由房间统一分帧执行), 每帧只打光。 */
export function buildDecor(def: DecorDef, rig: LightRig, disposer: Disposer): BakedDecor {
  const kind = KIND_ID[def.kind];
  return buildBakedDecor({
    glsl: DECOR_GLSL,
    kind,
    bounds: BOUNDS[kind],
    seed: def.seed ?? 1,
    flip: Boolean(def.flip),
    x: def.x,
    y: worldY(def.z),
    z: def.z,
    scale: def.scale ?? 1,
    order: orderForZ(def.z, 1),
  }, rig, disposer);
}

/** 悬挂在房间中部的灯(z > 40)配一盏吊灯外形。 */
export function buildHangingLamp(light: LightDef, index: number, rig: LightRig): THREE.Mesh {
  const [w, h, x0, y0] = BOUNDS[LAMP_KIND];
  const mat = decorMaterial(LAMP_KIND, rig, index + 1, false, light.x, light.z);
  mat.uniforms.uLightIndex.value = index;
  return placeMesh(makeQuad(w, h, x0, y0), mat, light.x, worldY(light.z, light.h), orderForZ(light.z, 2));
}
