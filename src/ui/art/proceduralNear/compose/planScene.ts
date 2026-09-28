import {
  NEAR_SCENE_GEOMETRY,
  type BuildingKind,
  type BuildingPlacement,
  type CablePlacement,
  type NearScenePlan,
  type StreetKind,
  type StreetPlacement,
} from "../types";
import { createRandom, type Random } from "../core/base/random";
import { NEON_TONES } from "../core/base/palette";
import { floorY } from "../facade/storey";
import { BACK_KINDS, BUILDING_SPECS, FRONT_KINDS } from "../buildings/catalog";
import { FORE_KINDS, PLAZA_KINDS, SMALL_KINDS, STREET_SPECS } from "../street/catalog";

// 房间排布：纯数据，不做任何绘制。
// 前排从左到右按权重抽城市建筑（相邻不重复），楼间是人行道 / 巷口，四成概率扩成小广场；
// 广场放公交站、报刊亭等大件，楼前与巷口放小件，路灯近似等距；前景层偶尔立一根路灯杆或一段护栏。
// 后排是缩小雾化的高楼中景；相邻楼之间挂线缆，偶尔挂一串彩旗。

const G = NEAR_SCENE_GEOMETRY;
const STREET_GROUND = G.baseY + 8;
const BACK_SCALE = 0.36;
/** 门口两侧需要留空的距离。 */
const DOOR_CLEAR = 130;
/** 设施之间的最小间隔。 */
const SPACING = 30;
/** 这两类建筑门前自带摆设（矮凳、矮墙），不再额外放设施。 */
const NO_FRONT_ITEMS: readonly BuildingKind[] = ["nightStall", "metroEntrance"];

interface Gap { x0: number; x1: number; plaza: boolean; }
interface Span { x0: number; x1: number; }

function pickWeighted<K extends string>(rnd: Random, kinds: readonly K[], weight: (kind: K) => number, prev: K | null): K {
  const pool = kinds.filter((kind) => kind !== prev);
  const total = pool.reduce((sum, kind) => sum + weight(kind), 0);
  let roll = rnd.next() * total;
  for (const kind of pool) {
    roll -= weight(kind);
    if (roll < 0) return kind;
  }
  return pool[pool.length - 1];
}

function placeBuilding(rnd: Random, kind: BuildingKind, x: number, scale: number, storeys?: number): BuildingPlacement {
  const spec = BUILDING_SPECS[kind];
  const width = Math.round(rnd.range(spec.width[0], spec.width[1]));
  const level = storeys ?? rnd.pick(spec.storeys);
  const neon = rnd.pick(NEON_TONES);
  return {
    kind,
    x,
    width,
    top: floorY(level) - spec.crown,
    storeys: level,
    scale,
    seed: rnd.seed(),
    neon,
    lamps: spec.lamps(x, width, level, rnd, neon),
  };
}

function planFront(rnd: Random, width: number): { list: BuildingPlacement[]; gaps: Gap[] } {
  const list: BuildingPlacement[] = [];
  const gaps: Gap[] = [];
  let x = -Math.round(rnd.range(60, 200));
  let prev: BuildingKind | null = null;
  while (x < width + 20) {
    const kind = pickWeighted(rnd, FRONT_KINDS, (k) => BUILDING_SPECS[k].weight, prev);
    const b = placeBuilding(rnd, kind, x, 1);
    list.push(b);
    prev = kind;
    x += b.width;
    const plaza = rnd.chance(0.4);
    const gap = Math.round(plaza ? rnd.range(560, 900) : rnd.range(180, 420));
    gaps.push({ x0: x, x1: x + gap, plaza });
    x += gap;
  }
  return { list, gaps };
}

/** 后排：公寓 / 写字楼缩小到 0.36，三成位置留空，雾化后作为远近之间的中景天际线。 */
function planBack(rnd: Random, width: number): BuildingPlacement[] {
  const list: BuildingPlacement[] = [];
  let x = -Math.round(rnd.range(0, 300));
  let prev: BuildingKind | null = null;
  while (x < width + 60) {
    const kind = pickWeighted(rnd, BACK_KINDS, () => 1, prev);
    const b = placeBuilding(rnd, kind, x, BACK_SCALE, rnd.int(3, 7));
    const visible = Math.round(b.width * BACK_SCALE);
    if (rnd.chance(0.3)) {
      x += visible + Math.round(rnd.range(150, 400));
      continue;
    }
    list.push(b);
    prev = kind;
    x += visible + Math.round(rnd.range(80, 360));
  }
  return list;
}

/** 楼间线缆：两端挂在屋檐（矮楼）或从画面外垂下（出画的高楼），偶尔其中一根挂彩旗。 */
function planCables(rnd: Random, front: readonly BuildingPlacement[]): CablePlacement[] {
  const cables: CablePlacement[] = [];
  const anchor = (b: BuildingPlacement) => Math.round(b.top > 60 ? b.top + rnd.range(20, 60) : rnd.range(-20, 140));
  for (let i = 0; i < front.length - 1; i++) {
    const a = front[i];
    const b = front[i + 1];
    const gap = b.x - (a.x + a.width);
    if (gap > 1000 || !rnd.chance(0.55)) continue;
    const count = rnd.int(1, 3);
    const flagged = rnd.chance(0.3) ? rnd.int(0, count - 1) : -1;
    for (let k = 0; k < count; k++) {
      cables.push({
        x0: Math.round(a.x + a.width * rnd.range(0.7, 0.95)),
        y0: anchor(a),
        x1: Math.round(b.x + b.width * rnd.range(0.05, 0.3)),
        y1: anchor(b),
        sag: Math.round(rnd.range(20, 50) + gap * 0.06),
        width: rnd.range(2.2, 4),
        flags: k === flagged,
        seed: rnd.seed(),
      });
    }
  }
  return cables;
}

/** 街道设施：先等距放路灯，再放广场大件、巷口小件、楼前小件；全部避开门口与彼此。 */
function planStreet(rnd: Random, width: number, front: readonly BuildingPlacement[], gaps: readonly Gap[]): StreetPlacement[] {
  const list: StreetPlacement[] = [];
  const taken: Span[] = [];
  const doors = front.flatMap((b) => b.lamps.filter((lamp) => lamp.door).map((lamp) => lamp.x));
  const fits = (x0: number, x1: number) =>
    x0 > -40 && x1 < width + 40
    && !taken.some((t) => x1 > t.x0 - SPACING && x0 < t.x1 + SPACING)
    && !doors.some((d) => d > x0 - DOOR_CLEAR && d < x1 + DOOR_CLEAR);
  const widthOf = (kind: StreetKind) => Math.round(rnd.range(STREET_SPECS[kind].width[0], STREET_SPECS[kind].width[1]));
  const add = (kind: StreetKind, x: number, w: number) => {
    const slot = { x: Math.round(x), width: w, ground: STREET_GROUND, seed: rnd.seed() };
    list.push({ ...slot, kind, lamps: STREET_SPECS[kind].lamps(slot, rnd) });
    taken.push({ x0: slot.x, x1: slot.x + w });
  };
  const tryAt = (kind: StreetKind, x0: number, x1: number, attempts = 3): boolean => {
    const w = widthOf(kind);
    if (x1 - x0 < w) return false;
    for (let i = 0; i < attempts; i++) {
      const x = x0 + rnd.next() * (x1 - x0 - w);
      if (!fits(x, x + w)) continue;
      add(kind, x, w);
      return true;
    }
    return false;
  };

  // 路灯：近似等距，碰到门口就左右挪一挪。
  const lampW = STREET_SPECS.streetLamp.width[0];
  for (let x = rnd.range(250, 700); x < width - 150; x += rnd.range(1000, 1400)) {
    for (const shift of [0, 140, -140, 280, -280]) {
      if (!fits(x + shift, x + shift + lampW)) continue;
      add("streetLamp", x + shift, lampW);
      break;
    }
  }
  for (const gap of gaps) {
    if (gap.plaza) {
      tryAt(pickWeighted(rnd, PLAZA_KINDS, () => 1, null), gap.x0 + 40, gap.x1 - 40, 4);
      if (rnd.chance(0.5)) tryAt(rnd.pick(["bench", "bins", "bicycle"] as const), gap.x0 + 20, gap.x1 - 20);
    } else if (rnd.chance(0.55)) {
      tryAt(rnd.pick(SMALL_KINDS), gap.x0 + 20, gap.x1 - 20);
    }
  }
  for (const b of front) {
    if (NO_FRONT_ITEMS.includes(b.kind)) continue;
    const kind: StreetKind | null = b.kind === "convenience" ? (rnd.chance(0.85) ? "vending" : null) : rnd.chance(0.45) ? rnd.pick(SMALL_KINDS) : null;
    if (kind) tryAt(kind, b.x + 30, b.x + b.width - 30);
  }
  return list.sort((a, b) => a.x - b.x);
}

/** 前景设施：稀疏地立在行走带前沿，避开身后路灯杆，免得两根杆子叠在一起。 */
function planFore(rnd: Random, width: number, street: readonly StreetPlacement[]): StreetPlacement[] {
  const list: StreetPlacement[] = [];
  const poles = street.filter((s) => s.kind === "streetLamp").map((s) => s.x + s.width / 2);
  let x = rnd.range(300, 900);
  while (x < width - 200) {
    const kind = rnd.pick(FORE_KINDS);
    const spec = STREET_SPECS[kind];
    const w = Math.round(rnd.range(spec.width[0], spec.width[1]));
    if (poles.some((p) => Math.abs(p - (x + w / 2)) < 160)) x += 220;
    if (x + w > width - 100) break;
    const slot = { x: Math.round(x), width: w, ground: G.foreBaseY, seed: rnd.seed() };
    list.push({ ...slot, kind, lamps: spec.lamps(slot, rnd) });
    x += w + rnd.range(1100, 1600);
  }
  return list;
}

export function planNearScene(seed: number, width: number): NearScenePlan {
  const rnd = createRandom(seed);
  const { list: front, gaps } = planFront(rnd, width);
  const back = planBack(rnd, width);
  const cables = planCables(rnd, front);
  const street = planStreet(rnd, width, front, gaps);
  const fore = planFore(rnd, width, street);
  return {
    seed,
    width,
    back,
    front,
    cables,
    street,
    fore,
    lamps: [...front.flatMap((b) => b.lamps), ...street.flatMap((s) => s.lamps)],
  };
}
