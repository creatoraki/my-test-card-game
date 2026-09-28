import type * as THREE from "three";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { RigUniforms } from "../lighting/lightRig";
import { quadMaterial } from "../core/quad";
import type { ZoneShaders } from "../zones";
import { ROOM_HEADER } from "./roomHeader";

const FAR_MAIN = /* glsl */ `
uniform sampler2D tWallG0;
uniform vec4 uWallRect;
varying vec2 vWorld;
void main() {
  // 远景只透过后墙的开口可见: 墙根以下被地面挡住, 烘焙后墙不透明处直接跳过
  if (vWorld.y < WALL_BASE) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float cover = texture2D(tWallG0, (vWorld - uWallRect.xy) / uWallRect.zw).a;
  if (cover > 0.996) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 scr = vec2(vWorld.x - uCamX, vWorld.y);
  gl_FragColor = vec4(zoneFar(scr), 1.0);
}
`;

/**
 * 远景背景层: 跟随相机的全屏面片, 视差由区域函数自行按 uCamX 计算。
 * wall 为后墙烘焙的 G0(alpha 即遮挡)与其世界矩形的 uniforms(烘焙完成后回填)。
 */
export function farMaterial(zone: ZoneShaders, rig: RigUniforms, room: Record<string, THREE.IUniform>, wall: { tWallG0: THREE.IUniform<THREE.Texture>; uWallRect: THREE.IUniform<THREE.Vector4> }): THREE.ShaderMaterial {
  return quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + MOTIFS_GLSL + ROOM_HEADER + zone.far + FAR_MAIN,
    uniforms: { ...room, ...wall },
    rig,
  });
}
