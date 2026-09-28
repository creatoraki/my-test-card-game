import * as THREE from "three";
import { DEPTH_WEIGHT, FLOOR_DEPTH, WALL_BASE_WY } from "../../data/layout";
import { VIEW_HALF, VIEW_RANGE } from "../../engine/guardBrain";
import { LAYER } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";

/** 贴地视野锥: 在纵深加权空间里画扇形, 巡逻时淡青、警觉后转红, 带扫描波纹。 */
const FRAG = /* glsl */ `
uniform vec2 uOrigin;
uniform float uLook;
uniform float uAlert;
uniform float uFade;
varying vec2 vWorld;
void main() {
  float z = ${WALL_BASE_WY.toFixed(1)} - vWorld.y;
  if (z < 0.0 || z > ${FLOOR_DEPTH.toFixed(1)}) discard;
  vec2 d = vec2(vWorld.x - uOrigin.x, (z - uOrigin.y) * ${DEPTH_WEIGHT.toFixed(2)});
  float r = length(d);
  float ang = atan(d.y, d.x) - uLook;
  ang = mod(ang + 3.14159265, 6.2831853) - 3.14159265;
  float range = ${VIEW_RANGE.toFixed(1)};
  float half_ = ${VIEW_HALF.toFixed(3)};
  float inside = (1.0 - smoothstep(half_ - 0.04, half_, abs(ang))) * (1.0 - smoothstep(range - 30.0, range, r)) * smoothstep(20.0, 60.0, r);
  float edge = (1.0 - smoothstep(0.0, 0.025, abs(abs(ang) - half_ + 0.02))) * (1.0 - smoothstep(range - 30.0, range, r)) * smoothstep(20.0, 60.0, r);
  float wave = 0.5 + 0.5 * sin(r * 0.05 - uTime * (3.0 + uAlert * 5.0));
  float falloff = 1.0 - r / range;
  vec3 col = mix(vec3(0.35, 0.9, 1.0), vec3(1.0, 0.12, 0.05), uAlert);
  float a = (inside * (0.1 + 0.08 * wave) * (0.4 + falloff * 0.6) + edge * 0.35) * uFade;
  gl_FragColor = vec4(col * a, a * 0.8);
}
`;

export interface VisionCone {
  mesh: THREE.Mesh;
  update(x: number, z: number, look: number, alert: number, fade: number): void;
}

export function createVisionCone(rig: RigUniforms): VisionCone {
  const uniforms = {
    uOrigin: { value: new THREE.Vector2() },
    uLook: { value: 0 },
    uAlert: { value: 0 },
    uFade: { value: 1 },
  };
  const material = quadMaterial({ vertexShader: QUAD_VERT, fragmentShader: FRAG_PRELUDE + FRAG, uniforms, rig });
  const w = VIEW_RANGE * 2 + 40;
  const mesh = placeMesh(makeQuad(w, FLOOR_DEPTH, -w / 2, -FLOOR_DEPTH), material, 0, WALL_BASE_WY, LAYER.floorDecal);
  return {
    mesh,
    update: (x, z, look, alert, fade) => {
      mesh.position.x = x;
      uniforms.uOrigin.value.set(x, z);
      uniforms.uLook.value = look;
      uniforms.uAlert.value = alert;
      uniforms.uFade.value = fade;
    },
  };
}
