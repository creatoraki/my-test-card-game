import * as THREE from "three";
import { LAYER } from "../core/depthSort";

/** 一次性爆发粒子的种类: 电火花 / 尘埃 / 金色闪点 / 余烬 / 暗紫烟尘。 */
export type BurstKind = "sparks" | "dust" | "glint" | "ember" | "shade";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  r: number;
  g: number;
  b: number;
  drag: number;
  gravity: number;
  floorY: number;
}

const MAX = 700;

const PRESET: Record<BurstKind, { speed: [number, number]; life: [number, number]; size: [number, number]; color: [number, number, number]; drag: number; gravity: number; up: number }> = {
  sparks: { speed: [180, 520], life: [0.25, 0.7], size: [3, 6], color: [2.4, 1.5, 0.6], drag: 1.2, gravity: -1400, up: 0.6 },
  dust: { speed: [20, 90], life: [0.8, 1.8], size: [7, 16], color: [0.35, 0.32, 0.3], drag: 2.2, gravity: 30, up: 0.4 },
  glint: { speed: [30, 140], life: [0.8, 1.6], size: [4, 9], color: [2.2, 1.8, 0.9], drag: 1.8, gravity: 60, up: 1 },
  ember: { speed: [20, 110], life: [0.9, 2.2], size: [3, 7], color: [2.0, 0.7, 0.25], drag: 1.5, gravity: 90, up: 1 },
  shade: { speed: [30, 120], life: [0.7, 1.6], size: [10, 22], color: [0.5, 0.25, 0.9], drag: 2, gravity: 70, up: 0.8 },
};

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

const VERT = /* glsl */ `
attribute vec4 aColor;
attribute float aSize;
uniform float uPixelScale;
varying vec4 vColor;
void main() {
  vColor = aColor;
  gl_PointSize = aSize * uPixelScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float core = exp(-d * d * 6.0);
  float a = core * vColor.a;
  gl_FragColor = vec4(vColor.rgb * a, 0.0);
}
`;

/**
 * CPU 模拟的一次性爆发粒子(火花、尘土、闪点、余烬)。统一一个点精灵批次, 加色混合,
 * 画在所有物体之上。粒子落地会弹一下再熄灭。
 */
export class BurstFx {
  readonly points: THREE.Points;
  private particles: Particle[] = [];
  private geo = new THREE.BufferGeometry();
  private pos = new Float32Array(MAX * 3);
  private color = new Float32Array(MAX * 4);
  private size = new Float32Array(MAX);
  readonly uniforms = { uPixelScale: { value: 1 } };

  constructor() {
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aColor", new THREE.BufferAttribute(this.color, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geo, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = LAYER.air;
  }

  /** 在世界坐标 (x, y) 爆发; floorY 为粒子落地的世界 y。 */
  spawn(kind: BurstKind, x: number, y: number, count: number, floorY: number, tint?: THREE.Color): void {
    const p = PRESET[kind];
    for (let i = 0; i < count && this.particles.length < MAX; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(p.speed[0], p.speed[1]);
      const life = rand(p.life[0], p.life[1]);
      this.particles.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: Math.cos(ang) * sp,
        vy: Math.abs(Math.sin(ang)) * sp * p.up + Math.sin(ang) * sp * (1 - p.up),
        life,
        max: life,
        size: rand(p.size[0], p.size[1]),
        r: tint ? tint.r * 2 : p.color[0],
        g: tint ? tint.g * 2 : p.color[1],
        b: tint ? tint.b * 2 : p.color[2],
        drag: p.drag,
        gravity: p.gravity,
        floorY,
      });
    }
  }

  update(dt: number): void {
    const alive: Particle[] = [];
    for (const q of this.particles) {
      q.life -= dt;
      if (q.life <= 0) continue;
      q.vx *= Math.exp(-q.drag * dt);
      q.vy = q.vy * Math.exp(-q.drag * dt) + q.gravity * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.y < q.floorY && q.vy < 0) {
        q.y = q.floorY;
        q.vy *= -0.35;
        q.vx *= 0.6;
      }
      alive.push(q);
    }
    this.particles = alive;
    let n = 0;
    for (const q of alive) {
      const k = q.life / q.max;
      this.pos.set([q.x, q.y, 0], n * 3);
      this.color.set([q.r, q.g, q.b, Math.min(1, k * 1.6)], n * 4);
      this.size[n] = q.size * (0.5 + 0.5 * k);
      n++;
    }
    this.geo.setDrawRange(0, n);
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
  }

  clear(): void {
    this.particles = [];
    this.geo.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
