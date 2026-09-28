import * as THREE from "three";
import type { RigUniforms } from "../lighting/lightRig";

/**
 * px 单位的平面几何: 本地坐标 x ∈ [x0, x0 + w], y ∈ [y0, y0 + h]。
 * 着色器里的 vLocal 就是这套坐标, 形体 SDF 直接按 px 书写。
 */
export function makeQuad(w: number, h: number, x0 = -w / 2, y0 = 0): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(x0 + w / 2, y0 + h / 2, 0);
  return geo;
}

export interface QuadMaterialOptions {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, THREE.IUniform>;
  rig?: RigUniforms;
  blending?: THREE.Blending;
  defines?: Record<string, string | number>;
}

/**
 * 统一的面片材质: 透明、不测深度、不写深度, 共享灯光 uniforms。
 * 片元输出预乘 alpha(gl_FragColor.rgb 已乘 alpha), 便于发光与遮挡统一混合。
 */
export function quadMaterial(opts: QuadMaterialOptions): THREE.ShaderMaterial {
  const material = new THREE.ShaderMaterial({
    vertexShader: opts.vertexShader,
    fragmentShader: opts.fragmentShader,
    uniforms: { ...(opts.rig ?? {}), ...opts.uniforms },
    defines: opts.defines ?? {},
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: opts.blending ?? THREE.NormalBlending,
  });
  return material;
}

/** 摆放一个面片网格。 */
export function placeMesh(geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, order: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, 0);
  mesh.renderOrder = order;
  mesh.frustumCulled = false;
  return mesh;
}
