import { burst, charge, clamp, ease, glow, line, ring, TAU, type Painter } from "./paint";
import type { AttackArt } from "./catalog";

function card(c: Painter, x: number, y: number, angle: number, flip: number, alpha: number, color: string) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(Math.max(0.06, Math.abs(flip)), 1);
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = alpha; c.fillStyle = "#160e2be6"; c.fillRect(-31, -49, 62, 98);
  c.globalCompositeOperation = "lighter";
  line(c, [[-31, -49], [31, -49], [31, 49], [-31, 49], [-31, -49]], color, 2, alpha);
  line(c, [[-25, -42], [25, -42], [25, 42], [-25, 42], [-25, -42]], color, 0.8, alpha * 0.5);
  if (flip > 0) {
    line(c, [[-21, 0], [0, -13], [21, 0], [0, 13], [-21, 0]], "#fff1d7", 1.5, alpha);
    ring(c, 6, color, alpha); glow(c, 0, 0, 12, color, alpha);
    line(c, [[0, -33], [0, -22]], color, 2, alpha);
    line(c, [[0, 22], [0, 33]], color, 2, alpha);
  } else {
    line(c, [[0, -32], [20, 0], [0, 32], [-20, 0], [0, -32]], color, 1.5, alpha);
  }
  c.restore();
}

export function drawOracle(c: Painter, t: number, art: AttackArt) {
  const wheel = art.id === "fate-wheel";
  const before = clamp(t / art.impactMs);
  const elapsed = t - art.impactMs;
  const after = clamp(elapsed / (art.durationMs - art.impactMs));
  const alpha = Math.min(1, t / 200) * (1 - after) ** 1.6;
  const radius = (wheel ? 170 : 125) * ease(before * 2) * (1 - after * 0.4);
  c.save(); c.rotate((wheel ? -1 : 1) * t / 1600);
  ring(c, radius, art.color, alpha * 0.8);
  ring(c, radius + 14, art.color, alpha * 0.4);
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * TAU;
    line(c, [[Math.cos(angle) * radius, Math.sin(angle) * radius],
      [Math.cos(angle) * (radius + (i % 3 ? 7 : 20)), Math.sin(angle) * (radius + (i % 3 ? 7 : 20))]], art.color, 1.5, alpha);
  }
  const vertices = Array.from({ length: 7 }, (_, i) => {
    const a = i * TAU / 3;
    return [Math.cos(a) * radius, Math.sin(a) * radius];
  });
  line(c, vertices, art.color, 1, alpha * 0.6); c.restore();
  const count = wheel ? 6 : 3;
  for (let i = 0; i < count; i++) {
    const angle = i / count * TAU - Math.PI / 2 + (wheel ? ease(before) * 2.4 : 0);
    const r = (wheel ? 210 : 155) * (1 - ease(after) * 0.85);
    const x = wheel ? Math.cos(angle) * r : (i - 1) * 110 * (1 - after);
    const y = wheel ? Math.sin(angle) * r : -165 + Math.abs(i - 1) * 35 + ease(after) * 100;
    line(c, [[x, y], [0, 0]], art.color, 1, alpha * before * 0.45);
    card(c, x, y, wheel ? angle + Math.PI / 2 : (i - 1) * 0.2,
      Math.cos(Math.PI * (1 - ease(clamp((before - i * 0.06) * 1.5)))), alpha, art.color);
  }
  charge(c, t, art.impactMs, art.color);
  if (elapsed >= 0) {
    burst(c, elapsed, art.color, 60, 1.1);
    const beamAlpha = (1 - clamp(elapsed / 500)) ** 2;
    if (!wheel) {
      line(c, [[0, -350], [0, 320]], art.color, 65 * beamAlpha, beamAlpha * 0.15);
      line(c, [[0, -350], [0, 320]], "#fff8ff", 8 * beamAlpha + 0.1, beamAlpha);
    } else {
      ring(c, 20 + ease(after) * 300, "#e1b3ff", (1 - after) ** 3);
    }
  }
}
