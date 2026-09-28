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
 * 灯光亮度倍率曲线(0~1)。
 * steady: 几乎恒定; buzz: 电流嗡鸣的细碎抖动; broken: 大部分时间亮, 每隔几秒一阵乱闪;
 * pulse: 应急灯慢呼吸; alarm: 旋转警报灯的扫光周期。
 */
export function flickerValue(mode: FlickerMode, t: number, seed: number): number {
  switch (mode) {
    case "steady":
      return 0.97 + smoothNoise(t * 6, seed) * 0.03;
    case "buzz":
      return 0.86 + smoothNoise(t * 22, seed) * 0.1 + Math.sin(t * 100 + seed) * 0.04;
    case "pulse": {
      const s = Math.sin(t * 1.9 + seed) * 0.5 + 0.5;
      return 0.4 + s * s * 0.6;
    }
    case "broken": {
      const cycle = (t * 0.2 + seed * 0.37) % 1;
      if (cycle > 0.16) return 0.93 + smoothNoise(t * 9, seed) * 0.07;
      const bucket = Math.floor(t * 17);
      const on = hash(bucket + seed * 13) > 0.5;
      return on ? 0.7 + hash(bucket + seed) * 0.3 : 0.05;
    }
    case "alarm": {
      const c = Math.max(0, Math.cos(t * 3.6 + seed));
      return 0.22 + 0.78 * c * c * c;
    }
  }
}
