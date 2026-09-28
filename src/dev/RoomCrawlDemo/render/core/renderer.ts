import * as THREE from "three";

export const BACKGROUND = 0x020304;

/**
 * 渲染器: 全场景都是透明 ShaderMaterial 面片, 靠 renderOrder 排序, 不需要深度与阴影贴图。
 * 色调映射(ACES)与 sRGB 编码由后处理的最终合成 pass 自行完成, 渲染器本身不做色调映射。
 */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false, depth: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(BACKGROUND, 1);
  renderer.sortObjects = true;
  return renderer;
}
