import * as THREE from "three";
import { LAYER } from "../core/depthSort";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { QUAD_VERT } from "../glsl/prelude";

const FRAG = /* glsl */ `
uniform vec2 uRadius;
uniform float uStrength;
varying vec2 vLocal;
void main() {
  vec2 q = vLocal / uRadius;
  float d = length(q);
  float core = 1.0 - smoothstep(0.0, 0.55, d);
  float soft = 1.0 - smoothstep(0.2, 1.0, d);
  float a = (core * 0.55 + soft * 0.45) * uStrength;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}
`;

export interface ContactShadow {
  mesh: THREE.Mesh;
  uniforms: { uRadius: THREE.IUniform<THREE.Vector2>; uStrength: THREE.IUniform<number> };
}

/** 贴地的软椭圆接触阴影(压在地面之上、所有物体之下)。 */
export function createContactShadow(rx: number, rz: number, strength = 0.6): ContactShadow {
  const uniforms = { uRadius: { value: new THREE.Vector2(rx, rz) }, uStrength: { value: strength } };
  const material = quadMaterial({ vertexShader: QUAD_VERT, fragmentShader: FRAG, uniforms });
  const mesh = placeMesh(makeQuad(rx * 2.4, rz * 2.4, -rx * 1.2, -rz * 1.2), material, 0, 0, LAYER.shadow);
  return { mesh, uniforms };
}
