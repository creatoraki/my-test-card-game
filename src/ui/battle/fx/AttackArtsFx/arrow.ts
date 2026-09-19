import { burst, clamp, ease, glow, line, ring, windowAlpha, type Painter } from "./paint";
import type { AttackArt } from "./catalog";

function bow(c: Painter, x: number, y: number, angle: number, pull: number, alpha: number, color: string) {
  c.save(); c.translate(x, y); c.rotate(angle);
  const curve = Array.from({ length: 33 }, (_, i) => {
    const a = -Math.PI / 2 + Math.PI * i / 32;
    return [Math.cos(a) * 50, Math.sin(a) * 85];
  });
  line(c, curve, color, 8, alpha * 0.22); line(c, curve, "#edfaff", 2, alpha);
  line(c, [[0, -85], [-pull * 65, 0], [0, 85]], color, 1.5, alpha);
  glow(c, -pull * 65, 0, 22 * pull, color, alpha); c.restore();
}

function arrow(c: Painter, x: number, y: number, angle: number, color: string, alpha: number) {
  c.save(); c.translate(x, y); c.rotate(angle);
  for (let i = 0; i < 4; i++) {
    line(c, [[-210 - i * 18, 0], [0, 0]], color, 13 - i * 3, alpha * 0.13);
  }
  line(c, [[-175, 0], [0, 0], [-25, -12], [-15, 0], [-25, 12], [0, 0]], "#f6fdff", 2.5, alpha);
  line(c, [[-125, -13], [-100, 0], [-125, 13]], color, 2, alpha);
  glow(c, 0, 0, 26, color, alpha); c.restore();
}

export function drawArrow(c: Painter, t: number, art: AttackArt) {
  const rain = art.id === "rain-arrow";
  const count = rain ? 7 : 1;
  for (let i = 0; i < count; i++) {
    const impact = art.impactMs + i * 78;
    const start = impact - 260;
    const sx = rain ? -310 + i * 88 : -430;
    const sy = rain ? -300 - Math.sin(i / 6 * Math.PI) * 55 : 110;
    const tx = rain ? (i - 3) * 21 : 0;
    const angle = Math.atan2(-sy, tx - sx);
    bow(c, sx, sy, angle, clamp(t / start), windowAlpha(t, i * 30, start + 160), art.color);
    if (t >= start && t < impact + 120) {
      const p = (t - start) / 260;
      arrow(c, sx + (tx - sx) * p, sy * (1 - p), angle, art.color, 1 - clamp((t - impact) / 120));
    }
    c.save(); c.translate(tx, 0); burst(c, t - impact, art.color, rain ? 15 : 55, rain ? 0.6 : 1); c.restore();
  }
  if (!rain && t >= art.impactMs) {
    const p = clamp((t - art.impactMs) / 650);
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(i * 95, -i * 24);
      ring(c, (30 + ease(p) * 120) * (1 - i * 0.18), art.color, (1 - p) ** 2, 0.4, 1.32); c.restore();
    }
  }
}
