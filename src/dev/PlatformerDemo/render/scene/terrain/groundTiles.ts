import { createRandom } from "../../../engine/seededRandom";
import { SCREEN_H, WORLD_PX_W } from "../../core/grid";
import { ditherPick, shadeRamp } from "../../core/dither";
import { fbm, hash01 } from "../../core/noise";
import { RAMPS } from "../../core/palette";
import type { PixelBuffer, Point } from "../../core/pixelBuffer";
import { flowers, grass, vine } from "../flora";
import { T, beamShade, brickShade, crumble, type TerrainLight } from "./terrainKit";

// 可站立地形：地面段与浮空平台。顶面行即角色脚底所在行。

export interface Span {
  x0: number;
  x1: number;
  top: number;
  seed: number;
}

const DECK = 14;
const BEAM = 6;

/** 苔藓草皮沿：顶面 2~3 行苔藓 + 偶发苔滴 + 草叶与小花。 */
function mossLip(buf: PixelBuffer, x0: number, x1: number, top: number, seed: number) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let x = Math.round(x0); x <= Math.round(x1); x++) {
    if (buf.get(x, top + 3) === 0) continue;
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
    const depth = 2 + Math.round(hash01(x, 0, seed) * 1.4);
    for (let i = 0; i < depth; i++) buf.set(x, top + i, T.moss[Math.max(2, 5 - i)]);
    if (hash01(x, 1, seed) > 0.84) {
      const drip = 1 + Math.round(hash01(x, 2, seed) * 5);
      for (let i = 0; i < drip; i++) buf.set(x, top + depth + i, T.moss[i === 0 ? 3 : 2]);
    }
  }
  if (hi < lo) return;
  grass(buf, lo + 1, hi - 1, top, seed, T.moss, 4);
  flowers(buf, lo + 3, hi - 3, top, seed, [T.pink, T.gold], 0.05);
}

/** 深处向墨色抖动渐暗，模拟地下的空间感。 */
function sink(color: number, t: number, x: number, y: number): number {
  return t <= 0 ? color : ditherPick(color, T.ink[1], Math.min(1, t), x, y);
}

export function groundSegment(buf: PixelBuffer, s: Span, lights: TerrainLight[]) {
  const rand = createRandom(s.seed);
  const { x0, x1, top } = s;
  const beamTop = top + DECK;
  const beamBottom = beamTop + BEAM;

  // 地下支撑柱与斜撑：越深越暗，没入深渊。
  for (let sx = x0 + rand.range(10, 24); sx < x1 - 12; sx += rand.range(34, 46)) {
    const cx = Math.round(sx);
    buf.paint(cx - 4, beamBottom, cx + 4, SCREEN_H - 1, (x, y) => {
      const c = brickShade(x, y, beamBottom, { ramp: T.stone, len: 9, rows: 5, seed: s.seed + 9, moss: 0.4, mossTop: beamBottom });
      return sink(c, (y - beamBottom - 8) / 26, x, y);
    });
    buf.capsule(cx + 4, beamBottom + 1, cx + 16, beamBottom + 11, 0.9, T.metal[2]);
  }

  // 黄铜管线与管箍。
  const pipeY = beamBottom + 5;
  buf.paint(x0 + 4, pipeY - 2, x1 - 4, pipeY + 1, (_x, y) => T.brass[[5, 4, 3, 2][y - (pipeY - 2)]]);
  for (let jx = x0 + 14; jx < x1 - 8; jx += 30) buf.rect(jx, pipeY - 3, 3, 6, (x, y) => shadeRamp(T.metal, 0.75 - (x - jx) * 0.15 - (y - pipeY + 3) * 0.05, x, y));

  for (let vx = x0 + rand.range(4, 14); vx < x1 - 4; vx += rand.range(9, 20)) {
    vine(buf, { x: vx, y: beamBottom, length: Math.round(rand.range(5, 30)), seed: rand.int(1, 1e6), leaf: T.leaf, flower: T.pink });
  }

  // 金属梁 + 生物光槽。
  buf.paint(x0, beamTop, x1 - 1, beamBottom - 1, (x, y) => beamShade(x, y, beamTop, BEAM, s.seed));
  for (let lx = x0 + 18; lx < x1 - 22; lx += 44) {
    buf.rect(lx, beamTop + 2, 12, 2, T.bio[4]);
    buf.rect(lx + 2, beamTop + 2, 8, 1, T.bio[5]);
    lights.push({ x: lx + 6, y: beamTop + 3, radius: 16, color: RAMPS.bio[3], strength: 0.55, flicker: 0 });
  }

  // 石砖路面，两端参差断口。
  const style = { ramp: T.stone, len: 14, rows: 7, seed: s.seed, moss: 0.9, mossTop: top + 2 };
  buf.paint(x0, top, x1 - 1, beamTop - 1, (x, y) => {
    if (x0 > 0 && crumble(x, y, x0, -1, s.seed)) return 0;
    if (x1 < WORLD_PX_W && crumble(x, y, x1 - 1, 1, s.seed)) return 0;
    return brickShade(x, y, top, style);
  });
  mossLip(buf, x0, x1 - 1, top, s.seed);
}

/** 浮空平台：一层石板 + 倒锥岩体底座 + 底部黄铜推进环与生物光。 */
export function floatingPlatform(buf: PixelBuffer, s: Span, lights: TerrainLight[]) {
  const rand = createRandom(s.seed);
  const { x0, x1, top } = s;
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const slab = 7;
  const depth = 12 + w * 0.14;
  const under: Point[] = [[x0 + 1, top + slab - 1], [x1 - 1, top + slab - 1]];
  const steps = 7;
  for (let i = steps - 1; i >= 1; i--) {
    const t = i / steps;
    under.push([x0 + w * t + rand.range(-2, 2), top + slab + Math.sin(t * Math.PI) ** 0.9 * depth * rand.range(0.75, 1.05)]);
  }
  buf.polygon(under, (x, y) => {
    const d = (y - top - slab) / depth;
    const strata = fbm(x * 0.08, y * 0.35, s.seed, 3);
    const v = 0.52 + ((cx - x) / w) * 0.35 - d * 0.45 + (strata - 0.5) * 0.35;
    return shadeRamp(T.stone, v, x, y);
  });

  const bottom = top + slab + depth * 0.95;
  buf.ellipse(cx, bottom - 1, 5, 2.5, (x, y) => shadeRamp(T.brass, 0.75 - (x - cx + 5) * 0.06 - (y - bottom) * 0.1, x, y));
  buf.rect(cx - 2, bottom + 1, 4, 1, T.bio[5]);
  buf.rect(cx - 3, bottom + 2, 6, 1, T.bio[3]);
  lights.push({ x: Math.round(cx), y: Math.round(bottom + 3), radius: 18, color: RAMPS.bio[3], strength: 0.7, flicker: s.seed });

  for (let i = 0; i < 3; i++) {
    const vx = x0 + w * (0.2 + i * 0.3) + rand.range(-3, 3);
    const vy = top + slab + Math.sin(((vx - x0) / w) * Math.PI) * depth * 0.45;
    vine(buf, { x: vx, y: vy, length: Math.round(rand.range(6, 18)), seed: rand.int(1, 1e6), leaf: T.leaf });
  }

  const style = { ramp: T.ivory, len: 10, rows: 7, seed: s.seed, moss: 0.7, mossTop: top + 2 };
  buf.paint(x0, top, x1 - 1, top + slab - 1, (x, y) => {
    if (crumble(x, y, x0, -1, s.seed) || crumble(x, y, x1 - 1, 1, s.seed)) return 0;
    return brickShade(x, y, top, style);
  });
  mossLip(buf, x0, x1 - 1, top, s.seed);
}
