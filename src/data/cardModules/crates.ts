// 模组箱的开箱池 —— 探索(会话种子 rng)与据点仓库(Math.random)共用同一份真相。
// 箱子的阶读 ItemDef.use.tier; 目前只有 1 阶, 2/3 阶清单落地后各自往下面的表里挂一行。

import { GENERIC_T1_MODULE_IDS } from "./genericT1";

const CRATE_POOLS: Record<number, readonly string[]> = {
  1: GENERIC_T1_MODULE_IDS,
};

export function moduleCratePool(tier: number): readonly string[] {
  return CRATE_POOLS[tier] ?? [];
}

/** 按调用方给的随机下标函数抽一件; 池子为空返回 null。 */
export function pickModuleFromCrate(tier: number, pickIndex: (length: number) => number): string | null {
  const pool = moduleCratePool(tier);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.max(0, pickIndex(pool.length)))];
}
