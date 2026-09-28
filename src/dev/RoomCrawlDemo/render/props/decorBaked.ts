import * as THREE from "three";
import { BLANK_TEXTURE, bakeMaterial, type BakeJob } from "../bake/surfaceBaker";
import { makeQuad, placeMesh, quadMaterial } from "../core/quad";
import { MOTIFS_GLSL } from "../glsl/motifs";
import { FRAG_PRELUDE, QUAD_VERT } from "../glsl/prelude";
import type { LightRig } from "../lighting/lightRig";
import { PROP_COMMON } from "./propHighlight";

/** SDF 按 ±SDF_RANGE px 映射到 0~1(描边只用到边缘附近几 px)。 */
const SDF_RANGE = 16;

/**
 * 装饰物烘焙: 形体、材质(含 weather 风化)在进房时烘成三张贴图,
 * 每帧只做光照、底部暗部、贴地雾与 SDF 描边。
 * G0 = 预乘 albedo + alpha(线性, 双线性过滤在边缘也不发黑), G1 = 法线 + gloss, G2.r = SDF。
 */
const DECOR_BAKE_MAIN = /* glsl */ `
layout(location = 0) out highp vec4 dOut0;
layout(location = 1) out highp vec4 dOut1;
layout(location = 2) out highp vec4 dOut2;
void main() {
  vec2 p = vec2(vLocal.x * uFlip, vLocal.y);
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 emit = vec3(0.0);
  float gloss = 0.2;
  vec4 alb = propShade(p, n, emit, gloss);
  n.x *= uFlip;
  n = normalize(n);
  float a = clamp(alb.a, 0.0, 1.0);
  dOut0 = vec4(clamp(alb.rgb, 0.0, 1.0) * a, a);
  dOut1 = vec4(n * 0.5 + 0.5, clamp(gloss, 0.0, 1.0));
  dOut2 = vec4(clamp(propSdf(p) / ${(SDF_RANGE * 2).toFixed(1)} + 0.5, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;

const DECOR_LIVE_MAIN = /* glsl */ `
uniform sampler2D tD0;
uniform sampler2D tD1;
uniform sampler2D tD2;
varying vec2 vUv;
void main() {
  vec4 g0 = texture2D(tD0, vUv);
  float a = g0.a;
  float d = (texture2D(tD2, vUv).r - 0.5) * ${(SDF_RANGE * 2).toFixed(1)};
  float ol = sdfOutline(d, 1.8) * (1.0 - a);
  if (a < 0.002) {
    gl_FragColor = vec4(C_OUTLINE * ol, ol);
    return;
  }
  vec4 g1 = texture2D(tD1, vUv);
  vec3 n = normalize(g1.xyz * 2.0 - 1.0);
  vec3 pos = vec3(vWorld.x, max(vLocal.y, 0.0), uProp.z + 10.0);
  vec3 col = shade(g0.rgb / a, pos, n, g1.w, 1.0);
  col *= mix(0.5, 1.0, smoothstep(0.0, 30.0, vLocal.y));
  col = lowFog(col, vLocal.y, uProp.z);
  gl_FragColor = vec4(col * a + C_OUTLINE * ol, a + ol);
}
`;

export interface BakedDecorSpec {
  /** 烘焙缓存键(房间内唯一)。 */
  key: string;
  /** 定义 propShade / propSdf 的 GLSL(依赖 PROP_COMMON)。 */
  glsl: string;
  kind: number;
  bounds: readonly [w: number, h: number, x0: number, y0: number];
  seed: number;
  flip: boolean;
  x: number;
  y: number;
  z: number;
  scale: number;
  order: number;
}

function propUniforms(spec: BakedDecorSpec): Record<string, THREE.IUniform> {
  return {
    uAnim: { value: 0 },
    uSearched: { value: 0 },
    uFocus: { value: 0 },
    uFlip: { value: spec.flip ? -1 : 1 },
    uPSeed: { value: spec.seed },
    uProp: { value: new THREE.Vector3(spec.x, 0, spec.z) },
    uAccent: { value: new THREE.Color(0) },
    uLightIndex: { value: 0 },
  };
}

/** 一个装饰物: 实时网格 + 待执行的烘焙工作。 */
export interface BakedDecor {
  mesh: THREE.Mesh;
  job: BakeJob;
}

/**
 * 建装饰物的实时网格与烘焙工作; 烘焙前实时材质挂占位贴图。
 * 烘焙完成(或缓存命中)时 apply 回填贴图; 贴图归烘焙缓存所有, 不随房间释放。
 */
export function buildBakedDecor(spec: BakedDecorSpec, rig: LightRig): BakedDecor {
  const [w, h, x0, y0] = spec.bounds;
  const bakeMat = bakeMaterial(
    QUAD_VERT,
    FRAG_PRELUDE + MOTIFS_GLSL + PROP_COMMON + spec.glsl + DECOR_BAKE_MAIN,
    { ...rig.uniforms, ...propUniforms(spec) },
    { KIND: spec.kind },
  );
  const live = quadMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: FRAG_PRELUDE + PROP_COMMON + DECOR_LIVE_MAIN,
    uniforms: { ...propUniforms(spec), tD0: { value: BLANK_TEXTURE }, tD1: { value: BLANK_TEXTURE }, tD2: { value: BLANK_TEXTURE } },
    rig: rig.uniforms,
  });
  const mesh = placeMesh(makeQuad(w, h, x0, y0), live, spec.x, spec.y, spec.order);
  mesh.scale.setScalar(spec.scale);

  return {
    mesh,
    job: {
      key: spec.key,
      mesh: placeMesh(makeQuad(w, h, x0, y0), bakeMat, 0, 0, 0),
      rect: { x: x0, y: y0, w, h },
      count: 3,
      // 按显示缩放烘焙, 纹素与屏幕像素一一对应, 抗锯齿宽度与实时渲染一致
      density: spec.scale,
      apply: (baked) => {
        const [t0, t1, t2] = baked.textures;
        live.uniforms.tD0.value = t0;
        live.uniforms.tD1.value = t1;
        live.uniforms.tD2.value = t2;
      },
    },
  };
}
