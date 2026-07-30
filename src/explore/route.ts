// ============================================================================
// 区域路由图(4 段拼接的阿弥陀签)的生成与求解 —— 纯函数, 无副作用, 无 React。
//
// 图形约定(见 探索模式设计.md §2.1):
//   通道 lane: 0..laneCount-1, 最左端是入口 A-E, 信号自左向右推进。
//   推进段 segment: 0..3, 每段末端是 5 个节点(每条通道各一个)。
//   桥接 bridge: { row, leftLane } 连接 leftLane 与 leftLane+1 两条相邻通道。
//     row 是该桥接在**本段内**的横向位置(0..rowsPerSegment-1)。
//   同一 row 内两根桥接不得共享端点 ⇒ 两者的 leftLane 至少相差 2。
//
// 这套结构的关键性质: **每个推进段内, 入通道到出通道必然是双射**。
//   每根桥接只是把两条通道上的信号互换, 一次交换是对换置换, 若干次对换的复合仍是置换。
//   故任何合法段都不可能出现「两条通道撞进同一个节点」或「某个节点无人抵达」——
//   生成器不需要为此做任何检查, 双射性由数学保证, 测试里仍留断言当回归护栏。
//
// ★ 双射正是「只给一次入口选择权」的理由(§2.1): 若允许反复选入口, 把 5 个入口各选一遍
//   就必然遍历全部落点, 记忆的价值恒为零。玩家挑的不是一个落点, 而是**一条通道依次撞上的
//   4 个事件所构成的套餐**。
// ============================================================================

import { shuffle } from "../engine/rng";
import type { RouteBoard, RouteBridge, RouteSegment } from "./types";

// 段内走线的一个关键节点。刻意**不是**逐行快照 —— 只记录起点、每一次跨接、段末,
// UI 在相邻两个节点之间做线性插值即可, 数据量小且动画时序好排。
export interface RouteStep {
  row: number; // -1 = 段首, rowsPerSegment = 段末(节点), 其余 = 发生跨接的那一行
  lane: number; // 这一步结束后所在的通道
  movedFrom?: number; // 有值 = 这一步是一次跨接, 值为跨接前的通道
}

// 生成一段合法阿弥陀签的桥接。
// 做法: 把所有候选格 (row, leftLane) 洗匀后贪心取用, 只在「同 row 已有桥接的 leftLane 相差 < 2」
// 时跳过。贪心而非回溯 —— 候选空间(rows × (laneCount-1))远大于 count, 取不满的概率极低,
// 真取不满时少几根桥接也仍是一段合法图, 不值得为此引入回溯。
//
// ⚠ 必须走传入的 rng 容器(带 rngState 的对象), 不能用 Math.random ——
// 同一存档/同一测试种子要能复现同一张图(设计文档 §9.3)。
export function generateSegmentBridges(
  rng: { rngState: number },
  laneCount: number,
  rows: number,
  count: number,
): RouteBridge[] {
  const candidates: RouteBridge[] = [];
  for (let row = 0; row < rows; row++) {
    for (let leftLane = 0; leftLane < laneCount - 1; leftLane++) {
      candidates.push({ row, leftLane });
    }
  }

  const picked: RouteBridge[] = [];
  const byRow = new Map<number, number[]>();
  for (const c of shuffle(rng, candidates)) {
    if (picked.length >= count) break;
    const used = byRow.get(c.row) ?? [];
    if (used.some((l) => Math.abs(l - c.leftLane) < 2)) continue; // 共享端点 / 重叠
    used.push(c.leftLane);
    byRow.set(c.row, used);
    picked.push(c);
  }

  // 按 row 升序 —— 走线求解与绘制都按行从左到右扫, 排好序省得两处各排一次
  picked.sort((a, b) => a.row - b.row || a.leftLane - b.leftLane);
  return picked;
}

// 生成一轮的 4 个推进段。counts[i] = 第 i 段的桥接数(沿推进方向递增, 见 rules.bridgesPerSegment)。
// ⚠ 不允许出现完全空白段(§9.3): 一段一根桥接都没有等于白送一个落点。
export function generateSegments(
  rng: { rngState: number },
  laneCount: number,
  rows: number,
  counts: readonly number[],
): RouteSegment[] {
  return counts.map((count, index) => {
    let bridges = generateSegmentBridges(rng, laneCount, rows, Math.max(1, count));
    // 极小概率取不满且一根都没取到 —— 补一根保证段不空白
    if (!bridges.length) bridges = [{ row: 0, leftLane: 0 }];
    return { index, bridges };
  });
}

// 从 laneIn 出发走完一个推进段。返回的关键点序列供走线动画逐段播放。
export function traceSegment(
  segment: RouteSegment,
  laneIn: number,
  rows: number,
): { steps: RouteStep[]; laneOut: number } {
  const steps: RouteStep[] = [{ row: -1, lane: laneIn }];
  let lane = laneIn;

  for (let row = 0; row < rows; row++) {
    // 一行内最多命中一根: 本行的桥接互不共享端点, 故 lane 不可能同时是某根的左端与另一根的右端
    const toRight = segment.bridges.find((b) => b.row === row && b.leftLane === lane);
    const toLeft = segment.bridges.find((b) => b.row === row && b.leftLane === lane - 1);
    if (!toRight && !toLeft) continue;
    const from = lane;
    lane = toRight ? lane + 1 : lane - 1;
    steps.push({ row, lane, movedFrom: from });
  }

  steps.push({ row: rows, lane });
  return { steps, laneOut: lane };
}

// 入口通道 → 走完前 upTo 个推进段之后所在的通道(upTo = 1 即第 1 段的落点)。
export function laneAfterSegments(board: RouteBoard, entryLane: number, upTo: number): number {
  let lane = entryLane;
  for (let i = 0; i < upTo && i < board.segments.length; i++) {
    lane = traceSegment(board.segments[i], lane, board.rowsPerSegment).laneOut;
  }
  return lane;
}

// 一条完整通道的落点序列: [第1段落点, 第2段落点, 第3段落点, 第4段落点]。
// ⚠ 界面在桥接隐藏阶段**不得**读取本函数的结果 —— 它是答案本身(设计文档 §9.3 末段)。
//   routeDisclosure 阶段是唯一允许成批泄露它的时机。
export function lanePath(board: RouteBoard, entryLane: number): number[] {
  const out: number[] = [];
  let lane = entryLane;
  for (const seg of board.segments) {
    lane = traceSegment(seg, lane, board.rowsPerSegment).laneOut;
    out.push(lane);
  }
  return out;
}

// 单个推进段的「入通道 → 出通道」映射。index = 入通道, 值 = 出通道。必为双射。
export function solveSegmentMapping(board: RouteBoard, segIndex: number): number[] {
  const seg = board.segments[segIndex];
  return Array.from(
    { length: board.laneCount },
    (_, lane) => traceSegment(seg, lane, board.rowsPerSegment).laneOut,
  );
}

// 全部入口的完整落点序列。仅供单测、routeDisclosure 与将来的「并行探针」指令使用。
export function solveFullMapping(board: RouteBoard): number[][] {
  return Array.from({ length: board.laneCount }, (_, lane) => lanePath(board, lane));
}
