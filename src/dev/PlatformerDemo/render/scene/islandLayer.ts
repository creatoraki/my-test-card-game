import { createRandom } from "../../engine/seededRandom";
import { SCREEN_H, layerPxWidth } from "../core/grid";
import { bayer, packRamp, shadeRamp } from "../core/dither";
import { fbm, hash01 } from "../core/noise";
import { FOG, RAMPS, fogRamp } from "../core/palette";
import { PixelBuffer, pack, type Point } from "../core/pixelBuffer";
import { flowers, grass, stamp, tree, vine } from "./flora";

// 近景浮岛：分层岩体(横向岩纹 + 左上受光) + 苔藓顶 + 树丛与小屋，底部垂根与瀑布，最下方铺一层被夕照染色的云海。

const W = layerPxWidth("island");
const FOG_AMOUNT = 0.26;

const STONE = packRamp(fogRamp(RAMPS.stone, FOG_AMOUNT, FOG.island));
const MOSS = packRamp(fogRamp(RAMPS.moss, FOG_AMOUNT, FOG.island));
const LEAF = packRamp(fogRamp(RAMPS.leaf, 0.2, FOG.island));
const BARK = packRamp(fogRamp(RAMPS.bark, 0.2, FOG.island));
const IVORY = packRamp(fogRamp(RAMPS.ivory, FOG_AMOUNT, FOG.island));
const WATER = packRamp(fogRamp(RAMPS.water, 0.2, FOG.island));
const CLOUD = packRamp(fogRamp(RAMPS.cloud, 0.12, FOG.island));
const PINK = packRamp(fogRamp(RAMPS.flowerPink, 0.2, FOG.island));
const GOLD = packRamp(fogRamp(RAMPS.flowerGold, 0.2, FOG.island));
const WINDOW = pack(RAMPS.lamp[4]);
const LINE = { outline: 0.6, rim: 0.35, shade: 0.25 };

interface IslandSpec {
  x: number;
  top: number;
  w: number;
  depth: number;
  seed: number;
}

/** 岩体轮廓：顶边略有起伏，底部收成不规则的倒锥。 */
function rockOutline(s: IslandSpec, ox: number, oy: number): Point[] {
  const rand = createRandom(s.seed);
  const left = s.x - s.w / 2 - ox;
  const top = s.top - oy;
  const pts: Point[] = [[left, top + 2]];
  for (let i = 1; i < 6; i++) pts.push([left + (s.w * i) / 6, top + rand.range(-1, 1)]);
  pts.push([left + s.w, top + 2]);
  const steps = 9;
  for (let i = steps - 1; i >= 1; i--) {
    const t = i / steps;
    const sag = Math.sin(t * Math.PI) ** 0.8 * s.depth * rand.range(0.7, 1.05);
    pts.push([left + s.w * t + rand.range(-3, 3), top + 4 + sag]);
  }
  return pts;
}

function island(buf: PixelBuffer, s: IslandSpec, ox: number, oy: number) {
  const rand = createRandom(s.seed + 7);
  const left = s.x - s.w / 2 - ox;
  const top = s.top - oy;
  const outline = rockOutline(s, ox, oy);
  const hasFall = rand.chance(0.35);
  const fallX = left + s.w * rand.range(0.25, 0.75);

  if (hasFall) {
    buf.paint(fallX - 2, top + 4, fallX + 2, buf.h, (x, y) => {
      const across = Math.abs(x + 0.5 - fallX) / 2.5;
      if (across > 1) return 0;
      const streak = hash01(x, Math.floor((y + x * 5) / 4), s.seed) > 0.62 ? 0.22 : 0;
      return shadeRamp(WATER, 0.75 - across * 0.35 + streak, x, y);
    });
  }

  buf.polygon(outline, (x, y) => {
    const depth = (y - top) / s.depth;
    const strata = fbm(x * 0.07, y * 0.32, s.seed, 3);
    const lit = (s.x - ox - x) / s.w;
    return shadeRamp(STONE, 0.56 + lit * 0.35 - depth * 0.42 + (strata - 0.5) * 0.35, x, y);
  });

  // 垂根与藤蔓从岩体底部挂下。
  for (let i = 0; i < 5; i++) {
    const px = left + s.w * (0.15 + i * 0.17) + rand.range(-3, 3);
    const py = top + 4 + Math.sin(((px - left) / s.w) * Math.PI) * s.depth * 0.55;
    vine(buf, { x: px, y: py, length: Math.round(rand.range(6, 26)), seed: s.seed + i * 13, leaf: LEAF, spacing: 3 });
  }

  // 苔藓顶：2~4 行苔藓，偶尔沿岩壁垂下苔滴。
  for (let x = Math.round(left); x <= Math.round(left + s.w); x++) {
    const depth = 2 + Math.round(hash01(x, 0, s.seed) * 2);
    for (let i = 0; i < depth; i++) buf.set(x, Math.round(top) + i, shadeRamp(MOSS, 0.78 - i * 0.14, x, i));
    if (hash01(x, 1, s.seed) > 0.8) {
      const drip = 1 + Math.round(hash01(x, 2, s.seed) * 4);
      for (let i = 0; i < drip; i++) buf.set(x, Math.round(top) + depth + i, MOSS[2 + (i === 0 ? 1 : 0)]);
    }
  }

  if (rand.chance(0.35)) {
    const hx = Math.round(s.x - ox + rand.range(-s.w * 0.2, s.w * 0.2));
    const hy = Math.round(top);
    buf.ellipse(hx, hy, 9, 8, (x, y) => (y >= hy ? 0 : shadeRamp(IVORY, 0.8 - (x - hx + 9) / 26, x, y)));
    buf.rect(hx - 3, hy - 5, 2, 3, WINDOW);
    buf.rect(hx + 2, hy - 5, 2, 3, WINDOW);
  }

  const trees = rand.int(1, 3);
  for (let i = 0; i < trees; i++) {
    tree(buf, {
      x: left + s.w * ((i + 0.5) / trees) + rand.range(-4, 4),
      y: top + 1,
      height: rand.range(18, 32),
      seed: s.seed + 100 + i,
      leaf: LEAF,
      bark: BARK,
    });
  }
  grass(buf, left - 1, left + s.w + 1, top, s.seed, MOSS, 3);
  flowers(buf, left + 2, left + s.w - 2, top, s.seed, [PINK, GOLD], 0.07);
}

/** 云海：顶边起伏，受夕照的顶面偏暖亮，向下渐暗并用抖动过渡。 */
function cloudSea(buf: PixelBuffer) {
  for (let x = 0; x < W; x++) {
    const crest = 236 - fbm(x * 0.03, 0, 811, 3) * 20 - Math.sin(x * 0.02) * 3;
    for (let y = Math.floor(crest); y < SCREEN_H; y++) {
      const d = y - crest;
      if (d < 1.2 && bayer(x, y) > d / 1.2) continue;
      const puff = fbm(x * 0.06, y * 0.12, 812, 3);
      buf.put(x, y, shadeRamp(CLOUD, 0.95 - d * 0.03 + (puff - 0.5) * 0.35, x, y, 0.7));
    }
  }
}

export function bakeIslands(): HTMLCanvasElement {
  const buf = new PixelBuffer(W, SCREEN_H);
  const rand = createRandom(53);
  for (let x = rand.range(20, 60); x < W + 40; x += rand.range(112, 162)) {
    const spec: IslandSpec = { x, top: rand.range(150, 196), w: rand.range(48, 88), depth: rand.range(34, 58), seed: rand.int(1, 1e6) };
    const left = Math.floor(spec.x - spec.w / 2 - 12);
    const top = Math.floor(spec.top - 40);
    stamp(buf, left, top, spec.w + 24, SCREEN_H - top, (tmp) => island(tmp, spec, left, top), LINE);
  }
  cloudSea(buf);
  return buf.toCanvas();
}
