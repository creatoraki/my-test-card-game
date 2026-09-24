// 低分辨率像素缓冲：直接操作 ImageData 的 32 位视图，全部图形按像素中心判定、无抗锯齿。
// 颜色以打包的 ABGR 整数存储（小端序），0 表示透明。

const packCache = new Map<string, number>();

export function pack(hex: string, alpha = 255): number {
  const key = alpha === 255 ? hex : `${hex}/${alpha}`;
  const cached = packCache.get(key);
  if (cached !== undefined) return cached;
  const value = parseInt(hex.slice(1), 16);
  const packed = (((alpha & 255) << 24) | ((value & 255) << 16) | (value & 0xff00) | ((value >> 16) & 255)) >>> 0;
  packCache.set(key, packed);
  return packed;
}

export function packRgb(r: number, g: number, b: number, a = 255): number {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return ((c(a) << 24) | (c(b) << 16) | (c(g) << 8) | c(r)) >>> 0;
}

export function channels(color: number): [number, number, number, number] {
  return [color & 255, (color >>> 8) & 255, (color >>> 16) & 255, color >>> 24];
}

/** 打包色混合（含透明度）。 */
export function mixPacked(a: number, b: number, t: number): number {
  const ca = channels(a);
  const cb = channels(b);
  return packRgb(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t, ca[3] + (cb[3] - ca[3]) * t);
}

/** 纯色或逐像素着色函数；着色函数返回 0 表示跳过该像素。 */
export type Fill = number | ((x: number, y: number) => number);

export type Point = readonly [number, number];

export class PixelBuffer {
  readonly image: ImageData;
  readonly data: Uint32Array;

  constructor(readonly w: number, readonly h: number) {
    this.image = new ImageData(w, h);
    this.data = new Uint32Array(this.image.data.buffer);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): number {
    return this.inside(x, y) ? this.data[y * this.w + x] : 0;
  }

  set(x: number, y: number, color: number) {
    if (color !== 0 && this.inside(x, y)) this.data[y * this.w + x] = color;
  }

  /** 强制写入（允许写透明，用于擦除）。 */
  put(x: number, y: number, color: number) {
    if (this.inside(x, y)) this.data[y * this.w + x] = color;
  }

  private shade(fill: Fill, x: number, y: number) {
    this.set(x, y, typeof fill === "number" ? fill : fill(x, y));
  }

  /** 遍历包围盒并调用着色函数。 */
  paint(x0: number, y0: number, x1: number, y1: number, fill: (x: number, y: number) => number) {
    const ax = Math.max(0, Math.floor(x0));
    const ay = Math.max(0, Math.floor(y0));
    const bx = Math.min(this.w - 1, Math.ceil(x1));
    const by = Math.min(this.h - 1, Math.ceil(y1));
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) this.set(x, y, fill(x, y));
  }

  rect(x: number, y: number, w: number, h: number, fill: Fill) {
    const ax = Math.round(x);
    const ay = Math.round(y);
    for (let py = ay; py < ay + Math.round(h); py++) for (let px = ax; px < ax + Math.round(w); px++) this.shade(fill, px, py);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill: Fill) {
    if (rx <= 0 || ry <= 0) return;
    this.paint(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (x, y) => {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) return 0;
      return typeof fill === "number" ? fill : fill(x, y);
    });
  }

  /** 两端为半圆的粗线段，用于四肢、藤蔓、管道。 */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, fill: Fill) {
    const vx = x1 - x0;
    const vy = y1 - y0;
    const len2 = vx * vx + vy * vy || 1;
    this.paint(Math.min(x0, x1) - r - 1, Math.min(y0, y1) - r - 1, Math.max(x0, x1) + r + 1, Math.max(y0, y1) + r + 1, (x, y) => {
      const px = x + 0.5 - x0;
      const py = y + 0.5 - y0;
      const t = Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
      const dx = px - vx * t;
      const dy = py - vy * t;
      if (dx * dx + dy * dy > r * r) return 0;
      return typeof fill === "number" ? fill : fill(x, y);
    });
  }

  /** 扫描线多边形填充（奇偶规则，像素中心采样）。 */
  polygon(points: readonly Point[], fill: Fill) {
    if (points.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, py] of points) {
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    const hits: number[] = [];
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const sy = y + 0.5;
      hits.length = 0;
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % points.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) hits.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        for (let x = Math.ceil(hits[i] - 0.5); x <= Math.floor(hits[i + 1] - 0.5); x++) this.shade(fill, x, y);
      }
    }
  }

  /** Bresenham 单像素线。 */
  line(x0: number, y0: number, x1: number, y1: number, fill: Fill) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const dx = Math.abs(tx - x);
    const dy = -Math.abs(ty - y);
    const sx = x < tx ? 1 : -1;
    const sy = y < ty ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.shade(fill, x, y);
      if (x === tx && y === ty) break;
      const e2 = err * 2;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  /** 把另一块缓冲的不透明像素拷贝进来。 */
  blit(src: PixelBuffer, dx: number, dy: number) {
    const ox = Math.round(dx);
    const oy = Math.round(dy);
    for (let y = 0; y < src.h; y++) {
      const ty = y + oy;
      if (ty < 0 || ty >= this.h) continue;
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        const tx = x + ox;
        if (c !== 0 && tx >= 0 && tx < this.w) this.data[ty * this.w + tx] = c;
      }
    }
  }

  /** 加色混合（发光），只作用于已有像素或指定写入透明处。 */
  add(x: number, y: number, r: number, g: number, b: number) {
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    const [cr, cg, cb, ca] = channels(this.data[i]);
    if (ca === 0) return;
    this.data[i] = packRgb(cr + r, cg + g, cb + b, ca);
  }

  /** 按比例向目标色混合已有像素（着色叠层、雾化）。 */
  tint(x: number, y: number, color: number, t: number) {
    if (!this.inside(x, y) || t <= 0) return;
    const i = y * this.w + x;
    if (this.data[i] === 0) return;
    this.data[i] = mixPacked(this.data[i], color | 0xff000000, t) | 0xff000000;
  }

  toCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = this.w;
    canvas.height = this.h;
    canvas.getContext("2d")?.putImageData(this.image, 0, 0);
    return canvas;
  }
}
