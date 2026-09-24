import { pack, mixPacked, type PixelBuffer } from "./pixelBuffer";

// 字符网格像素画：每个字符对应一种颜色，'.' 为透明。解析一次后缓存为打包色数组。

export interface PixelGrid {
  w: number;
  h: number;
  pixels: Uint32Array;
  /** 锚点（网格内坐标），贴图时对齐到目标点。 */
  ax: number;
  ay: number;
}

export type GridPalette = Record<string, string>;

export function parseGrid(rows: readonly string[], palette: GridPalette, ax: number, ay: number): PixelGrid {
  const w = Math.max(...rows.map((row) => row.length));
  const h = rows.length;
  const pixels = new Uint32Array(w * h);
  const colors = new Map<string, number>();
  for (const [key, hex] of Object.entries(palette)) colors.set(key, pack(hex));
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const c = colors.get(ch);
      if (c === undefined) throw new Error(`像素网格缺少颜色定义：${ch}`);
      pixels[y * w + x] = c;
    }
  });
  return { w, h, pixels, ax, ay };
}

/** 把网格贴到缓冲中，锚点对齐 (x, y)。dim>0 时整体向 dimColor 压暗（后侧肢体用）。 */
export function stampGrid(buf: PixelBuffer, grid: PixelGrid, x: number, y: number, dim = 0, dimColor = 0) {
  const ox = Math.round(x) - grid.ax;
  const oy = Math.round(y) - grid.ay;
  for (let gy = 0; gy < grid.h; gy++) {
    for (let gx = 0; gx < grid.w; gx++) {
      const c = grid.pixels[gy * grid.w + gx];
      if (c !== 0) buf.set(ox + gx, oy + gy, dim > 0 ? mixPacked(c, dimColor, dim) : c);
    }
  }
}
