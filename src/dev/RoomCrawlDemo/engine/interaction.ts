import { DEPTH_WEIGHT } from "../data/layout";
import type { PropDef, PropKind } from "../types";

/** 可调查距离(纵深加权后)。 */
const REACH = 150;

/** 各类交互物的调查动画时长与「获得」飘字出现的时刻(秒)。 */
export const SEARCH_TIMING: Record<PropKind, { duration: number; lootAt: number }> = {
  safe: { duration: 2.4, lootAt: 1.35 },
  vending: { duration: 2.2, lootAt: 1.25 },
  remains: { duration: 2.8, lootAt: 1.9 },
  seedVault: { duration: 2.4, lootAt: 1.6 },
  terminal: { duration: 2.2, lootAt: 1.3 },
  incubator: { duration: 2.6, lootAt: 1.9 },
};

export interface SearchRun {
  prop: PropDef;
  t: number;
  lootFired: boolean;
}

/** 选出离玩家最近、还没搜过的交互物。 */
export function pickFocus(props: readonly PropDef[], searched: ReadonlySet<string>, x: number, z: number): PropDef | null {
  let best: PropDef | null = null;
  let bestD = REACH;
  for (const prop of props) {
    if (searched.has(prop.id)) continue;
    const d = Math.hypot(prop.x - x, (prop.z - z) * DEPTH_WEIGHT);
    if (d < bestD) {
      bestD = d;
      best = prop;
    }
  }
  return best;
}

/** 推进调查动画; 返回本帧是否到了发放获得物的时刻, 以及动画是否结束。 */
export function stepSearch(run: SearchRun, dt: number): { loot: boolean; done: boolean } {
  run.t += dt;
  const timing = SEARCH_TIMING[run.prop.kind];
  let loot = false;
  if (!run.lootFired && run.t >= timing.lootAt) {
    run.lootFired = true;
    loot = true;
  }
  return { loot, done: run.t >= timing.duration };
}

/** 动画进度 0~1(交给着色器)。 */
export function searchProgress(run: SearchRun): number {
  return Math.min(1, run.t / SEARCH_TIMING[run.prop.kind].duration);
}
