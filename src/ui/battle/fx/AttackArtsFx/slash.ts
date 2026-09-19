import { burst, charge, clamp, ease, line, noise, windowAlpha, type Painter } from "./paint";
import type { AttackArt } from "./catalog";

export function drawSlash(c: Painter, t: number, art: AttackArt) {
  const moon = art.id === "moon-cleave";
  c.save(); c.rotate(moon ? -0.65 : -1.04);
  const alpha = windowAlpha(t, 30, art.impactMs + 680);
  const extent = ease(t / 230) * 435;
  for (let layer = 0; layer < 3; layer++) {
    const points = Array.from({ length: 65 }, (_, i) => {
      const x = -extent + extent * 2 * i / 64;
      return [x, moon ? (x * x / 1400 - 65) * (1 + layer * 0.12) : layer * 6];
    });
    line(c, points, art.color, 18 - layer * 6, alpha * 0.13);
    if (layer === 0) line(c, points, "#f2fbff", 2.4, alpha);
  }
  charge(c, t, art.impactMs, art.color);
  const elapsed = t - art.impactMs;
  if (elapsed >= 0) {
    const p = clamp(elapsed / 800);
    for (let i = 0; i < 24; i++) {
      const x = (noise(i + 20) - 0.5) * 780;
      const y = moon ? x * x / 1400 - 65 : 0;
      const side = i % 2 ? 1 : -1;
      line(c, [[x, y], [x + side * 22, y + side * 48 * ease(p)],
        [x - 12, y + side * (80 + noise(i) * 120) * ease(p)]], art.color, 2, (1 - p) ** 2);
    }
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 50 }, (_, i) => {
        const x = -420 + i * 840 / 49;
        return [x, (moon ? x * x / 1400 - 65 : 0) + Math.sin(i / 49 * Math.PI) * side * ease(p) * 110];
      });
      line(c, points, "#ffffff", 3 * (1 - p) + 0.5, (1 - p) ** 2);
    }
    burst(c, elapsed, art.color, 65, 1.3);
  }
  c.restore();
}
