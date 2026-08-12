import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  NoColorSpace,
  Points,
  PointsMaterial,
} from "three";
import { INNER_COUNT, OUTER_COUNT } from "./lanternConstants";
import { legacyColor } from "./lanternColorSpace";

export interface ParticleField {
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  positions: Float32Array;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createInnerParticleField(
  texture: CanvasTexture,
  color: Color,
): ParticleField {
  const positions = new Float32Array(INNER_COUNT * 3);
  const colors = new Float32Array(INNER_COUNT * 3);
  for (let index = 0; index < INNER_COUNT; index += 1) {
    const offset = index * 3;
    const radius = 0.5 + Math.random() * 0.7;
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
    color: legacyColor(0xffffff),
    map: texture,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
    vertexColors: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const field = { points, geometry, material, positions };
  updateInnerParticleColors(field, color);
  return field;
}

export function createOuterParticleField(
  texture: CanvasTexture,
  color: Color,
): ParticleField {
  const positions = new Float32Array(OUTER_COUNT * 3);
  for (let index = 0; index < OUTER_COUNT; index += 1) {
    const offset = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.15 + Math.random() * 0.5;
    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = (Math.random() - 0.5) * 1.8;
    positions[offset + 2] = Math.sin(angle) * radius;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const material = new PointsMaterial({
    color: color.clone().multiplyScalar(1.2),
    map: texture,
    size: 0.06,
    transparent: true,
    opacity: 0.7,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material, positions };
}

export function updateInnerParticleColors(field: ParticleField, color: Color): void {
  const colors = field.geometry.getAttribute("color");
  if (!colors) return;
  for (let index = 0; index < colors.array.length; index += 3) {
    colors.array[index] = Math.min(1, color.r * 1.2 + 0.2);
    colors.array[index + 1] = Math.min(1, color.g * 1.2 + 0.2);
    colors.array[index + 2] = Math.min(1, color.b * 1.2 + 0.2);
  }
  colors.needsUpdate = true;
}

export function updateInnerParticles(field: ParticleField, time: number, dt: number): void {
  field.points.rotation.y += 0.002 * dt * 60;
  field.points.rotation.x = Math.sin(time * 0.5) * 0.05;
  for (let index = 0; index < field.positions.length; index += 3) {
    const x = field.positions[index];
    const y = field.positions[index + 1];
    const z = field.positions[index + 2];
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length <= 0.1) continue;
    const newLength = clamp(
      length + Math.sin(time * 5 + index / 3) * 0.008,
      0.35,
      1.05,
    );
    field.positions[index] = (x / length) * newLength;
    field.positions[index + 1] = (y / length) * newLength;
    field.positions[index + 2] = (z / length) * newLength;
  }
  field.geometry.getAttribute("position").needsUpdate = true;
}

export function makeParticleTexture(): CanvasTexture {
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
    context.arc(32, 32, 32, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  return texture;
}
