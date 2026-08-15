export const W = 520;
export const H = 720;
export const TOP = -170;
export const BOT = 170;
export const R = 92;
export const NECK = 9;

export const DRAIN_MS = 60000;
export const REFILL_MS = 5000;
export const PARTICLE_COUNT = 70;

export const BRASS = ["#f0d9a0", "#b08d4f", "#6f5426"] as const;

export function rgba(color: readonly number[], alpha: number): string {
  return `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
}

export function lighten(color: readonly number[], amount: number): number[] {
  return color.map((value) => value + (255 - value) * amount);
}

export function shade(color: readonly number[], amount: number): number[] {
  return color.map((value) => value * (1 - amount));
}