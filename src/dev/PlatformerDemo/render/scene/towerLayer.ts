import { createRandom } from "../../engine/seededRandom";
import { SCREEN_H, layerPxWidth } from "../core/grid";
import { packRamp, shadeRamp } from "../core/dither";
import { hash01 } from "../core/noise";
import { FOG, RAMPS, fogRamp } from "../core/palette";
import { PixelBuffer, pack } from "../core/pixelBuffer";
import { foliage, stamp, vine } from "./flora";
import { hazeBand } from "./haze";

// 中景：方舟高塔群。象牙塔身 + 深青环带 + 暖色窗灯，塔腰挂环形空中花园并垂下瀑布，塔间有拱桥。

const W = layerPxWidth("tower");
const FOG_AMOUNT = 0.42;

const IVORY = packRamp(fogRamp(RAMPS.ivory, FOG_AMOUNT, FOG.tower));
const METAL = packRamp(fogRamp(RAMPS.metal, FOG_AMOUNT, FOG.tower));
const LEAF = packRamp(fogRamp(RAMPS.leaf, 0.38, FOG.tower));
const WATER = packRamp(fogRamp(RAMPS.water, 0.3, FOG.tower));
const WINDOW = pack(fogRamp(RAMPS.lamp, 0.15, FOG.tower)[4]);
const WINDOW_DIM = pack(fogRamp(RAMPS.lamp, 0.35, FOG.tower)[2]);
const BIO = pack(fogRamp(RAMPS.bio, 0.2, FOG.tower)[3]);
const LINE = { outline: 0.45, rim: 0.3, shade: 0.2 };

export interface TowerSpec {
  x: number;
  w: number;
  top: number;
  cap: "dome" | "spire";
  ringY: number;
  ringW: number;
  fall: -1 | 0 | 1;
  seed: number;
}

export function buildTowers(): TowerSpec[] {
  const rand = createRandom(37);
  const list: TowerSpec[] = [];
  for (let x = rand.range(20, 50); x < W + 30; x += rand.range(88, 126)) {
    const w = rand.range(18, 30);
    const top = rand.range(62, 132);
    list.push({
      x,
      w,
      top,
      cap: rand.chance(0.5) ? "dome" : "spire",
      ringY: top + rand.range(26, 64),
      ringW: w * rand.range(1.7, 2.3),
      fall: rand.chance(0.6) ? (rand.chance(0.5) ? 1 : -1) : 0,
      seed: rand.int(1, 1e6),
    });
  }
  return list;
}

function towerBody(buf: PixelBuffer, t: TowerSpec, ox: number) {
  const cx = t.x - ox;
  const left = cx - t.w / 2;
  // 塔身自上而下略微外扩，竖向壁柱一明一暗，横向深青环带分节。
  buf.paint(left - 4, t.top, left + t.w + 4, SCREEN_H, (x, y) => {
    const flare = ((y - t.top) / (SCREEN_H - t.top)) ** 2 * 4;
    const l = left - flare;
    const across = (x + 0.5 - l) / (t.w + flare * 2);
    if (across < 0 || across > 1) return 0;
    const band = (y - t.top) % 18;
    if (band < 2) return shadeRamp(METAL, 0.62 - across * 0.45 + (band === 0 ? 0.12 : 0), x, y);
    const col = Math.floor(x - l) % 6;
    const rib = col === 0 ? 0.1 : col === 1 ? -0.08 : 0;
    return shadeRamp(IVORY, 0.72 - across * 0.5 - (y - t.top) / 600 + rib, x, y);
  });
  if (t.cap === "dome") {
    buf.ellipse(cx, t.top, t.w / 2 + 1, t.w * 0.42, (x, y) => (y > t.top ? 0 : shadeRamp(IVORY, 0.78 - ((x - left) / t.w) * 0.5, x, y)));
    buf.rect(cx - 0.5, t.top - t.w * 0.42 - 4, 1, 4, METAL[3]);
  } else {
    buf.polygon([[left - 1, t.top], [cx, t.top - t.w * 1.5], [left + t.w + 1, t.top]], (x, y) => shadeRamp(IVORY, 0.76 - ((x - left) / t.w) * 0.5, x, y));
  }
  // 窗格：每隔一层一排小窗，暖灯随机亮灭。
  for (let wy = Math.round(t.top + 6); wy < SCREEN_H - 6; wy += 9) {
    for (let wx = Math.round(left + 3); wx < left + t.w - 3; wx += 4) {
      const n = hash01(wx + Math.round(ox), wy, t.seed);
      if (n < 0.35) continue;
      const c = n > 0.72 ? WINDOW : WINDOW_DIM;
      buf.set(wx, wy, c);
      buf.set(wx, wy + 1, c);
    }
  }
  buf.rect(Math.round(cx), t.top + 4, 1, SCREEN_H - t.top - 4, (_x, y) => (y % 3 === 0 ? BIO : 0));
}

function ringGarden(buf: PixelBuffer, t: TowerSpec, ox: number) {
  const cx = t.x - ox;
  const half = t.ringW / 2;
  buf.ellipse(cx, t.ringY + 2, half, 4, (x, y) => shadeRamp(METAL, 0.6 - (x - cx + half) / (half * 4), x, y));
  buf.ellipse(cx, t.ringY, half, 3, (x, y) => shadeRamp(IVORY, 0.8 - (x - cx + half) / (half * 3.2), x, y));
  for (let x = Math.round(cx - half + 2); x < cx + half - 2; x += 2) buf.set(x, t.ringY + 3, BIO);
  foliage(buf, { cx: cx - half * 0.45, cy: t.ringY - 5, rx: half * 0.45, ry: 5, seed: t.seed + 1, ramp: LEAF, clump: 3 });
  foliage(buf, { cx: cx + half * 0.5, cy: t.ringY - 4, rx: half * 0.35, ry: 4, seed: t.seed + 2, ramp: LEAF, clump: 3 });
  const rand = createRandom(t.seed);
  for (let i = 0; i < 4; i++) {
    vine(buf, { x: cx - half + 3 + ((half * 2 - 6) * (i + 0.5)) / 4, y: t.ringY + 4, length: Math.round(rand.range(8, 28)), seed: t.seed + 10 + i, leaf: LEAF });
  }
}

/** 瀑布：竖向水柱，内部用错位条纹表现水流，底部并入雾海。 */
function waterfall(buf: PixelBuffer, t: TowerSpec, ox: number) {
  const fx = t.x - ox + t.fall * (t.ringW / 2 - 5);
  const top = t.ringY + 3;
  buf.paint(fx - 3, top, fx + 3, SCREEN_H, (x, y) => {
    const across = Math.abs(x + 0.5 - fx) / 3.5;
    if (across > 1) return 0;
    const streak = hash01(x, Math.floor((y + x * 7) / 5), t.seed) > 0.6 ? 0.2 : 0;
    return shadeRamp(WATER, 0.72 - across * 0.4 + streak, x, y);
  });
}

function bridge(buf: PixelBuffer, a: TowerSpec, b: TowerSpec, y: number) {
  const x1 = a.x + a.w / 2;
  const x2 = b.x - b.w / 2;
  for (let x = Math.round(x1); x <= Math.round(x2); x++) {
    const t = (x - x1) / (x2 - x1);
    const sag = Math.round(Math.sin(t * Math.PI) * 6);
    buf.set(x, y + sag, IVORY[5]);
    buf.set(x, y + sag + 1, IVORY[3]);
    buf.set(x, y + sag + 2, METAL[2]);
    if (x % 3 === 0) buf.set(x, y + sag - 2, METAL[3]);
  }
}

export function bakeTowers(): HTMLCanvasElement {
  const buf = new PixelBuffer(W, SCREEN_H);
  const towers = buildTowers();
  const rand = createRandom(41);
  for (let i = 1; i < towers.length; i++) {
    if (rand.chance(0.55)) bridge(buf, towers[i - 1], towers[i], Math.round(Math.max(towers[i - 1].top, towers[i].top) + rand.range(16, 50)));
  }
  for (const t of towers) {
    const pad = t.ringW;
    const left = Math.floor(t.x - pad);
    const top = Math.floor(t.top - t.w * 1.6 - 4);
    stamp(buf, left, top, pad * 2 + 2, SCREEN_H - top, (tmp) => {
      if (t.fall !== 0) waterfall(tmp, t, left);
      const local = { ...t, top: t.top - top, ringY: t.ringY - top };
      const shift = (fn: (b: PixelBuffer, s: TowerSpec, o: number) => void) => fn(tmp, local, left);
      shift(towerBody);
      shift(ringGarden);
    }, LINE);
  }
  hazeBand(buf, 188, FOG.tower, 0.85);
  return buf.toCanvas();
}
