// 小地图几何 —— 格子落点与道路直线。纯函数, 不碰 DOM。
//
// 房间图是严格网格, 且每间房至多左、右、一条纵向共 3 条路(对应场景里左/中/右三个门位):
//   · 格子按网格等距摆放, 不做任何偏移, 同行同列严格对齐;
//   · 道路一律横平竖直, 连接相邻两格的边中点, 整体呈工整的十字格;
//   · 道路按 link.from → link.to 绘制, 流光沿这个方向流动(朝向由 minimapModel 决定)。

import type { PortalDir } from "@/explore/dungeon/types";
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

/** 画布四周留白: 容纳发光与当前格的外圈括号。 */
const GLOW_PAD = 18;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** 单个房间方块在棋盘画布上的左上角坐标。 */
export function placeRoom(
  room: { gx: number; gy: number },
  bounds: Bounds,
  m: BoardMetrics,
): { left: number; top: number } {
  return {
    left: GLOW_PAD + (room.gx - bounds.minX) * m.stepX,
    top: GLOW_PAD + m.label + (room.gy - bounds.minY) * m.stepY,
  };
}

export function layoutBoard(
  cells: MapCell[],
  links: MapLink[],
  bounds: Bounds,
  m: BoardMetrics,
): { width: number; height: number; cells: PlacedCell[]; links: PlacedLink[] } {
  const placed = cells.map((cell): PlacedCell => ({ ...cell, ...placeRoom(cell.room, bounds, m) }));
  const byId = new Map(placed.map((cell) => [cell.room.id, cell]));

  const routed: PlacedLink[] = [];
  for (const link of links) {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    if (!a || !b) continue;
    routed.push({ ...link, d: routeLink(a, b, link.dir, m) });
  }

  return {
    width: (bounds.maxX - bounds.minX) * m.stepX + m.tile + GLOW_PAD * 2,
    height: (bounds.maxY - bounds.minY) * m.stepY + m.tile + m.label + GLOW_PAD * 2,
    cells: placed,
    links: routed,
  };
}

/** 从方块边长推出整套尺寸: 横向间隙 ≈ 1.2 倍方块, 纵向道路(扣掉序号)≈ 0.75 倍方块, 十字两臂长度接近。 */
export function metricsForTile(tile: number): BoardMetrics {
  const label = Math.max(24, Math.round(tile * 0.34));
  return {
    tile,
    stepX: Math.round(tile * 2.2),
    stepY: tile + label + Math.round(tile * 0.75),
    label,
  };
}

/** 从 a 的出口边中点直线连到 b 的入口边中点; 纵向道路在下方格子的序号顶上收口。 */
function routeLink(a: PlacedCell, b: PlacedCell, dir: PortalDir, m: BoardMetrics): string {
  const half = m.tile / 2;
  switch (dir) {
    case "right": return `M${a.left + m.tile} ${a.top + half}H${b.left}`;
    case "left": return `M${a.left} ${a.top + half}H${b.left + m.tile}`;
    case "down": return `M${a.left + half} ${a.top + m.tile}V${b.top - m.label}`;
    case "up": return `M${a.left + half} ${a.top - m.label}V${b.top + m.tile}`;
  }
}
