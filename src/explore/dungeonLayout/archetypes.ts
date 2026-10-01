// ============================================================================
// 骨架原型 —— 每日从这里抽一种, 摆出房间图的大轮廓; 剩下的房间交给 grid.fillRemaining 随机补齐。
//
// · 主干长廊: 一条占一半左右房间的长走廊, 零星分出上下支线;
// · 蛇形回廊: 走廊到头折返到下一行, 一层层盘下去(或盘上去);
// · 回环街区: 两行走廊首尾相连成环, 环外再挂几条尾巴;
// · 鱼骨枢纽: 一段短主干, 每间都朝上或朝下伸出一根肋骨;
// · 斜坡阶梯: 每段走廊走到头就上/下一层, 整体斜向延伸;
// · 错落街区: 不设主干, 从随机房间不断分出短走廊。
// ============================================================================

import { rngFloat, rngPick } from "@/engine/core/rng";
import { OPPOSITE_DIR, type PortalDir } from "../dungeon/types";
import {
  addCell, branch, canSprout, connect, growRun, hasVertical, isFull, randomH, randomV, randRange,
  type HorizontalDir,
} from "./grid";
import type { LayoutRng, SkelCell, Skeleton } from "./types";

export interface Archetype {
  id: string;
  name: string;
  weight: number;
  grow: (sk: Skeleton, rng: LayoutRng) => void;
}

const flipH = (dir: HorizontalDir): HorizontalDir => (dir === "left" ? "right" : "left");

/** 从候选「房间 + 方向」里反复抽一处长支路, 直到房间够数或候选耗尽。 */
function growTails(
  sk: Skeleton,
  rng: LayoutRng,
  candidates: () => { from: SkelCell; dir: PortalDir }[],
  runMax: number,
): void {
  for (let guard = 0; guard < 60 && !isFull(sk); guard++) {
    const options = candidates().filter((entry) => canSprout(sk, entry.from, entry.dir));
    if (!options.length) return;
    const pick = rngPick(rng, options);
    branch(sk, rng, pick.from, pick.dir, runMax);
  }
}

function spine(sk: Skeleton, rng: LayoutRng): void {
  const root = addCell(sk, 0, 0);
  const mainLen = Math.max(3, Math.round(sk.target * (0.4 + rngFloat(rng) * 0.25)));
  const trunk = [root, ...growRun(sk, root, "right", Math.min(mainLen, sk.maxCols) - 1)];
  growTails(sk, rng, () => trunk
    .filter((cell) => !hasVertical(cell))
    .flatMap((from) => [{ from, dir: "up" as const }, { from, dir: "down" as const }]), 2);
}

function serpentine(sk: Skeleton, rng: LayoutRng): void {
  let cur = addCell(sk, 0, 0);
  let hdir: HorizontalDir = randomH(rng);
  const vdir = randomV(rng);
  while (!isFull(sk)) {
    const row = [cur, ...growRun(sk, cur, hdir, randRange(rng, 2, 4))];
    // 多半从行尾折返; 偶尔提前一间折返, 让上下两行错开。
    const turnAt = row.length > 2 && rngFloat(rng) < 0.3 ? row[row.length - 2] : row[row.length - 1];
    const next = branch(sk, rng, turnAt, vdir, 0)[0];
    if (!next) return;
    cur = next;
    hdir = flipH(hdir);
  }
}

function ring(sk: Skeleton, rng: LayoutRng): void {
  const len = Math.min(sk.maxCols, Math.floor(sk.target / 2), randRange(rng, 3, 4));
  if (len < 2) return spine(sk, rng);
  const topLeft = addCell(sk, 0, 0);
  const top = [topLeft, ...growRun(sk, topLeft, "right", len - 1)];
  const bottomLeft = branch(sk, rng, topLeft, "down", 0)[0];
  if (!bottomLeft) return;
  const bottom = [bottomLeft, ...growRun(sk, bottomLeft, "right", len - 1)];
  const topRight = top[top.length - 1];
  const bottomRight = bottom[bottom.length - 1];
  if (bottom.length === top.length && !hasVertical(topRight) && !hasVertical(bottomRight)) {
    connect(topRight, bottomRight, "down");
  }
  // 尾巴: 环的四角向外延伸, 或上下两行的中段房间朝环外伸出。
  growTails(sk, rng, () => [
    ...[topLeft, bottomLeft].map((from) => ({ from, dir: "left" as const })),
    ...[topRight, bottomRight].map((from) => ({ from, dir: "right" as const })),
    ...top.slice(1, -1).map((from) => ({ from, dir: "up" as const })),
    ...bottom.slice(1, -1).map((from) => ({ from, dir: "down" as const })),
  ], 2);
}

function fishbone(sk: Skeleton, rng: LayoutRng): void {
  const root = addCell(sk, 0, 0);
  const trunk = [root, ...growRun(sk, root, "right", randRange(rng, 2, 3))];
  let vdir = randomV(rng);
  for (const from of trunk) {
    if (isFull(sk)) return;
    branch(sk, rng, from, vdir, 2);
    vdir = OPPOSITE_DIR[vdir] as typeof vdir;
  }
  // 肋骨末端再分叉一次, 避免整张图只有一层。
  growTails(sk, rng, () => [...sk.cells.values()]
    .filter((cell) => !trunk.includes(cell) && !hasVertical(cell))
    .flatMap((from) => [{ from, dir: "up" as const }, { from, dir: "down" as const }]), 1);
}

function staircase(sk: Skeleton, rng: LayoutRng): void {
  let cur = addCell(sk, 0, 0);
  const hdir = randomH(rng);
  const vdir = randomV(rng);
  while (!isFull(sk)) {
    const row = [cur, ...growRun(sk, cur, hdir, randRange(rng, 1, 3))];
    const next = branch(sk, rng, row[row.length - 1], vdir, 0)[0];
    if (!next) return;
    cur = next;
  }
}

function scattered(sk: Skeleton, rng: LayoutRng): void {
  addCell(sk, 0, 0);
  growTails(sk, rng, () => [...sk.cells.values()].flatMap((from) => (
    (["left", "right", "up", "down"] as const).map((dir) => ({ from, dir }))
  )), 3);
}

export const ARCHETYPES: readonly Archetype[] = [
  { id: "spine", name: "主干长廊", weight: 1, grow: spine },
  { id: "serpentine", name: "蛇形回廊", weight: 1, grow: serpentine },
  { id: "ring", name: "回环街区", weight: 1, grow: ring },
  { id: "fishbone", name: "鱼骨枢纽", weight: 1, grow: fishbone },
  { id: "staircase", name: "斜坡阶梯", weight: 1, grow: staircase },
  { id: "scattered", name: "错落街区", weight: 1, grow: scattered },
];
