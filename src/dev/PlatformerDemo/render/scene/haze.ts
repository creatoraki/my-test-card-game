import { SCREEN_H } from "../core/grid";
import { PixelBuffer, channels, mixPacked, pack, packRgb } from "../core/pixelBuffer";

// 视差层底部雾带：按 5 级离散浓度分层（不做逐像素抖动，避免远景出现颗粒噪点）。
// 不透明像素向雾色混合，透明处铺同色半透明雾，使下方图层隐约透出。

const BANDS = 5;

export function hazeBand(buf: PixelBuffer, fromY: number, fog: string, maxAlpha = 0.9) {
  const color = pack(fog);
  const [r, g, b] = channels(color);
  for (let y = fromY; y < SCREEN_H; y++) {
    const t = Math.ceil(((y - fromY) / (SCREEN_H - fromY)) * BANDS) / BANDS;
    const a = t * maxAlpha;
    if (a <= 0) continue;
    const veil = packRgb(r, g, b, a * 255);
    for (let x = 0; x < buf.w; x++) {
      const i = y * buf.w + x;
      const c = buf.data[i];
      buf.data[i] = c === 0 ? veil : mixPacked(c, color, a) | 0xff000000;
    }
  }
}
