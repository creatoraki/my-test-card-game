import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { DESIGN_H, DESIGN_W } from "../../data/layout";
import { FinalShader } from "./finalShader";

export interface GradeStyle {
  tint: number;
  shadowTint: number;
  bloom: number;
  /** 饱和度(1 = 原样), 缺省 0.9。 */
  saturation?: number;
  /** 暗角强度, 缺省 0.58。 */
  vignette?: number;
  /** 曝光, 缺省 1.05。 */
  exposure?: number;
}

export interface PostPipeline {
  /** 场景渲染进的离屏目标(预编译时绑定它, 让程序缓存键与实际渲染一致)。 */
  target: THREE.WebGLRenderTarget;
  setSize(width: number, height: number, pixelRatio: number): void;
  setStyle(style: GradeStyle): void;
  /** 虹膜开合 0(全黑)~1(全开), 圆心为设计 px。 */
  setIris(open: number, cx: number, cy: number, color: THREE.Color): void;
  setImpact(v: number): void;
  render(t: number): void;
  dispose(): void;
}

/** 泛光在一半分辨率上提取与模糊(泛光本身很柔, 看不出差别), 开销约为原来的四分之一。 */
class HalfResBloomPass extends UnrealBloomPass {
  override setSize(width: number, height: number): void {
    super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }
}

/** RenderPass → 半分辨率泛光 → 最终合成(色调映射 + sRGB + 调色 + 虹膜转场)。 */
export function createPostPipeline(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): PostPipeline {
  // 全场景不用深度, 离屏缓冲也不带深度
  const target = new THREE.WebGLRenderTarget(DESIGN_W, DESIGN_H, { type: THREE.HalfFloatType, depthBuffer: false });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new HalfResBloomPass(new THREE.Vector2(DESIGN_W / 2, DESIGN_H / 2), 0.75, 0.62, 0.78);
  composer.addPass(bloom);
  const final = new ShaderPass(FinalShader);
  composer.addPass(final);
  const u = final.uniforms;

  return {
    target,
    setSize: (w, h, pixelRatio) => {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(w, h);
      u.uResolution.value.set(w * pixelRatio, h * pixelRatio);
    },
    setStyle: (style) => {
      // 调色发生在 sRGB 编码之后, 十六进制值按原样使用, 不做线性转换
      u.uTint.value.setHex(style.tint, THREE.LinearSRGBColorSpace);
      u.uShadowTint.value.setHex(style.shadowTint, THREE.LinearSRGBColorSpace);
      bloom.strength = style.bloom;
      u.uSaturation.value = style.saturation ?? 0.9;
      u.uVignette.value = style.vignette ?? 0.58;
      u.uExposure.value = style.exposure ?? 1.05;
    },
    setIris: (open, cx, cy, color) => {
      u.uIris.value = open;
      u.uCenter.value.set(cx / DESIGN_W, 1 - cy / DESIGN_H);
      u.uGlow.value.copy(color);
    },
    setImpact: (v) => {
      u.uImpact.value = v;
    },
    render: (t) => {
      u.uTime.value = t;
      composer.render();
    },
    dispose: () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
  };
}
