import type { FlickerMode } from "../../types";

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 时间桶内插值的平滑噪声。 */
function smoothNoise(t: number, seed: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed) * (1 - u) + hash(i + 1 + seed) * u;
}

/**
 * 灯光亮度倍率曲线(0~1+)。
 * steady: 电流嗡鸣的轻微起伏; flicker: 大部分时间稳定, 每隔几秒一阵乱闪;
 * dying: 半亮不亮、频繁打嗝; pulse: 应急灯的慢呼吸; off: 熄灭。
 */
export function flickerValue(mode: FlickerMode, t: number, seed: number): number {
  switch (mode) {
    case "off":
      return 0;
    case "steady":
      return 0.96 + smoothNoise(t * 8, seed) * 0.04;
    case "pulse": {
      const s = Math.sin(t * 2.2 + seed) * 0.5 + 0.5;
      return 0.35 + s * s * 0.65;
    }
    case "flicker": {
      const cycle = (t * 0.22 + seed * 0.37) % 1;
      if (cycle > 0.14) return 0.95 + smoothNoise(t * 9, seed) * 0.05;
      const bucket = Math.floor(t * 18);
      const on = hash(bucket + seed * 13) > 0.45;
      return on ? 0.8 + hash(bucket + seed) * 0.2 : 0.06;
    }
    case "dying": {
      const base = 0.45 + smoothNoise(t * 1.3, seed) * 0.35;
      const bucket = Math.floor(t * 14);
      const hiccup = hash(bucket + seed * 7) > 0.82 ? 0.1 : 1;
      const surge = hash(Math.floor(t * 0.5) + seed) > 0.8 && (t * 0.5) % 1 < 0.2 ? 1.5 : 1;
      return Math.min(1, base * hiccup * surge);
    }
    default:
      return 1;
  }
}
