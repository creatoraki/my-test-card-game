import { createRandom } from "../../../engine/seededRandom";
import { shadeRamp } from "../../core/dither";
import { hash01 } from "../../core/noise";
import { RAMPS } from "../../core/palette";
import type { PixelBuffer } from "../../core/pixelBuffer";
import { flowers, foliage, tree, vine } from "../flora";
import { T, brickShade, type TerrainLight } from "./terrainKit";
import type { Span } from "./groundTiles";

// 地面后方装饰：远排为残破拱门与大树，近排为石栏杆、路灯与花槽。全部位于角色身后。

export type DecorKind = "lamp" | "planter" | "tree" | "arch";

export interface DecorItem {
  kind: DecorKind;
  x: number;
  seed: number;
}

/** 沿用种子布局：每段地面上按间距交替放置装饰。 */
export function layoutDecor(s: Span): DecorItem[] {
  const rand = createRandom(s.seed + 5);
  const items: DecorItem[] = [];
  for (let x = s.x0 + rand.range(40, 80); x < s.x1 - 36; x += rand.range(62, 104)) {
    items.push({ kind: rand.pick(["lamp", "planter", "tree", "arch", "lamp", "planter"] as const), x: Math.round(x), seed: rand.int(1, 1e6) });
  }
  return items;
}

/** 残破拱门：两根砖柱 + 半圆拱，一侧拱肩断裂，爬满苔藓与垂藤。 */
export function ruinedArch(buf: PixelBuffer, x: number, top: number, seed: number) {
  const rand = createRandom(seed);
  const span = Math.round(rand.range(26, 38));
  const h = Math.round(rand.range(40, 56));
  const pw = 6;
  const left = x - span / 2 - pw;
  const right = x + span / 2;
  const archY = top - h;
  const broken = rand.chance(0.5) ? -1 : 1;
  const style = { ramp: T.ivory, len: 6, rows: 4, seed, moss: 0.75, mossTop: archY };
  const r = span / 2 + pw;
  buf.paint(left, archY - r, right + pw, top - 1, (px, py) => {
    const inPillar = (px >= left && px < left + pw) || (px >= right && px < right + pw);
    const dx = px + 0.5 - x;
    const dy = py + 0.5 - archY;
    const d = Math.hypot(dx, dy);
    const inArch = dy <= 0 && d <= r && d >= span / 2;
    if (!(inPillar && py >= archY) && !inArch) return 0;
    // 断裂一侧：拱肩缺一块，并让柱顶参差。
    if (Math.sign(dx) === broken && dy < 0 && Math.atan2(-dy, Math.abs(dx)) < 1.1 - hash01(Math.floor(py / 2), 0, seed) * 0.4) return 0;
    return brickShade(px, py, archY - r, style);
  });
  for (let i = 0; i < 3; i++) {
    const vx = x + (i - 1) * span * 0.35 + rand.range(-2, 2);
    const vy = archY - Math.sqrt(Math.max(0, (span / 2) ** 2 - (vx - x) ** 2)) + 1;
    if (Math.sign(vx - x) !== broken) vine(buf, { x: vx, y: vy, length: Math.round(rand.range(8, 22)), seed: seed + i, leaf: T.leaf, flower: T.gold });
  }
  foliage(buf, { cx: left + pw / 2, cy: top - 4, rx: 7, ry: 4, seed: seed + 8, ramp: T.leaf, clump: 3 });
}

/** 石栏杆：扶手 + 花瓶形栏柱，部分栏柱缺失、扶手断开。 */
export function balustrade(buf: PixelBuffer, s: Span) {
  const top = s.top - 13;
  const railBreak = (x: number) => hash01(Math.floor(x / 9), 1, s.seed) > 0.86;
  for (let x = s.x0 + 6; x < s.x1 - 6; x++) {
    if (railBreak(x)) continue;
    buf.set(x, top, T.ivory[6]);
    buf.set(x, top + 1, T.ivory[4]);
    buf.set(x, top + 2, T.ivory[2]);
    if (hash01(x, 3, s.seed) > 0.7) buf.set(x, top - 1, T.moss[4]);
  }
  const profile = [2, 3, 3, 2, 1, 1, 2, 3, 3, 2];
  for (let bx = s.x0 + 8; bx < s.x1 - 8; bx += 6) {
    if (hash01(bx, 2, s.seed) > 0.82) continue;
    for (let i = 0; i < profile.length; i++) {
      const w = profile[i];
      const y = top + 3 + i;
      for (let k = 0; k < w; k++) buf.set(bx - Math.floor(w / 2) + k, y, T.ivory[k === 0 ? 5 : k === w - 1 ? 2 : 4]);
    }
  }
  const rand = createRandom(s.seed + 31);
  for (let vx = s.x0 + rand.range(10, 40); vx < s.x1 - 10; vx += rand.range(30, 70)) {
    if (!railBreak(vx)) vine(buf, { x: vx, y: top + 2, length: Math.round(rand.range(4, 10)), seed: rand.int(1, 1e6), leaf: T.leaf, flower: T.pink });
  }
}

/** 路灯：细金属灯杆 + 黄铜灯笼，暖光登记为可闪烁光源。 */
export function lampPost(buf: PixelBuffer, x: number, top: number, seed: number, lights: TerrainLight[]) {
  const h = 44;
  buf.rect(x - 3, top - 3, 7, 3, (px, py) => shadeRamp(T.metal, 0.7 - (px - x + 3) * 0.08 - (py - top + 3) * 0.1, px, py));
  buf.rect(x - 1, top - h, 2, h - 3, (px) => (px === x - 1 ? T.metal[4] : T.metal[2]));
  buf.capsule(x, top - h, x + 5, top - h - 2, 0.7, T.metal[3]);
  const lx = x + 5;
  const ly = top - h + 4;
  buf.rect(lx - 3, ly - 6, 7, 1, T.brass[4]);
  buf.rect(lx - 2, ly - 7, 5, 1, T.brass[5]);
  buf.rect(lx - 3, ly - 5, 7, 6, (px, py) => {
    const edge = px === lx - 3 || px === lx + 3;
    if (edge) return T.brass[px === lx - 3 ? 4 : 2];
    return py === ly - 5 || py === ly ? T.lamp[3] : T.lamp[5];
  });
  buf.rect(lx - 2, ly + 1, 5, 1, T.brass[3]);
  lights.push({ x: lx, y: ly - 2, radius: 30, color: RAMPS.lamp[3], strength: 0.85, flicker: seed });
}

/** 花槽：象牙石砌矮槽 + 灌木丛 + 零星花朵 + 前沿一条生物光。 */
export function planter(buf: PixelBuffer, x: number, top: number, seed: number) {
  const w = 20;
  const h = 8;
  foliage(buf, { cx: x, cy: top - h - 4, rx: 12, ry: 6, seed, ramp: T.leaf, clump: 3 });
  flowers(buf, x - 10, x + 10, top - h - 4, seed, [T.pink, T.gold], 0.3);
  const style = { ramp: T.ivory, len: 7, rows: 4, seed, moss: 0.5, mossTop: top - h };
  buf.paint(x - w / 2, top - h, x + w / 2 - 1, top - 1, (px, py) => brickShade(px, py, top - h, style));
  buf.rect(x - w / 2 + 3, top - 4, w - 6, 1, T.bio[4]);
}

export function backTree(buf: PixelBuffer, x: number, top: number, seed: number) {
  tree(buf, { x, y: top, height: 52 + hash01(seed, 0, 1) * 22, seed, leaf: T.leaf, bark: T.bark, bias: -0.06 });
}
