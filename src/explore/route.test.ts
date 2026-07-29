// 阿弥陀签的生成与求解。这一层是整套玩法的地基, 故断言全部盯着**结构性质**而非具体数值 ——
// 图是随机的, 但「同 row 不共享端点」「入口终点是双射」「同种子可复现」这三条永远成立。

import { describe, expect, it } from "vitest";
import { exitLaneOf, generateCrossbars, solveMapping, traceRoute } from "./route";
import type { RouteBoard } from "./types";

const LANES = 5;
const ROWS = 10;

function boardWith(seed: number, bars: number): RouteBoard {
  const rng = { rngState: seed >>> 0 };
  return {
    segment: 1,
    laneCount: LANES,
    rowCount: ROWS,
    crossbars: generateCrossbars(rng, LANES, ROWS, bars),
    events: [],
    revealDurationMs: 1000,
    blockedLanes: [],
  };
}

describe("生成", () => {
  it("横线只连相邻竖线, 且落在合法行内", () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const c of boardWith(seed, 12).crossbars) {
        expect(c.row).toBeGreaterThanOrEqual(0);
        expect(c.row).toBeLessThan(ROWS);
        expect(c.leftLane).toBeGreaterThanOrEqual(0);
        expect(c.leftLane).toBeLessThan(LANES - 1); // leftLane + 1 必须仍是合法竖线
      }
    }
  });

  it("同一 row 内不共享端点(两条横线的 leftLane 至少差 2)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const byRow = new Map<number, number[]>();
      for (const c of boardWith(seed, 12).crossbars) {
        const used = byRow.get(c.row) ?? [];
        for (const l of used) expect(Math.abs(l - c.leftLane)).toBeGreaterThanOrEqual(2);
        used.push(c.leftLane);
        byRow.set(c.row, used);
      }
    }
  });

  it("不超过请求条数, 且按 row 升序排好", () => {
    const bars = boardWith(7, 9).crossbars;
    expect(bars.length).toBeLessThanOrEqual(9);
    for (let i = 1; i < bars.length; i++) {
      expect(bars[i].row).toBeGreaterThanOrEqual(bars[i - 1].row);
    }
  });

  it("同种子两次生成完全一致 —— 可复现是设计文档 §9.3 的硬要求", () => {
    expect(boardWith(1234, 10).crossbars).toEqual(boardWith(1234, 10).crossbars);
  });

  it("rng 容器被推进 —— 连续两次调用拿到的是不同的图", () => {
    const rng = { rngState: 99 };
    const a = generateCrossbars(rng, LANES, ROWS, 10);
    const b = generateCrossbars(rng, LANES, ROWS, 10);
    expect(a).not.toEqual(b);
  });
});

describe("求解", () => {
  it("入口 → 终点是双射: 每个终点恰好被一个入口命中", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const mapping = solveMapping(boardWith(seed, 12));
      expect([...mapping].sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("走线的每一步都只移动一格, 且不越界", () => {
    const board = boardWith(42, 12);
    for (let lane = 0; lane < LANES; lane++) {
      const steps = traceRoute(board, lane);
      expect(steps[0]).toEqual({ row: -1, lane });
      expect(steps[steps.length - 1].row).toBe(ROWS);
      for (const st of steps) {
        expect(st.lane).toBeGreaterThanOrEqual(0);
        expect(st.lane).toBeLessThan(LANES);
        if (st.movedFrom != null) expect(Math.abs(st.lane - st.movedFrom)).toBe(1);
      }
    }
  });

  it("横移的步数 = 该入口路径上真正命中的横线数", () => {
    const board = boardWith(5, 12);
    const steps = traceRoute(board, 0);
    const moves = steps.filter((s) => s.movedFrom != null);
    // 每次横移都必须能在 crossbars 里找到对应的那一条
    for (const m of moves) {
      const left = Math.min(m.lane, m.movedFrom!);
      expect(board.crossbars.some((c) => c.row === m.row && c.leftLane === left)).toBe(true);
    }
  });

  it("exitLaneOf 与 traceRoute 的末端一致", () => {
    const board = boardWith(17, 12);
    for (let lane = 0; lane < LANES; lane++) {
      const steps = traceRoute(board, lane);
      expect(exitLaneOf(board, lane)).toBe(steps[steps.length - 1].lane);
    }
  });

  it("没有横线时原路直下", () => {
    const board = boardWith(3, 0);
    expect(solveMapping(board)).toEqual([0, 1, 2, 3, 4]);
  });
});
