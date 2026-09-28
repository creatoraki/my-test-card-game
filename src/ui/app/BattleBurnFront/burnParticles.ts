// 火线上的飞散物: 火星(叠加混合的短拖尾, 往外崩、往上飘)与灰烬(暗色小片, 慢慢上浮翻转)。
// 一个小粒子池, 按帧时长节流发射, 总数封顶。

import { BURN_VERTICES, type BurnFront } from "./burnGeometry";

interface Particle {
  kind: "spark" | "ash";
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  spin: number;
}

const MAX_PARTICLES = 120;
const SPARKS_PER_SEC = 110;
const ASH_PER_SEC = 28;
const PIERCE_BURST = 18;

const between = (min: number, max: number) => min + Math.random() * (max - min);

export interface ParticlePool {
  items: Particle[];
  sparkDebt: number;
  ashDebt: number;
}

export function createParticlePool(): ParticlePool {
  return { items: [], sparkDebt: 0, ashDebt: 0 };
}

function spawn(pool: ParticlePool, kind: Particle["kind"], x: number, y: number, nx: number, ny: number): void {
  if (pool.items.length >= MAX_PARTICLES) return;
  const spark = kind === "spark";
  const out = spark ? between(40, 170) : between(8, 36);
  const rise = spark ? between(30, 120) : between(18, 55);
  pool.items.push({
    kind,
    x,
    y,
    vx: nx * out + between(-20, 20),
    vy: ny * out - rise,
    age: 0,
    life: spark ? between(300, 700) : between(700, 1200),
    size: spark ? between(1.2, 2.4) : between(2, 5),
    spin: between(0, Math.PI),
  });
}

/** 烧穿那一刻: 从冲击点向四周崩出一小撮火星。 */
export function burstAtPierce(pool: ParticlePool, front: BurnFront): void {
  for (let index = 0; index < PIERCE_BURST; index++) {
    const angle = Math.random() * Math.PI * 2;
    spawn(pool, "spark", front.origin.x, front.origin.y, Math.cos(angle), Math.sin(angle));
  }
}

/** 从火线上仍在屏内的随机顶点发射。 */
export function emitFromRim(pool: ParticlePool, front: BurnFront, dtMs: number): void {
  pool.sparkDebt += (SPARKS_PER_SEC * dtMs) / 1000;
  pool.ashDebt += (ASH_PER_SEC * dtMs) / 1000;
  const emit = (kind: Particle["kind"], count: number) => {
    for (let n = 0; n < count; n++) {
      // 多试几次找一个在屏内的顶点; 火线大半出屏后自然就发不出来了。
      for (let attempt = 0; attempt < 4; attempt++) {
        const index = Math.floor(Math.random() * BURN_VERTICES);
        const point = front.points[index];
        if (point.x < 0 || point.y < 0 || point.x > front.width || point.y > front.height) continue;
        spawn(pool, kind, point.x, point.y, front.dirX[index], front.dirY[index]);
        break;
      }
    }
  };
  const sparks = Math.floor(pool.sparkDebt);
  const ash = Math.floor(pool.ashDebt);
  pool.sparkDebt -= sparks;
  pool.ashDebt -= ash;
  emit("spark", sparks);
  emit("ash", ash);
}

export function stepParticles(pool: ParticlePool, dtMs: number): void {
  const dt = dtMs / 1000;
  const items = pool.items;
  for (let index = items.length - 1; index >= 0; index--) {
    const particle = items[index];
    particle.age += dtMs;
    if (particle.age >= particle.life) {
      items[index] = items[items.length - 1];
      items.pop();
      continue;
    }
    const drag = particle.kind === "spark" ? 2.2 : 1.1;
    particle.vx -= particle.vx * drag * dt;
    particle.vy -= particle.vy * drag * dt + (particle.kind === "spark" ? 60 : 24) * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.spin += dt * 4;
  }
}

/** fade: 全局淡出系数, 收尾时让残留粒子跟着一起消失而不是在画布清空时硬切。 */
export function paintParticles(ctx: CanvasRenderingContext2D, pool: ParticlePool, fade: number): void {
  if (fade <= 0) return;
  ctx.save();
  for (const particle of pool.items) {
    if (particle.kind !== "ash") continue;
    const alpha = (1 - particle.age / particle.life) * 0.75 * fade;
    const w = particle.size * (0.4 + Math.abs(Math.cos(particle.spin)) * 0.6);
    ctx.fillStyle = `rgb(22 13 8 / ${alpha})`;
    ctx.fillRect(particle.x - w / 2, particle.y - particle.size / 2, w, particle.size);
  }
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const particle of pool.items) {
    if (particle.kind !== "spark") continue;
    const life = 1 - particle.age / particle.life;
    ctx.strokeStyle = `rgb(255 ${Math.round(120 + life * 110)} ${Math.round(40 + life * 80)} / ${life * fade})`;
    ctx.lineWidth = particle.size;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
    ctx.stroke();
  }
  ctx.restore();
}
