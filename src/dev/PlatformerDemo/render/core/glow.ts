import { bayer } from "./dither";
import { PixelBuffer, channels, pack, packRgb } from "./pixelBuffer";

// 像素风光晕：径向衰减被量化为若干亮度带并在交界抖动，得到分层光圈而非平滑模糊。

const LEVELS = 5;
const spriteCache = new Map<string, HTMLCanvasElement>();

function level(d: number, strength: number, x: number, y: number): number {
  if (d >= 1) return 0;
  const f = (1 - d) * (1 - d) * strength;
  return Math.min(1, Math.floor(f * LEVELS + bayer(x, y)) / LEVELS);
}

/** 预生成的光晕贴图，以 lighter 合成方式叠到主画布上。 */
export function glowSprite(hex: string, radius: number, strength = 1): HTMLCanvasElement {
  const r = Math.max(1, Math.round(radius));
  const key = `${hex}/${r}/${strength}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const size = r * 2 + 1;
  const buf = new PixelBuffer(size, size);
  const [cr, cg, cb] = channels(pack(hex));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = level(Math.hypot(x - r, y - r) / r, strength, x, y);
      if (a > 0) buf.put(x, y, packRgb(cr, cg, cb, a * 255));
    }
  }
  const canvas = buf.toCanvas();
  spriteCache.set(key, canvas);
  return canvas;
}

/** 烘焙阶段直接把光晕加到已有像素上（照亮墙面、地面）。 */
export function bakeGlow(buf: PixelBuffer, cx: number, cy: number, radius: number, hex: string, strength = 0.6) {
  const [cr, cg, cb] = channels(pack(hex));
  const r = Math.ceil(radius);
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const a = level(Math.hypot(x - cx, y - cy) / radius, strength, x, y);
      if (a > 0) buf.add(x, y, cr * a * 0.5, cg * a * 0.5, cb * a * 0.5);
    }
  }
}
