import type * as THREE from "three";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import { ROOM_HEADER } from "./roomHeader";

/**
 * 空气层: 每盏灯周围的光晕(近处亮核 + 远处柔和的散射)。
 * 画在所有物体之上, 纯加色; 离灯足够远的像素直接跳过。
 */
const ATMOS_MAIN = /* glsl */ `
varying vec2 vWorld;

void main() {
  vec2 w = vWorld;
  vec3 add = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec4 lp = uLightPos[i];
    vec2 sp = vec2(lp.x, WALL_BASE - lp.z + lp.y);
    float d = length((w - sp) * vec2(1.0, 1.25));
    if (d > 900.0) continue;
    add += uLightCol[i].rgb * (exp(-d / 26.0) * 0.12 + exp(-d / 140.0) * 0.035);
  }
  gl_FragColor = vec4(add, 0.0);
}
`;

export function atmosphereMaterial(rig: RigUniforms, room: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + ROOM_HEADER + ATMOS_MAIN,
    uniforms: room,
    rig,
  });
}
