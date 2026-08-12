import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import s from "./SparkFx.module.css";

const SIZE = 200;
const PARTICLE_COUNT = 96;
const CENTER_X = 100;
const CENTER_Y = 78;
const EMIT_INTERVAL = 0.12;
const DRAG = 3.2;
const GRAVITY = 40;
const WHITE_SPRITE =
  typeof document === "undefined" ? null : makeDotSprite("#ffffff");

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  lifeMax: number;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function makeDotSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  const center = 32;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, sprite.width, sprite.height);
  return sprite;
}

function resetParticle(particle: Particle, intensity: number): void {
  const angle = Math.random() * Math.PI * 2;
  const speed = rand(90, 260) * intensity;
  particle.x = CENTER_X + rand(-3, 3);
  particle.y = CENTER_Y + rand(-3, 3);
  particle.vx = Math.cos(angle) * speed;
  particle.vy = Math.sin(angle) * speed;
  particle.size = rand(0.7, 1.6);
  particle.lifeMax = rand(0.35, 0.7);
  particle.life = particle.lifeMax;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: CENTER_X,
    y: CENTER_Y,
    vx: 0,
    vy: 0,
    size: 0,
    life: 0,
    lifeMax: 0,
  }));
}

function emitBurst(particles: Particle[], intensity: number, cursor: { value: number }): void {
  const count = Math.floor(rand(6, 10));
  for (let index = 0; index < count; index += 1) {
    resetParticle(particles[cursor.value], intensity);
    cursor.value = (cursor.value + 1) % particles.length;
  }
}

function update(particles: Particle[], dt: number): void {
  const drag = Math.exp(-DRAG * dt);
  for (const particle of particles) {
    if (particle.life <= 0) continue;
    particle.life -= dt;
    particle.vx *= drag;
    particle.vy = particle.vy * drag + GRAVITY * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  particles: Particle[],
): void {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.globalCompositeOperation = "lighter";
  for (const particle of particles) {
    if (particle.life <= 0) continue;
    const progress = 1 - particle.life / particle.lifeMax;
    const fade = Math.max(0, 1 - progress);
    const alpha = fade * fade;
    const speed = Math.hypot(particle.vx, particle.vy);
    const angle = Math.atan2(particle.vy, particle.vx);
    const length = Math.min(22, Math.max(4, speed * 0.045));
    const thickness = particle.size * 2;
    const glowDiameter = particle.size * 10;

    ctx.globalAlpha = alpha * 0.22;
    ctx.drawImage(
      sprite,
      particle.x - glowDiameter / 2,
      particle.y - glowDiameter / 2,
      glowDiameter,
      glowDiameter,
    );

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      particle.x - Math.cos(angle) * length / 2,
      particle.y - Math.sin(angle) * length / 2,
    );
    ctx.rotate(angle);
    ctx.drawImage(sprite, -length / 2, -thickness / 2, length, thickness);
    ctx.restore();

    if (WHITE_SPRITE) {
      const coreDiameter = particle.size * 2.2;
      ctx.globalAlpha = alpha * fade;
      ctx.drawImage(
        WHITE_SPRITE,
        particle.x - coreDiameter / 2,
        particle.y - coreDiameter / 2,
        coreDiameter,
        coreDiameter,
      );
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function SparkFx({
  color,
  intensity = 1,
  paused = false,
  className,
}: {
  color: string;
  intensity?: number;
  paused?: boolean;
  className?: string;
}) {
  if (prefersReducedMotion()) return null;
  return (
    <SparkCanvas
      color={color}
      intensity={intensity}
      paused={paused}
      className={className}
    />
  );
}

function SparkCanvas({
  color,
  intensity,
  paused,
  className,
}: {
  color: string;
  intensity: number;
  paused: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const spriteRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const intensityRef = useRef(Math.max(0.1, intensity));
  intensityRef.current = Math.max(0.1, intensity);

  useEffect(() => {
    spriteRef.current = makeDotSprite(color);
  }, [color]);

  useEffect(() => {
    particlesRef.current = createParticles();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resolution = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(SIZE * resolution);
    canvas.height = Math.round(SIZE * resolution);
    ctx.setTransform(resolution, 0, 0, resolution, 0, 0);

    let raf = 0;
    let last = performance.now();
    let emitElapsed = EMIT_INTERVAL;
    const emitCursor = { value: 0 };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (pausedRef.current) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      emitElapsed += dt;
      const currentIntensity = intensityRef.current;
      const emitInterval = EMIT_INTERVAL / currentIntensity;
      while (emitElapsed >= emitInterval) {
        emitElapsed -= emitInterval;
        emitBurst(particlesRef.current, currentIntensity, emitCursor);
      }
      update(particlesRef.current, dt);
      if (spriteRef.current) draw(ctx, spriteRef.current, particlesRef.current);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  return <canvas ref={canvasRef} className={`${s.canvas} ${className ?? ""}`} aria-hidden />;
}