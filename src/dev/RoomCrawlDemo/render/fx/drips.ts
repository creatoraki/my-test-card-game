import type * as THREE from "three";
import { WALL_BASE_WY } from "../../data/layout";
import type { FxDef } from "../../types";
import { LAYER } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";

/**
 * 滴水: 水珠在高处慢慢鼓起 → 坠落拉长 → 落地溅起两粒小水花并荡开一圈涟漪。
 * 每个挂点落在固定纵深, 节奏按种子错开。
 */
const DRIP_FRAG = /* glsl */ `
uniform float uSeedFx;
uniform float uTop;
uniform float uLandZ;
varying vec2 vLocal;
varying vec2 vWorld;
void main() {
  float period = 2.2 + uSeedFx * 1.3;
  float t = fract(uTime / period + uSeedFx * 7.0) * period;
  float landY = ${WALL_BASE_WY.toFixed(1)} - uLandZ;
  float grow = 0.9;
  float fallT = 0.55;
  vec3 c = vec3(0.0);
  float a = 0.0;
  vec3 spec;
  vec3 lit = pointLights(vec3(vWorld.x, 200.0, uLandZ), vec3(0.0, 0.0, 1.0), 0.0, spec);
  vec3 water = vec3(0.55, 0.7, 0.8) * 0.3 + lit * 0.6;
  float y = vWorld.y;
  float x = vLocal.x;
  if (t < grow) {
    float r = 2.0 + t / grow * 3.0;
    float d = length(vec2(x, (y - (uTop - r)) * 0.8)) - r;
    a = fillAA(d);
    c = water * a;
  } else if (t < grow + fallT) {
    float k = (t - grow) / fallT;
    float py = mix(uTop - 5.0, landY, k * k);
    float stretch = 1.0 + k * 3.0;
    float d = length(vec2(x, (y - py) / stretch)) - 2.6;
    a = fillAA(d) * 0.9;
    c = water * a * 1.3;
  } else {
    float k = (t - grow - fallT) / 0.8;
    // 溅起的两粒水花
    for (int i = 0; i < 2; i++) {
      float s = float(i) * 2.0 - 1.0;
      vec2 sp = vec2(s * k * 26.0, landY + sin(min(k, 1.0) * 3.14159) * 22.0);
      float d = length(vec2(x, y) - sp) - 1.8;
      float m = fillAA(d) * (1.0 - k) * step(k, 1.0);
      a = max(a, m);
      c += water * m;
    }
    // 涟漪
    vec2 rq = vec2(x, (y - landY) * 3.0);
    float ring = exp(-abs(length(rq) - k * 40.0) * 0.7) * (1.0 - smoothstep(0.3, 1.0, k));
    c += water * ring * 0.8;
    a = max(a, ring * 0.4);
  }
  gl_FragColor = vec4(c, a);
}
`;

export function buildDrip(def: FxDef, rig: RigUniforms, index: number): THREE.Mesh {
  const landZ = 90 + ((def.x * 0.37 + index * 53) % 170);
  const top = WALL_BASE_WY + (def.h ?? 430);
  const bottom = WALL_BASE_WY - landZ - 30;
  const material = quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + DRIP_FRAG,
    uniforms: {
      uSeedFx: { value: ((def.x * 0.0173 + index * 0.31) % 1) },
      uTop: { value: top },
      uLandZ: { value: landZ },
    },
    rig,
  });
  return placeMesh(makeQuad(80, top - bottom + 10, -40, 0), material, def.x, bottom, LAYER.air - 3);
}
