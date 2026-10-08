// 羁绊行为的类型: 与行为型遗物共用同一套钩子时点(relics/types.ts 的 HookArgs),
// 区别只在上下文 —— 羁绊拿到的是「达到的档位」, 由各条规则自己判断第几档生效。

import type { BattleState } from "../types";
import type { RelicHook, RelicHookArgs } from "../relics/types";

export interface BondCtx {
  state: BattleState;
  tier: number; // 从 1 开始
}

export type BondBehavior = {
  [K in RelicHook]?: (ctx: BondCtx, ...args: RelicHookArgs[K]) => void;
};
