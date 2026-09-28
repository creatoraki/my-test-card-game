import type * as THREE from "three";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import type { ZoneShaders } from "../zones";
import { ROOM_HEADER } from "./roomHeader";

const FORE_MAIN = /* glsl */ `
varying vec2 vWorld;
void main() {
  vec2 scr = vec2(vWorld.x - uCamX, vWorld.y);
  gl_FragColor = zoneFore(scr);
}
`;

/** 前景遮挡层(视差 1.3): 跟随相机的全屏面片, 区域函数返回预乘 alpha 的虚化剪影。 */
export function foreMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + zone.fore + FORE_MAIN,
    uniforms: room,
    rig,
  });
}
