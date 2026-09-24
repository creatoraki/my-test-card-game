import { RAMPS, RIM_LIGHT } from "./palette";
import { PixelBuffer, mixPacked, pack } from "./pixelBuffer";

// 精灵后处理：受光侧边缘高光 + 背光侧压暗 + 自动外描边。
// 描边色取相邻像素向墨色压暗后的颜色，不使用纯黑，保证每种材质的轮廓与本色协调。

const INK = pack(RAMPS.ink[0]);
const RIM = pack(RIM_LIGHT);

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

export interface PostOptions {
  /** 外描边向墨色压暗的比例，0 为不描边。 */
  outline?: number;
  /** 受光侧（左上）边缘高光强度。 */
  rim?: number;
  rimColor?: number;
  /** 背光侧（右下）边缘压暗强度。 */
  shade?: number;
}

export function postProcess(buf: PixelBuffer, { outline = 0.72, rim = 0.35, rimColor = RIM, shade = 0.3 }: PostOptions = {}) {
  const { w, h } = buf;
  const src = buf.data.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x]);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = src[y * w + x];
      if (c === 0) continue;
      if (rim > 0 && (at(x - 1, y) === 0 || at(x, y - 1) === 0)) buf.data[y * w + x] = mixPacked(c, rimColor, rim);
      else if (shade > 0 && (at(x + 1, y) === 0 || at(x, y + 1) === 0)) buf.data[y * w + x] = mixPacked(c, INK, shade);
    }
  }

  if (outline <= 0) return;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y * w + x] !== 0) continue;
      for (const [dx, dy] of NEIGHBORS) {
        const n = at(x + dx, y + dy);
        if (n !== 0) {
          buf.data[y * w + x] = mixPacked(n, INK, outline);
          break;
        }
      }
    }
  }
}

/** 把缓冲中已有像素整体向某色混合（景深雾化整块元素时使用）。 */
export function tintAll(buf: PixelBuffer, color: number, t: number) {
  for (let i = 0; i < buf.data.length; i++) {
    const c = buf.data[i];
    if (c !== 0) buf.data[i] = mixPacked(c, color, t);
  }
}
