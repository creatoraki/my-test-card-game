// 骨架网格原语 —— 放房间、打通门、横向走廊、兜底生长、追加环路、镜像。纯函数式小工具, 不依赖房间内容。

import { rngFloat, rngInt, shuffle } from "@/engine/core/rng";
import { EXPLORE_RULES } from "../core/exploreRules";
import { DIR_STEP, isVerticalDir, OPPOSITE_DIR, PORTAL_DIRS, type PortalDir } from "../dungeon/types";
import type { LayoutRng, SkelCell, Skeleton } from "./types";

export type HorizontalDir = "left" | "right";
export type VerticalDir = "up" | "down";

export const cellKey = (x: number, y: number): string => `${x},${y}`;

export function createSkeleton(target: number, maxCols: number, maxRows: number): Skeleton {
  return { cells: new Map(), maxCols, maxRows, target };
}

export const isFull = (sk: Skeleton): boolean => sk.cells.size >= sk.target;

export const hasVertical = (cell: SkelCell): boolean => cell.links.has("up") || cell.links.has("down");

export const randRange = (rng: LayoutRng, lo: number, hi: number): number => lo + rngInt(rng, hi - lo + 1);

export const randomH = (rng: LayoutRng): HorizontalDir => (rngFloat(rng) < 0.5 ? "left" : "right");

export const randomV = (rng: LayoutRng): VerticalDir => (rngFloat(rng) < 0.5 ? "up" : "down");

export function neighborOf(sk: Skeleton, cell: SkelCell, dir: PortalDir): SkelCell | undefined {
  const { dx, dy } = DIR_STEP[dir];
  return sk.cells.get(cellKey(cell.x + dx, cell.y + dy));
}

/** 这扇门还能不能开: 门数未满、该方向未打通、纵向至多一条。 */
export function canOpen(cell: SkelCell, dir: PortalDir): boolean {
  if (cell.links.has(dir) || cell.links.size >= EXPLORE_RULES.dungeon.maxExits) return false;
  return !(isVerticalDir(dir) && hasVertical(cell));
}

function fitsBounds(sk: Skeleton, x: number, y: number): boolean {
  let minX = x, maxX = x, minY = y, maxY = y;
  for (const cell of sk.cells.values()) {
    minX = Math.min(minX, cell.x);
    maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y);
    maxY = Math.max(maxY, cell.y);
  }
  return maxX - minX + 1 <= sk.maxCols && maxY - minY + 1 <= sk.maxRows;
}

export function addCell(sk: Skeleton, x: number, y: number): SkelCell {
  const cell: SkelCell = { x, y, links: new Set() };
  sk.cells.set(cellKey(x, y), cell);
  return cell;
}

export function connect(a: SkelCell, b: SkelCell, dir: PortalDir): void {
  a.links.add(dir);
  b.links.add(OPPOSITE_DIR[dir]);
}

/** 能否从 from 朝 dir 长出一间新房(不实际放置)。 */
export function canSprout(sk: Skeleton, from: SkelCell, dir: PortalDir): boolean {
  if (isFull(sk) || !canOpen(from, dir)) return false;
  const { dx, dy } = DIR_STEP[dir];
  const x = from.x + dx;
  const y = from.y + dy;
  return !sk.cells.has(cellKey(x, y)) && fitsBounds(sk, x, y);
}

/** 从 from 朝 dir 长出一间新房并打通; 目标格已占、超出轮廓、门位已满或房间数已够时返回 null。 */
export function sprout(sk: Skeleton, from: SkelCell, dir: PortalDir): SkelCell | null {
  if (!canSprout(sk, from, dir)) return null;
  const { dx, dy } = DIR_STEP[dir];
  const cell = addCell(sk, from.x + dx, from.y + dy);
  connect(from, cell, dir);
  return cell;
}

/** 横向走廊: 从 from 朝 dir 连续长出至多 len 间, 被挡住就停; 返回新房间(由近及远)。 */
export function growRun(sk: Skeleton, from: SkelCell, dir: HorizontalDir, len: number): SkelCell[] {
  const out: SkelCell[] = [];
  let cur = from;
  for (let i = 0; i < len; i++) {
    const next = sprout(sk, cur, dir);
    if (!next) break;
    out.push(next);
    cur = next;
  }
  return out;
}

/**
 * 支路: 从 from 朝 dir 长出一间, 再顺势延伸一段横向走廊。
 * 纵向分出时走廊朝随机一侧, 横向分出时沿原方向继续。
 */
export function branch(
  sk: Skeleton,
  rng: LayoutRng,
  from: SkelCell,
  dir: PortalDir,
  runMax: number,
): SkelCell[] {
  const head = sprout(sk, from, dir);
  if (!head) return [];
  const runDir: HorizontalDir = isVerticalDir(dir) ? randomH(rng) : (dir as HorizontalDir);
  return [head, ...growRun(sk, head, runDir, randRange(rng, 0, runMax))];
}

/**
 * 兜底生长: 原型摆完后房间数仍不够时, 从任意可开门的房间随机分出支路。
 * 轮廓内实在长不动就放宽轮廓 —— 最右侧房间的右门必然空着(至多左 + 一条纵向), 所以一定能长完。
 */
export function fillRemaining(sk: Skeleton, rng: LayoutRng): void {
  while (!isFull(sk)) {
    const options: { from: SkelCell; dir: PortalDir }[] = [];
    for (const from of sk.cells.values()) {
      for (const dir of PORTAL_DIRS) {
        if (!canSprout(sk, from, dir)) continue;
        // 横向权重翻倍: 让补出来的部分更像走廊而不是散点。
        options.push({ from, dir });
        if (!isVerticalDir(dir)) options.push({ from, dir });
      }
    }
    if (!options.length) {
      sk.maxCols = Number.POSITIVE_INFINITY;
      sk.maxRows = Number.POSITIVE_INFINITY;
      continue;
    }
    const pick = options[rngInt(rng, options.length)];
    branch(sk, rng, pick.from, pick.dir, 1);
  }
}

/** 相邻但未打通的房间里随机接通至多 count 条, 制造回环与近路。 */
export function addLoops(sk: Skeleton, rng: LayoutRng, count: number): void {
  const edges: { a: SkelCell; b: SkelCell; dir: PortalDir }[] = [];
  for (const a of sk.cells.values()) {
    for (const dir of ["right", "down"] as const) {
      const b = neighborOf(sk, a, dir);
      if (b && !a.links.has(dir)) edges.push({ a, b, dir });
    }
  }
  let added = 0;
  for (const edge of shuffle(rng, edges)) {
    if (added >= count) break;
    if (!canOpen(edge.a, edge.dir) || !canOpen(edge.b, OPPOSITE_DIR[edge.dir])) continue;
    connect(edge.a, edge.b, edge.dir);
    added += 1;
  }
}

const FLIP_X: Record<PortalDir, PortalDir> = { up: "up", down: "down", left: "right", right: "left" };
const FLIP_Y: Record<PortalDir, PortalDir> = { up: "down", down: "up", left: "left", right: "right" };

/** 整体镜像并把坐标平移到从 0 起, 同一套原型因此能朝四个方向展开。 */
export function normalizeCells(cells: SkelCell[], flipX: boolean, flipY: boolean): SkelCell[] {
  const mapped = cells.map((cell) => ({
    x: flipX ? -cell.x : cell.x,
    y: flipY ? -cell.y : cell.y,
    links: new Set([...cell.links].map((dir) => {
      const turned = flipX ? FLIP_X[dir] : dir;
      return flipY ? FLIP_Y[turned] : turned;
    })),
  }));
  const minX = Math.min(...mapped.map((cell) => cell.x));
  const minY = Math.min(...mapped.map((cell) => cell.y));
  for (const cell of mapped) {
    cell.x -= minX;
    cell.y -= minY;
  }
  return mapped;
}
