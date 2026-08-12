import {
  AmbientLight,
  Color,
  DirectionalLight,
  LinearSRGBColorSpace,
  MathUtils,
  NoToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PointLight,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createLanternBody } from "./lanternBody";
import { legacyColor, setLegacyStyle } from "./lanternColorSpace";
import {
  BLOOM,
  CAMERA_POS,
  GLOW_ALPHA,
  GROUP_BASE_Y,
  LIGHT_SCALE,
  LOOK_AT,
  VIEW_SIZE,
} from "./lanternConstants";
import {
  createInnerParticleField,
  createOuterParticleField,
  makeParticleTexture,
  updateInnerParticleColors,
  updateInnerParticles,
} from "./lanternParticles";

interface LanternUpdate {
  time: number;
  dt: number;
  color: string;
  intensity: number;
}

export interface LanternScene {
  layout(size: number, stageScale: number, canvasPad: number): void;
  update(update: LanternUpdate): void;
  render(): void;
  dispose(): void;
}

class AlphaCapturePass extends Pass {
  private readonly target = new WebGLRenderTarget(1, 1);
  private readonly material = new ShaderMaterial({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, texture2D(tDiffuse, vUv).a);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  private readonly quad = new FullScreenQuad(this.material);

  constructor() {
    super();
    this.needsSwap = false;
  }

  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  render(renderer: WebGLRenderer, _writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.target);
    renderer.clear();
    this.quad.render(renderer);
  }

  get texture() {
    return this.target.texture;
  }

  dispose(): void {
    this.target.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}

export function createLanternScene(canvas: HTMLCanvasElement, initialColor: string): LanternScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(legacyColor(0x000000), 0);
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const camera = new OrthographicCamera(
    -VIEW_SIZE,
    VIEW_SIZE,
    VIEW_SIZE,
    -VIEW_SIZE,
    0.1,
    50,
  );
  camera.position.set(CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z);
  camera.lookAt(LOOK_AT.x, LOOK_AT.y, LOOK_AT.z);

  const body = createLanternBody();
  const lantern = body.group;
  lantern.position.y = GROUP_BASE_Y;
  scene.add(lantern);

  const currentColor = new Color();
  const targetColor = new Color();
  setLegacyStyle(currentColor, initialColor);
  setLegacyStyle(targetColor, initialColor);

  const particleTexture = makeParticleTexture();
  const innerParticles = createInnerParticleField(particleTexture, currentColor);
  const outerParticles = createOuterParticleField(particleTexture, currentColor);
  lantern.add(innerParticles.points, outerParticles.points);

  const ambient = new AmbientLight(legacyColor(0x404066));
  const backLight = new DirectionalLight(legacyColor(0x446688), 0.5);
  backLight.position.set(-3, 1, -2);
  scene.add(ambient, backLight);

  const pointLight = new PointLight(currentColor, 2.0 * LIGHT_SCALE, 5.5, 1);
  pointLight.position.set(0, 0, 0);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 512;
  pointLight.shadow.mapSize.height = 512;
  pointLight.shadow.bias = -0.0005;
  const pointLight2 = new PointLight(currentColor, 2.0 * 0.6 * LIGHT_SCALE, 4.5, 1);
  pointLight2.position.set(0, 0.2, 0);
  lantern.add(pointLight, pointLight2);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  renderPass.clearAlpha = 0;
  const alphaCapturePass = new AlphaCapturePass();
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), 1.5, 0.4, 0.85);
  bloomPass.threshold = BLOOM.threshold;
  bloomPass.strength = 1.2;
  bloomPass.radius = BLOOM.radius;
  const alphaPass = new ShaderPass(
    new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        originalAlpha: { value: alphaCapturePass.texture },
        glowParams: { value: new Vector3(GLOW_ALPHA.gain, GLOW_ALPHA.cutoff, GLOW_ALPHA.max) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D originalAlpha;
        uniform vec3 glowParams;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          float sourceAlpha = texture2D(originalAlpha, vUv).a;
          // 用泛光亮度推导光晕 alpha，压掉大范围低强度扩散。
          float luma = max(max(c.r, c.g), c.b) * glowParams.x;
          float glow = smoothstep(glowParams.y, 1.0, luma) * glowParams.z;
          float a = max(sourceAlpha, glow);
          // 预乘 alpha 合成要求 RGB 按最终 alpha 缩放，避免透明区域漏色。
          gl_FragColor = vec4(c.rgb * a, a);
        }
      `,
    }),
  );
  composer.addPass(renderPass);
  composer.addPass(alphaCapturePass);
  composer.addPass(bloomPass);
  composer.addPass(alphaPass);

  let laidOut = false;
  const geometries: BufferGeometry[] = [
    ...body.geometries,
    innerParticles.geometry,
    outerParticles.geometry,
  ];
  const materials = new Set<Material>([
    ...body.materials,
    innerParticles.material,
    outerParticles.material,
  ]);

  return {
    layout(size, stageScale, canvasPad) {
      const renderSize = Math.max(1, Math.round(size + canvasPad * 2));
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * stageScale, 2));
      renderer.setSize(renderSize, renderSize, false);
      composer.setSize(renderSize, renderSize);
      laidOut = true;
    },

    update({ time, dt, color, intensity }) {
      try {
        setLegacyStyle(targetColor, color);
      } catch {
        setLegacyStyle(targetColor, initialColor);
      }
      currentColor.r = MathUtils.damp(currentColor.r, targetColor.r, 7, dt);
      currentColor.g = MathUtils.damp(currentColor.g, targetColor.g, 7, dt);
      currentColor.b = MathUtils.damp(currentColor.b, targetColor.b, 7, dt);

      pointLight.color.copy(currentColor);
      pointLight.intensity = intensity * LIGHT_SCALE;
      pointLight2.color.copy(currentColor);
      pointLight2.intensity = intensity * 0.6 * LIGHT_SCALE;
      body.innerGlow.material.color.copy(currentColor);
      body.innerGlow.material.opacity = 0.5 + intensity * 0.15;
      outerParticles.material.color.copy(currentColor).multiplyScalar(1.2);
      bloomPass.strength = BLOOM.strengthBase + intensity * BLOOM.strengthGain;

      lantern.rotation.y = Math.sin(time * 0.3) * 0.03;
      lantern.position.y = GROUP_BASE_Y + Math.sin(time * 1.5) * 0.02;
      updateInnerParticleColors(innerParticles, currentColor);
      updateInnerParticles(innerParticles, time, dt);
      outerParticles.points.rotation.y += 0.005 * dt * 60;
      outerParticles.points.rotation.z += 0.002 * dt * 60;
    },

    render() {
      if (laidOut) composer.render();
    },

    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      particleTexture.dispose();
      alphaCapturePass.dispose();
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
      composer.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      if (import.meta.env.PROD) renderer.forceContextLoss();
    },
  };
}
