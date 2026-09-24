import { createRandom } from "../../engine/seededRandom";
import { shadeRamp, type PackedRamp } from "../core/dither";
import { hash01 } from "../core/noise";
import { PixelBuffer } from "../core/pixelBuffer";
import { postProcess, type PostOptions } from "../core/spritePost";

// 植被画师：树冠由许多小叶团叠成，每个叶团按左上光源单独受光，叶缘用像素噪声打碎，
// 形成像素游戏中常见的「簇状叶片」质感。所有函数只接收打包色阶，画风由调色板统一。

/** 在临时缓冲中绘制一个元素，经描边/边缘光后处理再贴回目标图层。 */
export function stamp(target: PixelBuffer, left: number, top: number, w: number, h: number, draw: (tmp: PixelBuffer) => void, post?: PostOptions) {
  const tmp = new PixelBuffer(Math.ceil(w), Math.ceil(h));
  draw(tmp);
  postProcess(tmp, post);
  target.blit(tmp, left, top);
}

export interface FoliageSpec {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  seed: number;
  ramp: PackedRamp;
  /** 叶团平均半径。 */
  clump?: number;
  /** 整体明度偏移（远景压暗用）。 */
  bias?: number;
}

export function foliage(buf: PixelBuffer, { cx, cy, rx, ry, seed, ramp, clump = 4, bias = 0 }: FoliageSpec) {
  const rand = createRandom(seed);
  const count = Math.max(4, Math.round(((rx * ry) / (clump * clump)) * 1.1));
  const blobs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < count; i++) {
    const a = rand.range(0, Math.PI * 2);
    const d = Math.sqrt(rand.next()) * 0.85;
    blobs.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r: clump * rand.range(0.7, 1.35) });
  }
  // 上方叶团先画，下方叶团覆盖其上，形成自上而下的层叠。
  blobs.sort((a, b) => a.y - b.y);
  for (const blob of blobs) {
    const bx = blob.x;
    const by = blob.y;
    const r = blob.r;
    buf.paint(bx - r - 1, by - r - 1, bx + r + 1, by + r + 1, (x, y) => {
      const nx = (x + 0.5 - bx) / r;
      const ny = (y + 0.5 - by) / r;
      const d = nx * nx + ny * ny;
      if (d > 1 - hash01(x, y, seed) * 0.35) return 0;
      const lit = -(nx * 0.5 + ny * 0.85);
      const gy = (y - (cy - ry)) / (ry * 2);
      const gx = (cx - x) / rx;
      const v = 0.5 + lit * 0.28 - gy * 0.32 + gx * 0.08 + (hash01(x, y, seed + 7) - 0.5) * 0.1 + bias;
      return shadeRamp(ramp, v, x, y);
    });
  }
}

export interface TreeSpec {
  x: number;
  y: number;
  height: number;
  seed: number;
  leaf: PackedRamp;
  bark: PackedRamp;
  bias?: number;
}

/** 树：带弯曲与分叉的树干 + 2~3 团树冠。x,y 为树根中心。 */
export function tree(buf: PixelBuffer, { x, y, height, seed, leaf, bark, bias = 0 }: TreeSpec) {
  const rand = createRandom(seed);
  const baseW = Math.max(2, height * 0.09);
  const topW = Math.max(1, baseW * 0.45);
  const lean = rand.range(-0.18, 0.18) * height;
  const trunkTop = y - height * 0.62;
  const spineX = (py: number) => {
    const t = (y - py) / (y - trunkTop);
    return x + lean * t * t + Math.sin(t * 3 + seed) * 0.8;
  };
  buf.paint(x - baseW * 2 - Math.abs(lean), trunkTop, x + baseW * 2 + Math.abs(lean), y, (px, py) => {
    const t = (y - py) / (y - trunkTop);
    const flare = t < 0.12 ? (0.12 - t) * 8 : 0;
    const half = baseW + (topW - baseW) * t + flare;
    const off = px + 0.5 - spineX(py);
    if (Math.abs(off) > half) return 0;
    const across = off / half;
    const grain = hash01(px, Math.floor(py / 3), seed) * 0.12;
    return shadeRamp(bark, 0.55 - across * 0.3 + grain + bias, px, py);
  });
  const branches = rand.int(1, 2);
  for (let i = 0; i < branches; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const by = y - height * rand.range(0.4, 0.55);
    const bx = spineX(by);
    buf.capsule(bx, by, bx + side * height * 0.22, by - height * 0.16, Math.max(0.8, topW * 0.6), bark[2]);
  }
  const cw = height * rand.range(0.38, 0.48);
  foliage(buf, { cx: spineX(trunkTop) - cw * 0.35, cy: trunkTop + height * 0.02, rx: cw * 0.7, ry: cw * 0.5, seed: seed + 1, ramp: leaf, bias: bias - 0.05 });
  foliage(buf, { cx: spineX(trunkTop) + cw * 0.4, cy: trunkTop + height * 0.05, rx: cw * 0.65, ry: cw * 0.45, seed: seed + 2, ramp: leaf, bias: bias - 0.04 });
  foliage(buf, { cx: spineX(trunkTop), cy: trunkTop - height * 0.12, rx: cw * 0.85, ry: cw * 0.6, seed: seed + 3, ramp: leaf, bias });
}

export interface VineSpec {
  x: number;
  y: number;
  length: number;
  seed: number;
  leaf: PackedRamp;
  /** 叶片密度（每隔多少像素一片叶）。 */
  spacing?: number;
  flower?: PackedRamp;
}

/** 垂藤：1px 藤茎左右缓摆，交替生出 2~3px 的叶片，末端渐细。 */
export function vine(buf: PixelBuffer, { x, y, length, seed, leaf, spacing = 3, flower }: VineSpec, sway = 0) {
  const rand = createRandom(seed);
  const phase = rand.range(0, Math.PI * 2);
  const amp = rand.range(0.8, 2.2);
  const last = leaf.length - 1;
  for (let d = 0; d <= length; d++) {
    const k = d / Math.max(1, length);
    const px = Math.round(x + Math.sin(phase + d * 0.22) * amp + sway * k * k);
    const py = y + d;
    buf.set(px, py, leaf[Math.max(0, 2 - Math.round(k))]);
    if (d > 1 && d % spacing === 0 && k < 0.97) {
      const side = (d / spacing) % 2 === 0 ? 1 : -1;
      const tone = Math.min(last, 3 + (hash01(d, 1, seed) > 0.55 ? 1 : 0));
      buf.set(px + side, py, leaf[tone]);
      buf.set(px + side * 2, py + 1, leaf[tone - 1]);
      if (hash01(d, 2, seed) > 0.6) buf.set(px + side, py - 1, leaf[Math.min(last, tone + 1)]);
      if (flower && hash01(d, 3, seed) > 0.86) buf.set(px - side, py, flower[3]);
    }
  }
}

/** 草丛：按列生成 1~h 像素的草叶，顶端亮、根部暗。baseline 为草根所在行。 */
export function grass(buf: PixelBuffer, x0: number, x1: number, baseline: number, seed: number, ramp: PackedRamp, maxH = 3) {
  const last = ramp.length - 1;
  for (let x = Math.round(x0); x <= Math.round(x1); x++) {
    const n = hash01(x, 0, seed);
    const h = n > 0.35 ? Math.round(1 + hash01(x, 1, seed) * (maxH - 1)) : 0;
    for (let i = 1; i <= h; i++) {
      const tone = Math.min(last, 3 + Math.round((i / h) * 2) - (hash01(x, i, seed) > 0.7 ? 1 : 0));
      buf.set(x, baseline - i, ramp[tone]);
    }
  }
}

export function flowers(buf: PixelBuffer, x0: number, x1: number, baseline: number, seed: number, ramps: readonly PackedRamp[], density = 0.08) {
  for (let x = Math.round(x0); x <= Math.round(x1); x++) {
    if (hash01(x, 9, seed) > density) continue;
    const ramp = ramps[Math.floor(hash01(x, 10, seed) * ramps.length)];
    const top = baseline - 2 - Math.round(hash01(x, 11, seed) * 2);
    buf.set(x, top, ramp[3]);
    buf.set(x, top - 1, ramp[4]);
    buf.set(x + 1, top, ramp[2]);
  }
}
