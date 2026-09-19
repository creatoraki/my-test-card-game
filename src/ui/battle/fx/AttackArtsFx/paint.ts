export type Painter = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3);
export const noise = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
export const windowAlpha = (t: number, start: number, length: number) =>
  t < start || t > start + length ? 0 : Math.min(1, (t - start) / 45) * (1 - clamp((t - start) / length));

export function line(c: Painter, points: number[][], color: string, width = 2, alpha = 1) {
  if (alpha <= 0 || points.length < 2) return;
  c.save(); c.globalAlpha = clamp(alpha); c.strokeStyle = color; c.lineWidth = width;
  c.lineJoin = "round"; c.lineCap = "round"; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
}

export function glow(c: Painter, x: number, y: number, radius: number, color: string, alpha = 1) {
  if (radius <= 0 || alpha <= 0) return;
  c.save(); c.globalAlpha = clamp(alpha);
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.12, color); g.addColorStop(1, `${color}00`);
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2); c.restore();
}

export function ring(c: Painter, radius: number, color: string, alpha: number, squash = 1, rotation = 0) {
  c.save(); c.rotate(rotation); c.scale(1, squash);
  c.globalAlpha = clamp(alpha); c.strokeStyle = color; c.lineWidth = 1.8;
  c.beginPath(); c.arc(0, 0, Math.max(0, radius), 0, TAU); c.stroke(); c.restore();
}

export function burst(c: Painter, elapsed: number, color: string, count = 48, spread = 1) {
  if (elapsed < 0 || elapsed > 850) return;
  const p = elapsed / 850;
  for (let i = 0; i < count; i++) {
    const angle = noise(i + 8) * TAU;
    const travel = ease(p) * (65 + noise(i + 77) * 240) * spread;
    const x = Math.cos(angle) * travel, y = Math.sin(angle) * travel;
    const tail = 5 + (1 - p) * noise(i + 22) * 48;
    line(c, [[x, y], [x - Math.cos(angle) * tail, y - Math.sin(angle) * tail]],
      i % 3 ? color : "#ffffff", 1 + noise(i) * 2, (1 - p) ** 2);
  }
  glow(c, 0, 0, 115 * (1 - p) + 15, color, Math.max(0, 1 - p * 5));
  ring(c, 15 + ease(p) * 245 * spread, color, (1 - p) ** 3, 0.7);
}

export function charge(c: Painter, t: number, impact: number, color: string) {
  const p = clamp(t / impact);
  if (t >= impact) return;
  for (let i = 0; i < 26; i++) {
    const phase = (p * 1.5 + noise(i)) % 1;
    const angle = noise(i + 60) * TAU + p * 0.5;
    const r = (1 - phase) * 230;
    glow(c, Math.cos(angle) * r, Math.sin(angle) * r, 3 + phase * 5, color, Math.sin(phase * Math.PI) * p);
  }
  glow(c, 0, 0, 12 + p ** 4 * 65, color, p * 0.8);
}
