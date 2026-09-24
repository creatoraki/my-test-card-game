import { SCREEN_H, SCREEN_W } from "../core/grid";
import { bayer, packRamp, shadeRamp } from "../core/dither";
import { fbm, hash01 } from "../core/noise";
import { RAMPS } from "../core/palette";
import { PixelBuffer, pack } from "../core/pixelBuffer";

// 天空层（固定不随镜头移动）：暮色分带渐变 + 低垂夕阳光晕 + 星点 + 被夕阳从下方照亮的层云。

const HORIZON = 232;
const SUN = { x: 318, y: 178, r: 13 } as const;
const SEED = 4217;

const SKY = packRamp(RAMPS.sky);
const CLOUD = packRamp(RAMPS.cloud);
const SUN_CORE = pack(RAMPS.lamp[5]);
const SUN_RING = pack(RAMPS.lamp[4]);
const STAR = pack("#f3e8ff");
const STAR_DIM = pack(RAMPS.sky[4]);

/** 太阳光晕对当前像素的加成，0~1。 */
function sunGlow(x: number, y: number): number {
  const d = Math.hypot(x - SUN.x, (y - SUN.y) * 1.25);
  return Math.max(0, 1 - d / 190) ** 2;
}

/** 三层层云的高度带，返回云生成阈值（越低越容易出云）。 */
function cloudThreshold(y: number): number {
  const band = (c: number, w: number) => Math.exp(-(((y - c) / w) ** 2));
  return 0.7 - band(62, 12) * 0.12 - band(118, 16) * 0.16 - band(170, 14) * 0.2;
}

function cloudDensity(x: number, y: number): number {
  return fbm(x * 0.011, y * 0.085, SEED, 5) - cloudThreshold(y);
}

export function bakeSky(): HTMLCanvasElement {
  const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
  for (let y = 0; y < SCREEN_H; y++) {
    for (let x = 0; x < SCREEN_W; x++) {
      const glow = sunGlow(x, y);
      buf.put(x, y, shadeRamp(SKY, Math.min(1, y / HORIZON) * 0.92 + glow * 0.3, x, y, 0.5));
    }
  }

  // 星点只出现在上半部分，越往下越稀疏。
  for (let y = 0; y < 120; y++) {
    for (let x = 0; x < SCREEN_W; x++) {
      const n = hash01(x, y, SEED);
      if (n > 0.9985 - y * 0.000004) buf.put(x, y, n > 0.9995 ? STAR : STAR_DIM);
    }
  }

  buf.ellipse(SUN.x, SUN.y, SUN.r + 3, SUN.r + 3, SUN_RING);
  buf.ellipse(SUN.x, SUN.y, SUN.r, SUN.r, SUN_CORE);

  for (let y = 20; y < HORIZON; y++) {
    for (let x = 0; x < SCREEN_W; x++) {
      const d = cloudDensity(x, y);
      if (d <= 0) continue;
      const glow = sunGlow(x, y);
      const underside = cloudDensity(x, y + 2) <= 0;
      const top = cloudDensity(x, y - 2) <= 0;
      let v = 0.18 + d * 2.2 + glow * 0.45 + (y / HORIZON) * 0.25;
      if (underside) v += 0.3 + glow * 0.3;
      if (top) v -= 0.12;
      // 云的边缘用抖动羽化，避免硬切。
      if (d < 0.025 && bayer(x, y) > d / 0.025) continue;
      buf.put(x, y, shadeRamp(CLOUD, v, x, y, 0.6));
    }
  }
  return buf.toCanvas();
}
