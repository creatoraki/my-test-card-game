import type { Vec2 } from "../types";
import { isFree, lineFree, type RoomNav } from "./roomNav";

const CELL = 0.25;
const MARGIN = 1.4;

export interface NavGrid {
  ox: number;
  oz: number;
  cols: number;
  rows: number;
  free: Uint8Array;
}

export function buildNavGrid(nav: RoomNav): NavGrid {
  const ox = -MARGIN;
  const oz = -MARGIN;
  const cols = Math.ceil((nav.room.width + MARGIN * 2) / CELL);
  const rows = Math.ceil((nav.room.depth + MARGIN * 2) / CELL);
  const free = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      free[r * cols + c] = isFree(nav, ox + (c + 0.5) * CELL, oz + (r + 0.5) * CELL) ? 1 : 0;
    }
  }
  return { ox, oz, cols, rows, free };
}

const cellOf = (grid: NavGrid, p: Vec2) => ({
  c: Math.floor((p.x - grid.ox) / CELL),
  r: Math.floor((p.z - grid.oz) / CELL),
});
const centerOf = (grid: NavGrid, index: number): Vec2 => ({
  x: grid.ox + ((index % grid.cols) + 0.5) * CELL,
  z: grid.oz + (Math.floor(index / grid.cols) + 0.5) * CELL,
});

function inside(grid: NavGrid, c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows;
}

/** 目标格被挡时, 由近及远一圈圈找最近的可走格。 */
function nearestFree(grid: NavGrid, c: number, r: number): number {
  for (let ring = 0; ring < 12; ring += 1) {
    let best = -1;
    let bestD = Infinity;
    for (let dr = -ring; dr <= ring; dr += 1) {
      for (let dc = -ring; dc <= ring; dc += 1) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
        const cc = c + dc;
        const rr = r + dr;
        if (!inside(grid, cc, rr) || !grid.free[rr * grid.cols + cc]) continue;
        const d = dc * dc + dr * dr;
        if (d < bestD) { bestD = d; best = rr * grid.cols + cc; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

/** 最小二叉堆, 只存格子下标, 优先级查 f 数组。 */
class OpenHeap {
  private items: number[] = [];
  constructor(private f: Float32Array) {}
  get size() { return this.items.length; }
  push(index: number) {
    const items = this.items;
    items.push(index);
    let i = items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[items[p]] <= this.f[items[i]]) break;
      [items[p], items[i]] = [items[i], items[p]];
      i = p;
    }
  }
  pop(): number {
    const items = this.items;
    const top = items[0];
    const last = items.pop()!;
    if (items.length) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && this.f[items[l]] < this.f[items[m]]) m = l;
        if (r < items.length && this.f[items[r]] < this.f[items[m]]) m = r;
        if (m === i) break;
        [items[m], items[i]] = [items[i], items[m]];
        i = m;
      }
    }
    return top;
  }
}

const NEIGHBORS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
] as const;

/** 8 方向 A*(斜走不切角), 再用视线检测把折线拉直。返回不含起点的路径点。 */
export function findPath(grid: NavGrid, nav: RoomNav, from: Vec2, to: Vec2): Vec2[] | null {
  const s = cellOf(grid, from);
  const t = cellOf(grid, to);
  if (!inside(grid, t.c, t.r)) return null;
  const start = inside(grid, s.c, s.r) && grid.free[s.r * grid.cols + s.c] ? s.r * grid.cols + s.c : nearestFree(grid, s.c, s.r);
  const goalFree = grid.free[t.r * grid.cols + t.c] === 1;
  const goal = goalFree ? t.r * grid.cols + t.c : nearestFree(grid, t.c, t.r);
  if (start < 0 || goal < 0) return null;

  const n = grid.cols * grid.rows;
  const g = new Float32Array(n).fill(Infinity);
  const f = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const gc = goal % grid.cols;
  const gr = Math.floor(goal / grid.cols);
  const h = (i: number) => {
    const dc = Math.abs((i % grid.cols) - gc);
    const dr = Math.abs(Math.floor(i / grid.cols) - gr);
    return Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr);
  };
  const open = new OpenHeap(f);
  g[start] = 0;
  f[start] = h(start);
  open.push(start);

  while (open.size) {
    const cur = open.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cc = cur % grid.cols;
    const cr = Math.floor(cur / grid.cols);
    for (const [dc, dr, cost] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (!inside(grid, nc, nr)) continue;
      const ni = nr * grid.cols + nc;
      if (!grid.free[ni] || closed[ni]) continue;
      if (dc && dr && (!grid.free[cr * grid.cols + nc] || !grid.free[nr * grid.cols + cc])) continue;
      const ng = g[cur] + cost;
      if (ng >= g[ni]) continue;
      g[ni] = ng;
      f[ni] = ng + h(ni);
      came[ni] = cur;
      open.push(ni);
    }
  }
  if (goal !== start && came[goal] < 0) return null;

  const raw: Vec2[] = [];
  for (let i = goal; i !== start && i >= 0; i = came[i]) raw.push(centerOf(grid, i));
  raw.reverse();
  // 终点可走时用真实点击位置收尾, 否则停在最近的可走格。
  if (goalFree && isFree(nav, to.x, to.z)) raw[raw.length - 1] = { ...to };
  if (!raw.length) return [];
  return smooth(nav, from, raw);
}

function smooth(nav: RoomNav, from: Vec2, points: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  let anchor = from;
  let i = 0;
  while (i < points.length) {
    let j = points.length - 1;
    while (j > i && !lineFree(nav, anchor, points[j])) j -= 1;
    out.push(points[j]);
    anchor = points[j];
    i = j + 1;
  }
  return out;
}
