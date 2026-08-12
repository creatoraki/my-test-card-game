import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import s from "./FireflyFx.module.css";

const SIZE = 160;
const PARTICLE_COUNT = 16;
const MAX_SPEED = 8;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  blinkSpeed: number;
  life: number;
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

function spawn(particle: Particle): void {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random());
  particle.x = 80 + Math.cos(angle) * 45 * radius;
  particle.y = 58 + Math.sin(angle) * 40 * radius;
  particle.vx = rand(-3, 3);
  particle.vy = rand(-3, 3);
  particle.size = rand(5, 10);
  particle.phase = Math.random() * Math.PI * 2;
  particle.blinkSpeed = rand(0.8, 1.8);
  particle.life = rand(3, 7);
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const particle: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      phase: 0,
      blinkSpeed: 0,
      life: 0,
    };
    spawn(particle);
    return particle;
  });
}

function update(particles: Particle[], dt: number, intensity: number): void {
  for (const particle of particles) {
    particle.life -= dt;
    particle.vx += (Math.random() - 0.5) * 2.4 * dt;
    particle.vy += (Math.random() - 0.5) * 2.4 * dt;
    const speed = Math.hypot(particle.vx, particle.vy);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      particle.vx *= scale;
      particle.vy *= scale;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.phase += particle.blinkSpeed * intensity * dt;

    const dx = (particle.x - 80) / 54;
    const dy = (particle.y - 58) / 49;
    if (particle.life <= 0 || dx * dx + dy * dy > 1) spawn(particle);
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
    const brightness = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(particle.phase));
    const diameter = particle.size * 2;
    ctx.globalAlpha = brightness;
    ctx.drawImage(
      sprite,
      particle.x - particle.size,
      particle.y - particle.size,
      diameter,
      diameter,
    );
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function FireflyFx({
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
    <FireflyCanvas
      color={color}
      intensity={intensity}
      paused={paused}
      className={className}
    />
  );
}

function FireflyCanvas({
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
    let accumulated = 0;
    const frameMs = 1000 / 30;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      accumulated += now - last;
      last = now;
      if (accumulated < frameMs || pausedRef.current) return;
      const dt = Math.min(0.05, accumulated / 1000);
      accumulated = 0;
      update(particlesRef.current, dt, intensityRef.current);
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
    start();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, []);

  return <canvas ref={canvasRef} className={`${s.canvas} ${className ?? ""}`} aria-hidden />;
}