import { burst, charge, clamp, ease, glow, line, noise, ring, TAU, type Painter } from "./paint";
import type { AttackArt } from "./catalog";

export function drawPoison(c: Painter, t: number, art: AttackArt) {
  const bind = art.id === "toxic-bind";
  const before = clamp(t / art.impactMs);
  const after = clamp((t - art.impactMs) / (art.durationMs - art.impactMs));
  const alpha = Math.min(1, t / 180) * (1 - after) ** 1.5;
  charge(c, t, art.impactMs, art.color);
  if (bind) {
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 100 }, (_, i) => {
        const p = i / 99;
        const angle = p * TAU * 2 + t / 240 + side * Math.PI;
        const radius = 145 - before * 65 + after * 140;
        return [Math.sin(angle) * radius, (p - 0.5) * 370 * ease(before)];
      });
      line(c, points, art.color, 20, alpha * 0.12);
      line(c, points, art.color, 5, alpha);
      line(c, points, "#dcffe8", 1.2, alpha * 0.8);
    }
  } else {
    for (let petal = 0; petal < 6; petal++) {
      c.save(); c.rotate(petal * TAU / 6 + t / 1700);
      const radius = 35 + before * 38 + ease(after) * 100;
      const points = Array.from({ length: 49 }, (_, i) => {
        const a = i / 48 * TAU;
        return [Math.sin(a) * radius * 0.45, (1 - Math.cos(a)) * radius];
      });
      line(c, points, art.color, 12, alpha * 0.15);
      line(c, points, art.color, 2, alpha); c.restore();
    }
  }
  if (t < art.impactMs) return;
  burst(c, t - art.impactMs, art.color, 24, 0.7);
  for (let i = 0; i < 32; i++) {
    const a = noise(i) * TAU;
    const radius = (30 + noise(i + 24) * 145) * ease(after * 3);
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.65 - after * (60 + noise(i + 40) * 160);
    glow(c, x, y, 25 + noise(i + 9) * 45, art.color, alpha * 0.1);
    c.save(); c.translate(x, y);
    ring(c, 2 + noise(i + 70) * 9, art.color, alpha * 0.7);
    glow(c, -2, -2, 3, "#ddffd0", alpha); c.restore();
  }
}
