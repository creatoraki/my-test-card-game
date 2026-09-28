import { LIGHTING_GLSL } from "./lighting";
import { NOISE_GLSL } from "./noise";
import { OUTLINE_GLSL } from "./outline";
import { PALETTE_GLSL } from "./palette";
import { SDF_GLSL } from "./sdf";

/** 片元着色器公共前缀(顺序有依赖: 噪声 → SDF → 调色板 → 光照 → 描边)。 */
export const FRAG_PRELUDE = NOISE_GLSL + SDF_GLSL + PALETTE_GLSL + LIGHTING_GLSL + OUTLINE_GLSL;

/** 不需要光照的片元(背景层、后处理)只带噪声、SDF 与调色板。 */
export const FRAG_PRELUDE_UNLIT = /* glsl */ `
uniform float uTime;
uniform float uCamX;
` + NOISE_GLSL + SDF_GLSL + PALETTE_GLSL;

/**
 * 通用面片顶点着色器: 输出世界坐标 vWorld(x, y 向上)与本地坐标 vLocal(px)。
 * 面片几何为以左下角为原点、单位为 px 的平面(见 core/quad.ts)。
 */
export const QUAD_VERT = /* glsl */ `
varying vec2 vWorld;
varying vec2 vLocal;
varying vec2 vUv;
void main() {
  vUv = uv;
  vLocal = position.xy;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xy;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
