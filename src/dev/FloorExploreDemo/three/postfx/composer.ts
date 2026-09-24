import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GradeShader } from "./gradeShader";

/** AO 分辨率相对画面的比例, 省下大半开销, 视觉上几乎无差。 */
const AO_SCALE = 0.6;

/**
 * GTAO 只该看实体: 光锥、雾、光圈、积水这类透明面片写进法线 / 深度会糊出脏斑,
 * 渲染 AO 前临时隐藏所有透明材质的网格。
 */
class SolidOnlyGTAOPass extends GTAOPass {
  private hidden: THREE.Object3D[] = [];

  render(...args: Parameters<GTAOPass["render"]>): void {
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!object.visible || !(mesh.isMesh || (object as THREE.Sprite).isSprite)) return;
      const material = mesh.material as THREE.Material | THREE.Material[];
      const transparent = Array.isArray(material) ? material.some((m) => m.transparent) : material?.transparent;
      if (transparent || object.userData.fx) {
        object.visible = false;
        this.hidden.push(object);
      }
    });
    super.render(...args);
    for (const object of this.hidden) object.visible = true;
    this.hidden.length = 0;
  }

  setSize(width: number, height: number): void {
    super.setSize(Math.max(1, Math.round(width * AO_SCALE)), Math.max(1, Math.round(height * AO_SCALE)));
  }
}

export interface PostPipeline {
  composer: EffectComposer;
  setSize(width: number, height: number, pixelRatio: number): void;
  render(t: number): void;
  dispose(): void;
}

/** RenderPass → GTAO → Bloom → OutputPass(色调映射 + sRGB) → 调色。 */
export function createPostPipeline(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number, height: number): PostPipeline {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const gtao = new SolidOnlyGTAOPass(scene, camera, width, height);
  gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.4, scale: 1.15, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  gtao.blendIntensity = 0.9;
  composer.addPass(gtao);

  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.68, 0.6, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  return {
    composer,
    setSize: (w, h, pixelRatio) => {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(w, h);
      grade.uniforms.uResolution.value = [w * pixelRatio, h * pixelRatio];
    },
    render: (t) => {
      grade.uniforms.uTime.value = t;
      composer.render();
    },
    dispose: () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
  };
}
