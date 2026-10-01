// ============================================================================
// 骨架生成总流程(只用每日布局种子, 同一天同一地图同一难度结果恒定):
//
// ① 按权重抽一种原型摆出大轮廓, 不够的房间随机补齐;
// ② 追加 0 ~ 若干条环路边, 让路线出现取舍;
// ③ 随机镜像, 同一原型能朝四个方向展开;
// ④ 起点按「离最远房间有多远」加权抽取 —— 偏向边缘但不绝对, 不再固定居中;
// ⑤ BOSS 取离起点最远的房间, 同距离优先死胡同。
// ============================================================================

import { rngFloat, rngInt, rngPickWeighted, shuffle } from "@/engine/core/rng";
import { EXPLORE_RULES } from "../core/exploreRules";
import { DIR_STEP } from "../dungeon/types";
import { ARCHETYPES } from "./archetypes";
import { addLoops, cellKey, createSkeleton, fillRemaining, normalizeCells } from "./grid";
import type { LayoutResult, LayoutRng, SkelCell } from "./types";

/** 从 start 出发到每间房的最短步数。 */
export function distancesFrom(cells: SkelCell[], start: SkelCell): Map<SkelCell, number> {
  const byKey = new Map(cells.map((cell) => [cellKey(cell.x, cell.y), cell]));
  const dist = new Map<SkelCell, number>([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const cell = queue.shift() as SkelCell;
    for (const dir of cell.links) {
      const { dx, dy } = DIR_STEP[dir];
      const next = byKey.get(cellKey(cell.x + dx, cell.y + dy));
      if (!next || dist.has(next)) continue;
      dist.set(next, (dist.get(cell) as number) + 1);
      queue.push(next);
    }
  }
  return dist;
}

const farthest = (dist: Map<SkelCell, number>): number => Math.max(...dist.values());

function pickStart(rng: LayoutRng, cells: SkelCell[]): SkelCell {
  const ecc = new Map(cells.map((cell) => [cell, farthest(distancesFrom(cells, cell))]));
  const minEcc = Math.min(...ecc.values());
  return rngPickWeighted(rng, cells, (cell) => ((ecc.get(cell) as number) - minEcc + 1) ** 2);
}

function pickBoss(rng: LayoutRng, cells: SkelCell[], start: SkelCell): SkelCell {
  const dist = distancesFrom(cells, start);
  const others = cells.filter((cell) => cell !== start);
  const maxDist = Math.max(...others.map((cell) => dist.get(cell) ?? 0));
  const deepest = others.filter((cell) => dist.get(cell) === maxDist);
  const deadEnds = deepest.filter((cell) => cell.links.size === 1);
  const pool = deadEnds.length ? deadEnds : deepest;
  return pool[rngInt(rng, pool.length)];
}

export function buildLayout(layoutSeed: number, roomCount: number): LayoutResult {
  const rng: LayoutRng = { rngState: layoutSeed >>> 0 };
  const { maxCols, maxRows } = EXPLORE_RULES.dungeon.layout;
  const sk = createSkeleton(roomCount, maxCols, maxRows);
  const archetype = rngPickWeighted(rng, [...ARCHETYPES], (entry) => entry.weight);
  archetype.grow(sk, rng);
  fillRemaining(sk, rng);
  const maxLoops = Math.floor(roomCount * EXPLORE_RULES.dungeon.loopEdgeRatio);
  addLoops(sk, rng, rngInt(rng, maxLoops + 1));

  const cells = normalizeCells(shuffle(rng, [...sk.cells.values()]), rngFloat(rng) < 0.5, rngFloat(rng) < 0.5);
  const start = pickStart(rng, cells);
  return { cells, start, boss: pickBoss(rng, cells, start), archetype: archetype.name };
}
