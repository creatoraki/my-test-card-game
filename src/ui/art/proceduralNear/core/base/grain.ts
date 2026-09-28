import { createRandom, type Random } from "./random";

// 共享材质纹理：256² 可平铺噪声，全局只生成一次，按画布上下文缓存为 CanvasPattern 叠加使用。
// grain = 细颗粒明暗斑；rust = 成片锈斑；grime = 竖向脏污流痕。

export type TextureKind = "grain" | "rust" | "grime";

const SIZE = 256;
const sources = new Map<TextureKind, HTMLCanvasElement>();
const patterns = new WeakMap<CanvasRenderingContext2D, Map<TextureKind, CanvasPattern>>();

interface Octave { cx: number; cy: number; grid: Float32Array; }

function octave(rand: Random, cx: number, cy = cx): Octave {
  const grid = new Float32Array(cx * cy);
  for (let i = 0; i < grid.length; i++) grid[i] = rand.next();
  return { cx, cy, grid };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 周期边界的值噪声，保证纹理左右上下可无缝平铺。 */
function sample(o: Octave, u: number, v: number): number {
  const x = u * o.cx;
  const y = v * o.cy;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const at = (i: number, j: number) => o.grid[((j % o.cy) + o.cy) % o.cy * o.cx + ((i % o.cx) + o.cx) % o.cx];
  const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
  const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
  return top + (bottom - top) * fy;
}

function fbm(octaves: Octave[], u: number, v: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (const o of octaves) {
    sum += sample(o, u, v) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

const band = (lo: number, hi: number, v: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

function buildTexture(kind: TextureKind): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const rand = createRandom(kind === "grain" ? 11 : kind === "rust" ? 23 : 37);
  const mottling = [octave(rand, 4), octave(rand, 8), octave(rand, 16), octave(rand, 32)];
  const tint = [octave(rand, 6), octave(rand, 12)];
  const streaks = [octave(rand, 48, 3), octave(rand, 96, 6), octave(rand, 128, 12)];
  const d = img.data;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const i = (y * SIZE + x) * 4;
      if (kind === "grain") {
        const speck = rand.next() - 0.5;
        const m = fbm(mottling, u, v);
        const light = speck + (m - 0.5) * 0.6 > 0;
        const c = light ? 255 : 0;
        d[i] = c; d[i + 1] = c; d[i + 2] = c;
        d[i + 3] = Math.abs(speck) * (light ? 70 : 150) * (0.55 + m);
      } else if (kind === "rust") {
        const f = fbm(mottling, u, v) + (rand.next() - 0.5) * 0.08;
        const a = band(0.5, 0.68, f);
        const t = fbm(tint, u, v);
        d[i] = 110 + t * 70; d[i + 1] = 52 + t * 38; d[i + 2] = 24 + t * 14;
        d[i + 3] = a * (150 + t * 90);
      } else {
        const f = fbm(streaks, u, v);
        const a = band(0.5, 0.78, f) * (0.5 + fbm(mottling, u, v) * 0.7);
        d[i] = 6; d[i + 1] = 7; d[i + 2] = 9;
        d[i + 3] = Math.min(255, a * 230);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function source(kind: TextureKind): HTMLCanvasElement {
  let canvas = sources.get(kind);
  if (!canvas) {
    canvas = buildTexture(kind);
    sources.set(kind, canvas);
  }
  return canvas;
}

export function texturePattern(ctx: CanvasRenderingContext2D, kind: TextureKind): CanvasPattern {
  let map = patterns.get(ctx);
  if (!map) {
    map = new Map();
    patterns.set(ctx, map);
  }
  let pattern = map.get(kind);
  if (!pattern) {
    pattern = ctx.createPattern(source(kind), "repeat")!;
    map.set(kind, pattern);
  }
  return pattern;
}

/**
 * 在矩形内叠一层材质纹理；调用方负责先 clip 到形状。
 * shift 让不同建筑取到纹理的不同区域；图案锚在世界坐标，跨块绘制时位置一致。
 */
export function fillTexture(
  ctx: CanvasRenderingContext2D,
  kind: TextureKind,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
  shift = 0,
  scale = 1,
): void {
  const pattern = texturePattern(ctx, kind);
  const stretch = kind === "grime" ? 2.4 : 1;
  pattern.setTransform(new DOMMatrix([scale, 0, 0, stretch * scale, shift % SIZE, (shift * 0.37) % SIZE]));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** 在形状内叠加颗粒与少量锈斑：体块统一的磨损手感（科技风下锈斑只作点缀）。 */
export function weatherShape(
  ctx: CanvasRenderingContext2D,
  shape: Path2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shift: number,
  rust = 0.12,
  scale = 1,
): void {
  ctx.save();
  ctx.clip(shape);
  fillTexture(ctx, "grain", x, y, w, h, 0.6, shift, scale);
  if (rust > 0) fillTexture(ctx, "rust", x, y, w, h, rust, shift * 1.7, scale);
  ctx.restore();
}

/** 构造一个矩形 Path2D，方便与 weatherShape 搭配。 */
export function rectPath(x: number, y: number, w: number, h: number): Path2D {
  const path = new Path2D();
  path.rect(x, y, w, h);
  return path;
}
