// 岔路生长与评分 —— 主干摆完后, 剩余房间从「走廊中段」(恰有 2 扇门的房间)分出支路, 让主路上出现真正的岔口;
// 布局成形后按「主路外房间占比 + 主路岔口数」评分, 供 buildLayout 挑选达标的骨架。

import { rngPickWeighted } from "@/engine/core/rng";
import { EXPLORE_RULES } from "../core/exploreRules";
import { DIR_STEP, isVerticalDir, PORTAL_DIRS, type PortalDir } from "../dungeon/types";
import { canSprout, cellKey, growRun, isFull, neighborOf, randomH, randRange, sprout, type HorizontalDir } from "./grid";
import type { LayoutRng, SkelCell, Skeleton } from "./types";

const isFork = (cell: SkelCell): boolean => cell.links.size >= 3;

/** 已经挨着岔口的房间降权, 让岔口沿主干散开而不是扎堆。 */
function forkSpreadWeight(sk: Skeleton, from: SkelCell): number {
  const crowded = [...from.links].some((dir) => {
    const next = neighborOf(sk, from, dir);
    return !!next && isFork(next);
  });
  return crowded ? 1 : 3;
}

/** 从 from 朝 dir 长出一条长度在 branchLen 区间内的支路; 纵向分出时随后朝随机一侧横走。 */
function growBranch(sk: Skeleton, rng: LayoutRng, from: SkelCell, dir: PortalDir): void {
  const [lo, hi] = EXPLORE_RULES.dungeon.layout.branchLen;
  const head = sprout(sk, from, dir);
  if (!head) return;
  const runDir: HorizontalDir = isVerticalDir(dir) ? randomH(rng) : (dir as HorizontalDir);
  growRun(sk, head, runDir, randRange(rng, lo, hi) - 1);
}

/**
 * 支路生长: 只从恰有 2 扇门的走廊房间分出(死胡同末端分出只会把直线拉长), 直到房间够数。
 * 没有可分的走廊房间时停下, 余量交给 grid.fillRemaining 兜底。
 */
export function growBranches(sk: Skeleton, rng: LayoutRng): void {
  for (let guard = 0; guard < 80 && !isFull(sk); guard++) {
    const options: { from: SkelCell; dir: PortalDir; weight: number }[] = [];
    for (const from of sk.cells.values()) {
      if (from.links.size !== 2) continue;
      const weight = forkSpreadWeight(sk, from);
      for (const dir of PORTAL_DIRS) {
        if (canSprout(sk, from, dir)) options.push({ from, dir, weight });
      }
    }
    if (!options.length) return;
    const pick = rngPickWeighted(rng, options, (entry) => entry.weight);
    growBranch(sk, rng, pick.from, pick.dir);
  }
}

/** 起点到 BOSS 的一条最短路(含两端)。 */
function mainPath(cells: SkelCell[], start: SkelCell, boss: SkelCell): Set<SkelCell> {
  const byKey = new Map(cells.map((cell) => [cellKey(cell.x, cell.y), cell]));
  const parent = new Map<SkelCell, SkelCell | null>([[start, null]]);
  const queue = [start];
  while (queue.length && !parent.has(boss)) {
    const cell = queue.shift() as SkelCell;
    for (const dir of cell.links) {
      const { dx, dy } = DIR_STEP[dir];
      const next = byKey.get(cellKey(cell.x + dx, cell.y + dy));
      if (!next || parent.has(next)) continue;
      parent.set(next, cell);
      queue.push(next);
    }
  }
  const path = new Set<SkelCell>();
  for (let cur: SkelCell | null | undefined = boss; cur; cur = parent.get(cur)) path.add(cur);
  return path;
}

export interface BranchScore {
  /** 主路以外的房间占比。 */
  offShare: number;
  /** 主路上通往主路外房间的门数。 */
  forks: number;
  /** 是否达到岔路因子(×0.8 容差)与最少岔口数。 */
  ok: boolean;
  /** 不达标时用来挑「最好的一次」。 */
  value: number;
}

export function scoreBranches(cells: SkelCell[], start: SkelCell, boss: SkelCell): BranchScore {
  const { branchShare, minForks } = EXPLORE_RULES.dungeon.layout;
  const byKey = new Map(cells.map((cell) => [cellKey(cell.x, cell.y), cell]));
  const path = mainPath(cells, start, boss);
  let forks = 0;
  for (const cell of path) {
    for (const dir of cell.links) {
      const { dx, dy } = DIR_STEP[dir];
      const next = byKey.get(cellKey(cell.x + dx, cell.y + dy));
      if (next && !path.has(next)) forks += 1;
    }
  }
  const offShare = 1 - path.size / cells.length;
  const ok = offShare >= branchShare * 0.8 && forks >= minForks;
  // 两项都按目标归一化后封顶, 避免一项超标掩盖另一项不足。
  const value = Math.min(1, offShare / branchShare) + Math.min(1, forks / minForks);
  return { offShare, forks, ok, value };
}
