import { glassPath, bulbHalfWidth } from "./hourglassGeometry";
import { lighten, rgba } from "./hourglassConstants";

export interface HourglassParticle {
  x: number;
  y: number;
  vy: number;
  phase: number;
  size: number;
  life: number;
  maxLife: number;
}

export function newParticle(randomAge: boolean): HourglassParticle {
  let y = (Math.random() * 2 - 1) * 155;
  if (Math.abs(y) < 28) y += (y < 0 ? -1 : 1) * 34;
  const halfWidth = bulbHalfWidth(y) * 0.78;
  return {
    x: (Math.random() * 2 - 1) * halfWidth,
    y,
    vy: -(3 + Math.random() * 9),
    phase: Math.random() * Math.PI * 2,
    size: 0.8 + Math.random() * 1.9,
    life: randomAge ? Math.random() * 6 : 0,
    maxLife: 4 + Math.random() * 5,
  };
}

export function createParticles(count: number): HourglassParticle[] {
  return Array.from({ length: count }, () => newParticle(true));
}

export function updateParticles(
  particles: HourglassParticle[],
  dt: number,
  timestamp: number,
): void {
  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    particle.life += dt;
    if (particle.life > particle.maxLife) {
      particles[index] = newParticle(false);
      continue;
    }
    particle.y += particle.vy * dt;
    particle.x += Math.sin(timestamp * 0.0008 + particle.phase) * 10 * dt;
    const halfWidth = bulbHalfWidth(particle.y) * 0.85;
    if (particle.x > halfWidth) particle.x = halfWidth;
    if (particle.x < -halfWidth) particle.x = -halfWidth;
    if (Math.abs(particle.y) > 160) particle.y = Math.sign(particle.y) * 160;
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: HourglassParticle[],
  color: readonly number[],
  intensity: number,
): void {
  const alphaScale = Math.max(0, intensity);
  ctx.save();
  glassPath(ctx);
  ctx.clip();
  for (const particle of particles) {
    const alpha =
      Math.sin(Math.PI * Math.min(1, particle.life / particle.maxLife)) *
      0.9 *
      alphaScale;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = rgba(lighten(color, 0.3), 1);
    ctx.shadowColor = rgba(color, Math.min(1, 0.95 * alphaScale));
    ctx.shadowBlur = 10 * alphaScale;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}