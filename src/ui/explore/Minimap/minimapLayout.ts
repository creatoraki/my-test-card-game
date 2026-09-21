// 小地图几何 —— 格子落点与道路折线。纯函数, 不碰 DOM。
//
// 房间图本身是严格网格, 直接画会是一张横平竖直的棋盘。为了接近设计图那种「有机」的走线:
//   · 每个房间按 id 哈希出一个固定的小偏移(离散三档: 负 / 零 / 正, 零档概率最高),
//     同一局内永远不变, 重进房间也不会跳;
//   · 相邻两格若在垂直于走向的轴上没对齐, 连线走直角折线(横-竖-横 或 竖-横-竖)。

import type { MapCell, MapLink } from "./minimapModel";

export interface BoardMetrics {
  /** 房间方块边长。 */
  tile: number;
  /** 相邻两列中心距。 */
  stepX: number;
  /** 相邻两行中心距。 */
  stepY: number;
  /** 方块上方序号占用的高度; 纵向道路接到序号顶上而不是穿过它。 */
  label: number;
}

export interface PlacedCell extends MapCell {
  left: number;
  top: number;
}

export interface PlacedLink extends MapLink {
  d: string;
}

/** 偏移幅度占步长的比例; 纵向更小, 因为纵向还要给序号留空间。 */
const JITTER_X = 0.14;
const JITTER_Y = 0.08;
/** 画布四周留白: 容纳偏移、发光与当前格的外圈括号。 */
const GLOW_PAD = 18;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 离散三档偏移 −1 / 0 / 0 / +1, 让一部分邻格正好对齐走直线。 */
function band(seed: number): number {
  return [-1, 0, 0, 1][seed & 3];
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** 单个房间方块在棋盘画布上的左上角坐标(含哈希偏移)。 */
export function placeRoom(
  room: { id: string; gx: number; gy: number },
  bounds: Bounds,
  m: BoardMetrics,
): { left: number; top: number } {
  const ampX = Math.round(m.stepX * JITTER_X);
  const ampY = Math.round(m.stepY * JITTER_Y);
  const h = hash(room.id);
  return {
    left: ampX + GLOW_PAD + (room.gx - bounds.minX) * m.stepX + band(h) * ampX,
    top: ampY + GLOW_PAD + m.label + (room.gy - bounds.minY) * m.stepY + band(h >>> 3) * ampY,
  };
}

export function layoutBoard(
  cells: MapCell[],
  links: MapLink[],
  bounds: Bounds,
  m: BoardMetrics,
): { width: number; height: number; cells: PlacedCell[]; links: PlacedLink[] } {
  const ampX = Math.round(m.stepX * JITTER_X);
  const ampY = Math.round(m.stepY * JITTER_Y);
  const padX = ampX + GLOW_PAD;
  const padTop = ampY + GLOW_PAD + m.label;
  const padBottom = ampY + GLOW_PAD;

  const placed = cells.map((cell): PlacedCell => ({ ...cell, ...placeRoom(cell.room, bounds, m) }));
  const byId = new Map(placed.map((cell) => [cell.room.id, cell]));

  const routed: PlacedLink[] = [];
  for (const link of links) {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    if (!a || !b) continue;
    routed.push({ ...link, d: routeLink(a, b, link, m) });
  }

  return {
    width: (bounds.maxX - bounds.minX) * m.stepX + m.tile + padX * 2,
    height: (bounds.maxY - bounds.minY) * m.stepY + m.tile + padTop + padBottom,
    cells: placed,
    links: routed,
  };
}

/** 按设计图比例从方块边长推出整套尺寸(列距 ≈ 2.35 倍方块, 行距 ≈ 1.75 倍)。 */
export function metricsForTile(tile: number): BoardMetrics {
  return {
    tile,
    stepX: Math.round(tile * 2.35),
    stepY: Math.round(tile * 1.75),
    label: Math.max(24, Math.round(tile * 0.34)),
  };
}


function routeLink(a: PlacedCell, b: PlacedCell, link: MapLink, m: BoardMetrics): string {
  const half = m.tile / 2;
  // 拐点在两格间隙中点附近, 再按连线哈希轻微错开, 避免同一列的折线全部对齐成一条缝。
  const skew = (hash(`${link.from}|${link.to}`) % 5 - 2) / 10;

  if (link.dir === "left" || link.dir === "right") {
    const [l, r] = a.left < b.left ? [a, b] : [b, a];
    const x1 = l.left + m.tile;
    const x2 = r.left;
    const y1 = l.top + half;
    const y2 = r.top + half;
    if (Math.abs(y1 - y2) < 2) return `M${x1} ${y1}H${x2}`;
    const mid = Math.round(x1 + (x2 - x1) * (0.5 + skew * 0.5));
    return `M${x1} ${y1}H${mid}V${y2}H${x2}`;
  }

  const [t, d] = a.top < b.top ? [a, b] : [b, a];
  const x1 = t.left + half;
  const x2 = d.left + half;
  const y1 = t.top + m.tile;
  const y2 = d.top - m.label;
  if (Math.abs(x1 - x2) < 2) return `M${x1} ${y1}V${y2}`;
  const mid = Math.round(y1 + (y2 - y1) * (0.5 + skew * 0.5));
  return `M${x1} ${y1}V${mid}H${x2}V${y2}`;
}
