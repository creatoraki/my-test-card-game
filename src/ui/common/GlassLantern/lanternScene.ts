import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
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

const VIEW_SIZE = 3.2;
const GLASS_CENTER_Y = 0.86;
const INNER_COUNT = 140;
const OUTER_COUNT = 80;
const COLOR_DAMP = 7;
const MOTION_DAMP = 5;

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

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  lifeMax: number;
}

interface ParticleField {
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  positions: Float32Array;
  particles: Particle[];
  external: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

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
  camera.lookAt(0, 0.8, 0);

  const lantern = new Group();
  scene.add(lantern);

  const currentColor = new Color(initialColor);
  const targetColor = new Color(initialColor);
  const glassMaterial = new MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.12,
    metalness: 0.12,
    transmission: 0.55,
    thickness: 0.3,
    ior: 1.45,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12,
    side: DoubleSide,
    depthWrite: false,
  });
  const glass = new Mesh(new SphereGeometry(0.88, 32, 24), glassMaterial);
  glass.position.y = GLASS_CENTER_Y;
  lantern.add(glass);

  const innerMaterial = new MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: 0.26,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const innerGlow = new Mesh(new SphereGeometry(0.6, 20, 16), innerMaterial);
  innerGlow.position.y = GLASS_CENTER_Y;
  innerGlow.renderOrder = 1;
  lantern.add(innerGlow);

  const metalMaterial = new MeshStandardMaterial({
    color: 0x8b9ca3,
    metalness: 0.84,
    roughness: 0.22,
    emissive: currentColor,
    emissiveIntensity: 0.32,
  });
  const metalGeometries: BufferGeometry[] = [];
  const metalMeshes: Mesh[] = [];

  const addMetal = (geometry: BufferGeometry, position?: Vector3, rotation?: Vector3) => {
    const mesh = new Mesh(geometry, metalMaterial);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
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
  const innerParticles = createParticleField(INNER_COUNT, false, particleTexture);
  const outerParticles = createParticleField(OUTER_COUNT, true, particleTexture);
  lantern.add(innerParticles.points, outerParticles.points);

  const ambient = new AmbientLight(0x9aa8b2, 0.62);
  const key = new PointLight(currentColor, 4.2, 8, 2);
  key.position.set(0.8, 1.25, 1.1);
  const fill = new PointLight(0x87cfe7, 1.8, 7, 2);
  fill.position.set(-1.2, 1.8, -1.2);
  const backlight = new PointLight(0x5d8dff, 1.1, 8, 2);
  backlight.position.set(0, 1.1, -2.2);
  lantern.add(ambient, key, fill, backlight);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  renderPass.clearAlpha = 0;
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), 1.18, 0.78, 0.22);
  const alphaPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      alphaBoost: { value: 1.35 },
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
      innerMaterial.opacity = 0.22 + clamp(intensity, 0.1, 2) * 0.08;
      metalMaterial.emissive.copy(currentColor);
      metalMaterial.emissiveIntensity = 0.24 + clamp(intensity, 0.1, 2) * 0.2;
      key.color.copy(currentColor);
      key.intensity = MathUtils.damp(key.intensity, 4.2 * intensity, 8, dt);
      bloomPass.strength = MathUtils.damp(bloomPass.strength, 1.05 + intensity * 0.22, 8, dt);
      innerParticles.material.color.copy(currentColor);
      outerParticles.material.color.copy(currentColor);
      innerParticles.material.opacity = 0.42 + intensity * 0.12;
      outerParticles.material.opacity = 0.34 + intensity * 0.14;
      updateParticles(innerParticles, dt, time);
      updateParticles(outerParticles, dt, time);
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

function createParticleField(count: number, external: boolean, texture: CanvasTexture): ParticleField {
  const positions = new Float32Array(count * 3);
  const particles = Array.from({ length: count }, () => ({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    lifeMax: 0,
  }));
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: 0xffffff,
    map: texture,
    size: external ? 0.048 : 0.04,
    transparent: true,
    opacity: external ? 0.4 : 0.52,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const field = { points, geometry, material, positions, particles, external };
  particles.forEach((particle) => resetParticle(particle, external));
  writeParticlePositions(field);
  return field;
}

function resetParticle(particle: Particle, external: boolean): void {
  particle.lifeMax = external ? randomBetween(0.5, 1.35) : randomBetween(0.8, 2.6);
  particle.life = particle.lifeMax;
  particle.x = randomBetween(-0.08, 0.08);
  particle.y = randomBetween(0.3, 1.38);
  particle.z = randomBetween(-0.08, 0.08);
  if (external) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(0.28, 0.85);
    particle.vx = Math.cos(angle) * speed;
    particle.vy = randomBetween(0.12, 0.62);
    particle.vz = Math.sin(angle) * speed;
  } else {
    particle.x = randomBetween(-0.44, 0.44);
    particle.z = randomBetween(-0.44, 0.44);
    particle.vx = randomBetween(-0.05, 0.05);
    particle.vy = randomBetween(0.08, 0.22);
    particle.vz = randomBetween(-0.05, 0.05);
  }
}

function updateParticles(field: ParticleField, dt: number, time: number): void {
  for (const particle of field.particles) {
    particle.life -= dt;
    if (particle.life <= 0) resetParticle(particle, field.external);
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.z += particle.vz * dt;
    if (field.external) {
      particle.vy -= 0.34 * dt;
      particle.vx *= Math.exp(-1.6 * dt);
      particle.vz *= Math.exp(-1.6 * dt);
    } else {
      particle.x += Math.sin(time * 1.3 + particle.lifeMax) * 0.003 * dt;
      particle.z += Math.cos(time * 1.1 + particle.lifeMax) * 0.003 * dt;
    }
  }
  writeParticlePositions(field);
}

function writeParticlePositions(field: ParticleField): void {
  field.particles.forEach((particle, index) => {
    const offset = index * 3;
    field.positions[offset] = particle.x;
    field.positions[offset + 1] = particle.y;
    field.positions[offset + 2] = particle.z;
  });
  const position = field.geometry.getAttribute("position");
  position.needsUpdate = true;
}

function makeParticleTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.35, "#ffffff");
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = "srgb";
  return texture;
}
