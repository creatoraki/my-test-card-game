import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  OrthographicCamera,
  PointLight,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  Float32BufferAttribute,
  type Material,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const VIEW_SIZE = 3.5;
const GLASS_CENTER_Y = 0.86;
const GLASS_SCALE = 0.8;
const INNER_COUNT = 280;
const OUTER_COUNT = 150;
const COLOR_DAMP = 7;
const MOTION_DAMP = 5;
const BLOOM_RADIUS = 0.8;
const LIGHT_GAIN = 1;

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

interface ParticleField {
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  positions: Float32Array;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createLanternScene(canvas: HTMLCanvasElement, initialColor: string): LanternScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const scene = new Scene();
  const camera = new OrthographicCamera(
    -VIEW_SIZE / 2,
    VIEW_SIZE / 2,
    VIEW_SIZE / 2,
    -VIEW_SIZE / 2,
    0.1,
    100,
  );
  camera.position.set(5, 5.5, 5);
  camera.lookAt(0, 0.95, 0);

  const lantern = new Group();
  scene.add(lantern);

  const currentColor = new Color(initialColor);
  const targetColor = new Color(initialColor);
  const glassMaterial = new MeshPhysicalMaterial({
    color: 0xe0f0ff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.12,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5,
    ior: 1.5,
    depthWrite: false,
  });
  const glass = new Mesh(new SphereGeometry(0.88, 32, 24), glassMaterial);
  glass.position.y = GLASS_CENTER_Y;
  lantern.add(glass);

  const innerMaterial = new MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: 0.5,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const innerGlow = new Mesh(new SphereGeometry(0.75 * GLASS_SCALE, 20, 16), innerMaterial);
  innerGlow.position.y = GLASS_CENTER_Y;
  innerGlow.renderOrder = 1;
  lantern.add(innerGlow);

  const metalMaterial = new MeshStandardMaterial({
    color: 0xb89a7a,
    metalness: 0.8,
    roughness: 0.3,
    emissive: 0x111111,
  });
  const metalGeometries: BufferGeometry[] = [];
  const metalMeshes: Mesh[] = [];

  const addMetal = (geometry: BufferGeometry, position?: Vector3, rotation?: Vector3) => {
    const mesh = new Mesh(geometry, metalMaterial);
    if (position) mesh.position.copy(position);
    // Euler.copy 不能接收 Vector3，否则会把旋转顺序拷贝成 undefined。
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    lantern.add(mesh);
    metalGeometries.push(geometry);
    metalMeshes.push(mesh);
    return mesh;
  };

  for (const [y, radius] of [
    [0.28, 0.72],
    [0.86, 0.88],
    [1.44, 0.72],
  ] as const) {
    addMetal(new TorusGeometry(radius, 0.028, 8, 48), new Vector3(0, y, 0), new Vector3(Math.PI / 2, 0, 0));
  }
  for (let index = 0; index < 4; index += 1) {
    addMetal(new TorusGeometry(0.88, 0.022, 8, 48), new Vector3(0, GLASS_CENTER_Y, 0), new Vector3(0, index * Math.PI / 4, 0));
  }
  addMetal(new CylinderGeometry(0.54, 0.7, 0.11, 32), new Vector3(0, -0.08, 0));
  addMetal(new CylinderGeometry(0.54, 0.46, 0.11, 32), new Vector3(0, 1.79, 0));
  addMetal(new SphereGeometry(0.14, 16, 12), new Vector3(0, 1.98, 0));

  const handleCurve = new QuadraticBezierCurve3(
    new Vector3(-0.56, 1.7, 0),
    new Vector3(0, 2.42, 0),
    new Vector3(0.56, 1.7, 0),
  );
  addMetal(new TubeGeometry(handleCurve, 24, 0.045, 8, false));
  addMetal(new SphereGeometry(0.09, 12, 8), new Vector3(-0.56, 1.7, 0));
  addMetal(new SphereGeometry(0.09, 12, 8), new Vector3(0.56, 1.7, 0));

  const particleTexture = makeParticleTexture();
  const innerParticles = createInnerParticleField(INNER_COUNT, particleTexture, currentColor);
  const outerParticles = createOuterParticleField(OUTER_COUNT, particleTexture, currentColor);
  lantern.add(innerParticles.points, outerParticles.points);

  const ambient = new AmbientLight(0x404066);
  const pointLight = new PointLight(currentColor, 2.0 * LIGHT_GAIN, 5.5 * GLASS_SCALE, 1);
  pointLight.position.set(0, GLASS_CENTER_Y, 0);
  const pointLight2 = new PointLight(currentColor, 1.2 * LIGHT_GAIN, 4.5 * GLASS_SCALE, 1);
  pointLight2.position.set(0, GLASS_CENTER_Y + 0.2 * GLASS_SCALE, 0);
  lantern.add(ambient, pointLight, pointLight2);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  renderPass.clearAlpha = 0;
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), 1.2, BLOOM_RADIUS, 0.1);
  bloomPass.threshold = 0.1;
  bloomPass.radius = BLOOM_RADIUS;
  const alphaPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      alphaBoost: { value: 1.25 },
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
      uniform float alphaBoost;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        float alpha = clamp(max(max(c.r, c.g), c.b) * alphaBoost, 0.0, 1.0);
        gl_FragColor = vec4(c.rgb, alpha);
      }
    `,
  });
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(alphaPass);

  let laidOut = false;
  const disposables: BufferGeometry[] = [
    glass.geometry,
    innerGlow.geometry,
    innerParticles.geometry,
    outerParticles.geometry,
    ...metalGeometries,
  ];
  const materials = new Set<Material>([
    glassMaterial,
    innerMaterial,
    metalMaterial,
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
        targetColor.set(color);
      } catch {
        targetColor.set(initialColor);
      }
      currentColor.r = MathUtils.damp(currentColor.r, targetColor.r, COLOR_DAMP, dt);
      currentColor.g = MathUtils.damp(currentColor.g, targetColor.g, COLOR_DAMP, dt);
      currentColor.b = MathUtils.damp(currentColor.b, targetColor.b, COLOR_DAMP, dt);

      lantern.rotation.y = time * 0.16;
      lantern.position.y = MathUtils.damp(lantern.position.y, Math.sin(time * 0.8) * 0.045, MOTION_DAMP, dt);
      innerMaterial.color.copy(currentColor);
      innerMaterial.opacity = 0.5 + clamp(intensity, 0.1, 2) * 0.15;
      pointLight.color.copy(currentColor);
      pointLight.intensity = MathUtils.damp(pointLight.intensity, 2.0 * intensity * LIGHT_GAIN, 8, dt);
      pointLight2.color.copy(currentColor);
      pointLight2.intensity = MathUtils.damp(pointLight2.intensity, 1.2 * intensity * LIGHT_GAIN, 8, dt);
      bloomPass.strength = MathUtils.damp(bloomPass.strength, 0.9 + intensity * 0.35, 8, dt);
      updateInnerParticleColors(innerParticles, currentColor);
      outerParticles.material.color.copy(currentColor).multiplyScalar(1.2);
      updateInnerParticles(innerParticles, time, dt);
      outerParticles.points.rotation.y += 0.005 * dt * 60;
      outerParticles.points.rotation.z += 0.002 * dt * 60;
    },

    render() {
      if (laidOut) composer.render();
    },

    dispose() {
      disposables.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      particleTexture.dispose();
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
      composer.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      if (import.meta.env.PROD) renderer.forceContextLoss();
      metalMeshes.length = 0;
    },
  };
}

function createInnerParticleField(count: number, texture: CanvasTexture, color: Color): ParticleField {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const radius = (0.5 + Math.random() * 0.7) * GLASS_SCALE;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.asin(Math.random() * 2 - 1);
    positions[offset] = Math.cos(theta) * Math.cos(phi) * radius;
    positions[offset + 1] = Math.sin(phi) * radius * 0.9;
    positions[offset + 2] = Math.sin(theta) * Math.cos(phi) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const material = new PointsMaterial({
    color: 0xffffff,
    map: texture,
    size: 0.12 * GLASS_SCALE,
    transparent: true,
    opacity: 0.9,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
    toneMapped: false,
    vertexColors: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.position.y = GLASS_CENTER_Y;
  const field = { points, geometry, material, positions };
  updateInnerParticleColors(field, color);
  return field;
}

function createOuterParticleField(count: number, texture: CanvasTexture, color: Color): ParticleField {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = (1.15 + Math.random() * 0.5) * GLASS_SCALE;
    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = (Math.random() - 0.5) * 1.8 * GLASS_SCALE;
    positions[offset + 2] = Math.sin(angle) * radius;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: color.clone().multiplyScalar(1.2),
    map: texture,
    size: 0.06 * GLASS_SCALE,
    transparent: true,
    opacity: 0.7,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.position.y = GLASS_CENTER_Y;
  return { points, geometry, material, positions };
}

function updateInnerParticleColors(field: ParticleField, color: Color): void {
  const colors = field.geometry.getAttribute("color");
  if (!colors) return;
  for (let index = 0; index < colors.array.length; index += 3) {
    colors.array[index] = Math.min(1, color.r * 1.2 + 0.2);
    colors.array[index + 1] = Math.min(1, color.g * 1.2 + 0.2);
    colors.array[index + 2] = Math.min(1, color.b * 1.2 + 0.2);
  }
  colors.needsUpdate = true;
}

function updateInnerParticles(field: ParticleField, time: number, dt: number): void {
  field.points.rotation.y += 0.002 * dt * 60;
  field.points.rotation.x = Math.sin(time * 0.5) * 0.05;
  for (let index = 0; index < field.positions.length; index += 3) {
    const x = field.positions[index];
    const y = field.positions[index + 1];
    const z = field.positions[index + 2];
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length <= 0.1) continue;
    const newLength = clamp(
      length + Math.sin(time * 5 + index / 3) * 0.008 * GLASS_SCALE,
      0.35 * GLASS_SCALE,
      1.05 * GLASS_SCALE,
    );
    field.positions[index] = (x / length) * newLength;
    field.positions[index + 1] = (y / length) * newLength;
    field.positions[index + 2] = (z / length) * newLength;
  }
  field.geometry.getAttribute("position").needsUpdate = true;
}

function makeParticleTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,200,100,0.9)");
    gradient.addColorStop(1, "rgba(255,100,50,0)");
    context.beginPath();
    context.arc(32, 32, 24, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
