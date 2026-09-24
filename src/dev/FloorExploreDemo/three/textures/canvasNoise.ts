// 程序化贴图的底层工具: 可复现随机数、可平铺的值噪声 / fbm、三张同步绘制的画布图层。

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);

/** 以 period 为周期的值噪声, u/v ∈ [0,1) 时贴图四边无缝。 */
export function tileNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period;
  const y = v * period;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** 分形叠加, 返回约 [0,1]。 */
export function fbm(u: number, v: number, basePeriod: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let period = basePeriod;
  for (let i = 0; i < octaves; i += 1) {
    sum += tileNoise(u, v, period, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    period *= 2;
  }
  return sum / norm;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Pixel { r: number; g: number; b: number; rough: number; height: number }

/** 颜色 / 粗糙度 / 高度三张图层, 逐像素底色 + 2D 画笔叠加细节。 */
export interface SurfaceLayers {
  size: number;
  color: HTMLCanvasElement;
  rough: HTMLCanvasElement;
  height: HTMLCanvasElement;
  cc: CanvasRenderingContext2D;
  rc: CanvasRenderingContext2D;
  hc: CanvasRenderingContext2D;
}

function canvas2d(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return [canvas, canvas.getContext("2d", { willReadFrequently: true })!];
}

export function createLayers(size: number): SurfaceLayers {
  const [color, cc] = canvas2d(size);
  const [rough, rc] = canvas2d(size);
  const [height, hc] = canvas2d(size);
  return { size, color, rough, height, cc, rc, hc };
}

/** 逐像素写入底色。颜色 0~1 线性写入 sRGB 画布(视作 sRGB 值)。 */
export function fillPixels(layers: SurfaceLayers, fn: (u: number, v: number, out: Pixel) => void): void {
  const { size } = layers;
  const color = layers.cc.createImageData(size, size);
  const rough = layers.rc.createImageData(size, size);
  const height = layers.hc.createImageData(size, size);
  const px: Pixel = { r: 0, g: 0, b: 0, rough: 0, height: 0 };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      fn(x / size, y / size, px);
      const i = (y * size + x) * 4;
      color.data[i] = clamp01(px.r) * 255;
      color.data[i + 1] = clamp01(px.g) * 255;
      color.data[i + 2] = clamp01(px.b) * 255;
      color.data[i + 3] = 255;
      const r = clamp01(px.rough) * 255;
      rough.data[i] = r; rough.data[i + 1] = r; rough.data[i + 2] = r; rough.data[i + 3] = 255;
      const h = clamp01(px.height) * 255;
      height.data[i] = h; height.data[i + 1] = h; height.data[i + 2] = h; height.data[i + 3] = 255;
    }
  }
  layers.cc.putImageData(color, 0, 0);
  layers.rc.putImageData(rough, 0, 0);
  layers.hc.putImageData(height, 0, 0);
}

/** 在 (x,y) 及其跨边界的镜像位置重复绘制, 保证贴图平铺无缝。 */
export function wrapDraw(size: number, x: number, y: number, reach: number, draw: (ox: number, oy: number) => void): void {
  for (const ox of [0, -size, size]) {
    if (ox !== 0 && (x + ox < -reach || x + ox > size + reach)) continue;
    for (const oy of [0, -size, size]) {
      if (oy !== 0 && (y + oy < -reach || y + oy > size + reach)) continue;
      draw(x + ox, y + oy);
    }
  }
}

/** 在三张图层上用同一路径画一块污渍: 颜色压暗、粗糙度改变、高度微凹。 */
export function stain(layers: SurfaceLayers, rng: Rng, x: number, y: number, radius: number, opts: {
  color: string; alpha: number; rough: number; roughAlpha: number;
}): void {
  const { cc, rc, size } = layers;
  const blobs = 5 + Math.floor(rng() * 6);
  const pts = Array.from({ length: blobs }, () => [
    (rng() - 0.5) * radius * 1.2, (rng() - 0.5) * radius * 1.2, radius * (0.3 + rng() * 0.6),
  ]);
  wrapDraw(size, x, y, radius * 2, (px, py) => {
    for (const [dx, dy, r] of pts) {
      const g = cc.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r);
      g.addColorStop(0, opts.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      cc.globalAlpha = opts.alpha;
      cc.fillStyle = g;
      cc.beginPath(); cc.arc(px + dx, py + dy, r, 0, Math.PI * 2); cc.fill();
      const v = Math.round(opts.rough * 255);
      const rg = rc.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r);
      rg.addColorStop(0, `rgb(${v},${v},${v})`);
      rg.addColorStop(1, `rgba(${v},${v},${v},0)`);
      rc.globalAlpha = opts.roughAlpha;
      rc.fillStyle = rg;
      rc.beginPath(); rc.arc(px + dx, py + dy, r, 0, Math.PI * 2); rc.fill();
    }
  });
  cc.globalAlpha = 1;
  rc.globalAlpha = 1;
}

/** 一条随机折线裂缝, 同时刻进颜色与高度。 */
export function crack(layers: SurfaceLayers, rng: Rng, x: number, y: number, length: number, width: number): void {
  const { cc, hc, size } = layers;
  const pts: [number, number][] = [[x, y]];
  let angle = rng() * Math.PI * 2;
  let cx = x;
  let cy = y;
  const segs = 8 + Math.floor(rng() * 8);
  for (let i = 0; i < segs; i += 1) {
    angle += (rng() - 0.5) * 1.1;
    cx += Math.cos(angle) * (length / segs);
    cy += Math.sin(angle) * (length / segs);
    pts.push([cx, cy]);
  }
  wrapDraw(size, x, y, length, (px, py) => {
    const ox = px - x;
    const oy = py - y;
    for (const [ctx, style, w] of [[cc, "rgba(18,16,14,0.75)", width], [hc, "rgba(0,0,0,0.9)", width * 1.4]] as const) {
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach(([ptx, pty], i) => (i ? ctx.lineTo(ptx + ox, pty + oy) : ctx.moveTo(ptx + ox, pty + oy)));
      ctx.stroke();
    }
  });
}

export function hex(color: number): [number, number, number] {
  return [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
}
