// 4 段拼接阿弥陀签的生成与求解。这一层是整套玩法的地基, 故断言全部盯着**结构性质**而非具体数值 ——
// 图是随机的, 但「同 row 不共享端点」「每段入→出是双射」「同种子可复现」这三条永远成立。

import { describe, expect, it } from "vitest";
import {
  generateSegmentBridges,
  generateSegments,
  lanePath,
  laneAfterSegments,
  solveFullMapping,
  solveSegmentMapping,
  traceSegment,
} from "./route";
import type { RouteBoard } from "./types";

const LANES = 5;
const ROWS = 4;
const COUNTS = [2, 2, 3, 3];

function boardWith(seed: number, counts: readonly number[] = COUNTS): RouteBoard {
  const rng = { rngState: seed >>> 0 };
  return {
    round: 1,
    laneCount: LANES,
    rowsPerSegment: ROWS,
    segments: generateSegments(rng, LANES, ROWS, counts),
    nodes: [],
    revealDurationMs: 3000,
    blockedLanes: [],
  };
}

describe("生成", () => {
  it("桥接只连相邻通道, 且落在合法行内", () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const seg of boardWith(seed).segments) {
        for (const b of seg.bridges) {
          expect(b.row).toBeGreaterThanOrEqual(0);
          expect(b.row).toBeLessThan(ROWS);
          expect(b.leftLane).toBeGreaterThanOrEqual(0);
          expect(b.leftLane).toBeLessThan(LANES - 1); // leftLane + 1 必须仍是合法通道
        }
      }
    }
  });

  it("同一 row 内不共享端点(两根桥接的 leftLane 至少差 2)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const seg of boardWith(seed).segments) {
        const byRow = new Map<number, number[]>();
        for (const b of seg.bridges) {
          const used = byRow.get(b.row) ?? [];
          for (const l of used) expect(Math.abs(l - b.leftLane)).toBeGreaterThanOrEqual(2);
          used.push(b.leftLane);
          byRow.set(b.row, used);
        }
      }
    }
  });

  it("固定 4 段, 段号连续, 且没有完全空白段(设计文档 §9.3)", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const segs = boardWith(seed).segments;
      expect(segs).toHaveLength(4);
      segs.forEach((seg, i) => {
        expect(seg.index).toBe(i);
        expect(seg.bridges.length).toBeGreaterThan(0);
      });
    }
  });

  it("每段桥接数不超过请求条数, 且沿推进方向递增(第 1 段 ≤ 第 4 段)", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const segs = boardWith(seed).segments;
      segs.forEach((seg, i) => expect(seg.bridges.length).toBeLessThanOrEqual(COUNTS[i]));
      expect(segs[3].bridges.length).toBeGreaterThanOrEqual(segs[0].bridges.length);
    }
  });

  it("同种子两次生成完全一致 —— 可复现是设计文档 §9.3 的硬要求", () => {
    expect(boardWith(1234).segments).toEqual(boardWith(1234).segments);
  });

  it("rng 容器被推进 —— 连续两次调用拿到的是不同的段", () => {
    const rng = { rngState: 99 };
    const a = generateSegmentBridges(rng, LANES, ROWS, 3);
    const b = generateSegmentBridges(rng, LANES, ROWS, 3);
    expect(a).not.toEqual(b);
  });
});

describe("求解", () => {
  it("每个推进段内「入通道 → 出通道」都是双射", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const board = boardWith(seed);
      for (let i = 0; i < board.segments.length; i++) {
        expect([...solveSegmentMapping(board, i)].sort()).toEqual([0, 1, 2, 3, 4]);
      }
    }
  });

  it("整张图的入口 → 第 4 段落点同样是双射(双射的复合仍是双射)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const board = boardWith(seed);
      const ends = solveFullMapping(board).map((p) => p[p.length - 1]);
      expect([...ends].sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("段内走线每一步都只跨一条通道, 且不越界", () => {
    const board = boardWith(42);
    for (const seg of board.segments) {
      for (let lane = 0; lane < LANES; lane++) {
        const { steps } = traceSegment(seg, lane, ROWS);
        expect(steps[0]).toEqual({ row: -1, lane });
        expect(steps[steps.length - 1].row).toBe(ROWS);
        for (const st of steps) {
          expect(st.lane).toBeGreaterThanOrEqual(0);
          expect(st.lane).toBeLessThan(LANES);
          if (st.movedFrom != null) expect(Math.abs(st.lane - st.movedFrom)).toBe(1);
        }
      }
    }
  });

  it("每次跨接都能在该段的桥接表里找到对应的那一根", () => {
    const board = boardWith(5);
    const seg = board.segments[2];
    const { steps } = traceSegment(seg, 0, ROWS);
    for (const m of steps.filter((s) => s.movedFrom != null)) {
      const left = Math.min(m.lane, m.movedFrom!);
      expect(seg.bridges.some((b) => b.row === m.row && b.leftLane === left)).toBe(true);
    }
  });

  it("lanePath / laneAfterSegments 与逐段求解一致", () => {
    const board = boardWith(17);
    for (let lane = 0; lane < LANES; lane++) {
      const path = lanePath(board, lane);
      expect(path).toHaveLength(4);
      for (let n = 1; n <= 4; n++) expect(laneAfterSegments(board, lane, n)).toBe(path[n - 1]);
    }
  });

  it("没有桥接时原路直行", () => {
    const board: RouteBoard = {
      round: 1,
      laneCount: LANES,
      rowsPerSegment: ROWS,
      segments: [0, 1, 2, 3].map((index) => ({ index, bridges: [] })),
      nodes: [],
      revealDurationMs: 3000,
      blockedLanes: [],
    };
    expect(solveFullMapping(board).map((p) => p[3])).toEqual([0, 1, 2, 3, 4]);
  });
});
