import { createRandom } from "../../engine/seededRandom";
import { SCREEN_H, layerPxWidth } from "../core/grid";
import { packRamp, shadeRamp } from "../core/dither";
import { hash01 } from "../core/noise";
import { FOG, RAMPS, fogRamp } from "../core/palette";
import { PixelBuffer, pack } from "../core/pixelBuffer";
import { foliage } from "./flora";
import { hazeBand } from "./haze";

// 远景：玻璃穹顶拱肋、母树巨型剪影与远方尖塔。整体重度雾化、无描边，只保留大轮廓与受光面。

const W = layerPxWidth("dome");
const FOG_AMOUNT = 0.62;

const IVORY = packRamp(fogRamp(RAMPS.ivory, FOG_AMOUNT, FOG.dome));
const LEAF = packRamp(fogRamp(RAMPS.leaf, 0.55, FOG.dome));
const BARK = packRamp(fogRamp(RAMPS.bark, 0.55, FOG.dome));
const WINDOW = pack(fogRamp(RAMPS.lamp, 0.3, FOG.dome)[4]);
const RIB = pack(fogRamp(RAMPS.ivory, 0.5, FOG.dome)[5]);
const RIB_DIM = pack(fogRamp(RAMPS.ivory, 0.62, FOG.dome)[4]);

/** 穹顶拱肋：以画面底部为圆心的若干椭圆弧 + 纬向环梁。 */
function ribs(buf: PixelBuffer) {
  const cx = W / 2;
  const cy = SCREEN_H + 30;
  const ry = 250;
  for (const k of [1, 0.74, 0.5, 0.27]) {
    const rx = 330 * k;
    const thick = k === 1 ? 2.2 : 1.2;
    buf.paint(cx - rx - 3, cy - ry - 3, cx + rx + 3, SCREEN_H, (x, y) => {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(d - 1) * Math.min(rx, ry) < thick ? (k === 1 ? RIB : RIB_DIM) : 0;
    });
  }
  for (const k of [0.42, 0.66, 0.86]) {
    const y = Math.round(cy - ry * k);
    const half = 330 * Math.sqrt(1 - k * k);
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const sag = Math.round(Math.sin(((x - cx + half) / (half * 2)) * Math.PI) * 6);
      buf.set(x, y + sag, RIB_DIM);
    }
  }
}

/** 远方尖塔：左侧受光，塔身零星暖色窗灯。 */
function spires(buf: PixelBuffer) {
  const rand = createRandom(23);
  for (let i = 0; i < 20; i++) {
    const x = rand.range(0, W);
    const w = rand.range(4, 11);
    const top = rand.range(118, 196);
    const tip = rand.range(10, 30);
    const left = x - w / 2;
    buf.polygon([[left, SCREEN_H], [left, top], [x, top - tip], [left + w, top], [left + w, SCREEN_H]], (px, py) => {
      const across = (px + 0.5 - left) / w;
      return shadeRamp(IVORY, 0.66 - across * 0.4 - (py - top) / 400, px, py);
    });
    for (let wy = Math.round(top + 6); wy < SCREEN_H - 20; wy += 7) {
      if (hash01(Math.round(x), wy, 23) > 0.55) buf.set(Math.round(x), wy, WINDOW);
    }
  }
}

/** 母树：粗壮板根树干 + 覆盖半个画面的巨型树冠。 */
function motherTree(buf: PixelBuffer, cx: number, scale: number, seed: number) {
  const top = SCREEN_H - 150 * scale;
  const baseW = 16 * scale;
  buf.paint(cx - baseW * 4, top, cx + baseW * 4, SCREEN_H, (x, y) => {
    const t = (SCREEN_H - y) / (SCREEN_H - top);
    const half = baseW * (0.55 + 0.45 * (1 - t)) + (t < 0.18 ? (0.18 - t) * 60 * scale : 0);
    const off = x + 0.5 - cx - Math.sin(t * 2.4) * 4 * scale;
    if (Math.abs(off) > half) return 0;
    const ridge = hash01(Math.floor(x / 2), 0, seed) * 0.15;
    return shadeRamp(BARK, 0.6 - (off / half) * 0.32 + ridge, x, y);
  });
  const spread = 150 * scale;
  foliage(buf, { cx: cx - spread * 0.55, cy: top + 8 * scale, rx: spread * 0.6, ry: 34 * scale, seed: seed + 1, ramp: LEAF, clump: 7 * scale, bias: -0.08 });
  foliage(buf, { cx: cx + spread * 0.6, cy: top + 12 * scale, rx: spread * 0.55, ry: 30 * scale, seed: seed + 2, ramp: LEAF, clump: 7 * scale, bias: -0.1 });
  foliage(buf, { cx, cy: top - 22 * scale, rx: spread * 0.85, ry: 48 * scale, seed: seed + 3, ramp: LEAF, clump: 8 * scale, bias: 0.02 });
}

export function bakeDome(): HTMLCanvasElement {
  const buf = new PixelBuffer(W, SCREEN_H);
  ribs(buf);
  spires(buf);
  motherTree(buf, W * 0.18, 0.55, 91);
  motherTree(buf, W * 0.84, 0.62, 93);
  motherTree(buf, W / 2, 1, 97);
  hazeBand(buf, 176, FOG.dome, 0.95);
  return buf.toCanvas();
}
