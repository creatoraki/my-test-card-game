import { burst, charge, clamp, ease, glow, line, noise, TAU, type Painter } from "./paint";
import type { AttackArt } from "./catalog";

export function drawFire(c: Painter, t: number, art: AttackArt) {
  const solar = art.id === "solar-pyre";
  const before = clamp(t / art.impactMs);
  const elapsed = t - art.impactMs;
  const after = clamp(elapsed / (art.durationMs - art.impactMs));
  const alpha = Math.min(1, t / 140) * (1 - after) ** 1.4;
  charge(c, t, art.impactMs, art.color);
  if (solar) {
    const r = elapsed < 0 ? 105 - before * 76 : 25 + ease(after) * 215;
    for (let j = 0; j < 3; j++) {
      const points = Array.from({ length: 145 }, (_, i) => {
        const a = i / 144 * TAU;
        const wave = Math.sin(a * 11 + t / 100 + j) * (8 + after * 24);
        return [Math.cos(a) * (r + wave + j * 7), Math.sin(a) * (r + wave + j * 7)];
      });
      line(c, points, j ? "#ff6839" : "#ffe9b5", j ? 8 : 2, alpha * (j ? 0.25 : 1));
    }
    glow(c, 0, 0, elapsed < 0 ? 25 + before * 50 : 180 * (1 - after), "#ff7d38", alpha * 0.6);
  } else {
    c.save(); c.rotate(-0.25);
    for (let i = -1; i <= 1; i++) {
      const points = [[i * 56 - 20, -120 * before], [i * 56 + 12, -35], [i * 56 - 8, 35], [i * 56 + 18, 120 * before]];
      line(c, points, "#ff4929", 20, alpha * 0.25);
      line(c, points, "#ffcc77", 5, alpha);
      line(c, points, "#fff3d5", 1.5, alpha);
    }
    c.restore();
  }
  if (elapsed < 0) return;
  burst(c, elapsed, art.color, solar ? 64 : 30, solar ? 1.15 : 0.7);
  for (let i = 0; i < 45; i++) {
    const delay = noise(i + 3) * 320;
    const p = clamp((elapsed - delay) / 1050);
    if (p <= 0 || p >= 1) continue;
    const x = (noise(i + 12) - 0.5) * (solar ? 340 : 160);
    const y = 110 - p * (170 + noise(i + 20) * 250);
    const sway = Math.sin(p * 8 + i) * (12 + p * 20);
    const a = Math.sin(p * Math.PI) * (1 - after);
    line(c, [[x, y + 45 * (1 - p)], [x + sway, y], [x + sway * 0.5, y - 25]], "#ff6534", 9 * (1 - p) + 1, a * 0.55);
    line(c, [[x, y + 15], [x + sway, y]], "#ffe1a3", 2, a);
    glow(c, x + sway, y, 8, art.color, a);
  }
}
