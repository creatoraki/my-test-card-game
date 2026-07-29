// ============================================================================
// 阿弥陀签(失真路由图)的生成与求解 —— 纯函数, 无副作用, 无 React。
//
// 图形约定(见 探索模式设计.md §2.1):
//   竖线 lane: 0..laneCount-1, 顶端是入口 A-E, 底端是终点 1-5。
//   横线 crossbar: { row, leftLane } 连接 leftLane 与 leftLane+1 两条相邻竖线。
//   同一 row 内两条横线不得共享端点 ⇒ 两者的 leftLane 至少相差 2。
//
// 这套结构的关键性质: **入口到终点必然是双射**。
//   每条横线只是把两条竖线上的信号互换, 一次交换是对换置换, 若干次对换的复合仍是置换。
//   故任何合法图都不可能出现「两个入口撞到同一个终点」或「某个终点无人抵达」——
//   generateCrossbars 不需要为此做任何检查, solveMapping 的双射性由数学保证,
//   测试里仍留一条断言当回归护栏。
// ============================================================================

import { shuffle } from "../engine/rng";
import type { RouteBoard, RouteCrossbar } from "./types";

// 走线的一个关键节点。刻意**不是**逐行快照 —— 只记录起点、每一次横移、终点,
// UI 在相邻两个节点之间做线性插值即可, 数据量小且动画时序好排。
export interface RouteStep {
  row: number; // -1 = 入口, rowCount = 终点, 其余 = 发生横移的那一行
  lane: number; // 这一步结束后所在的竖线
  movedFrom?: number; // 有值 = 这一步是一次横移, 值为横移前的竖线
}

// 生成一张合法阿弥陀签。
// 做法: 把所有候选格 (row, leftLane) 洗匀后贪心取用, 只在「同 row 已有横线的 leftLane 相差 < 2」
// 时跳过。贪心而非回溯 —— 候选空间(rowCount × (laneCount-1))远大于 barCount, 取不满的概率极低,
// 真取不满时少几条横线也仍是一张合法图, 不值得为此引入回溯。
//
// ⚠ 必须走传入的 rng 容器(带 rngState 的对象), 不能用 Math.random ——
// 同一存档/同一测试种子要能复现同一张图(设计文档 §9.3)。
export function generateCrossbars(
  rng: { rngState: number },
  laneCount: number,
  rowCount: number,
  barCount: number,
): RouteCrossbar[] {
  const candidates: RouteCrossbar[] = [];
  for (let row = 0; row < rowCount; row++) {
    for (let leftLane = 0; leftLane < laneCount - 1; leftLane++) {
      candidates.push({ row, leftLane });
    }
  }

  const picked: RouteCrossbar[] = [];
  const byRow = new Map<number, number[]>();
  for (const c of shuffle(rng, candidates)) {
    if (picked.length >= barCount) break;
    const used = byRow.get(c.row) ?? [];
    if (used.some((l) => Math.abs(l - c.leftLane) < 2)) continue; // 共享端点 / 重叠
    used.push(c.leftLane);
    byRow.set(c.row, used);
    picked.push(c);
  }

  // 按 row 升序 —— 走线求解与 SVG 绘制都按行自上而下扫, 排好序省得两处各排一次
  picked.sort((a, b) => a.row - b.row || a.leftLane - b.leftLane);
  return picked;
}

// 从 entryLane 出发走完整条线路。返回的节点序列供走线动画逐段播放。
export function traceRoute(board: RouteBoard, entryLane: number): RouteStep[] {
  const steps: RouteStep[] = [{ row: -1, lane: entryLane }];
  let lane = entryLane;

  for (let row = 0; row < board.rowCount; row++) {
    // 一行内最多命中一条: 本行的横线互不共享端点, 故 lane 不可能同时是某条的左端与另一条的右端
    const toRight = board.crossbars.find((c) => c.row === row && c.leftLane === lane);
    const toLeft = board.crossbars.find((c) => c.row === row && c.leftLane === lane - 1);
    if (!toRight && !toLeft) continue;
    const from = lane;
    lane = toRight ? lane + 1 : lane - 1;
    steps.push({ row, lane, movedFrom: from });
  }

  steps.push({ row: board.rowCount, lane });
  return steps;
}

// 单个入口的终点。
export function exitLaneOf(board: RouteBoard, entryLane: number): number {
  const steps = traceRoute(board, entryLane);
  return steps[steps.length - 1].lane;
}

// 入口 → 终点的完整映射。index = 入口竖线, 值 = 终点竖线。
// ⚠ 界面在隐藏阶段**不得**读取本函数的结果 —— 它是答案本身(设计文档 §9.3 末段)。
// 目前只有保底校验与单测在用; 将来的「并行探针」指令才是它的正当消费方。
export function solveMapping(board: RouteBoard): number[] {
  return Array.from({ length: board.laneCount }, (_, lane) => exitLaneOf(board, lane));
}
