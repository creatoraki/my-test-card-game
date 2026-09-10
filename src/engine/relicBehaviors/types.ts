import type { BattleRelic, BattleState, Card, DamageCtx } from "../types";
import { RELIC_BEHAVIORS } from "./index";

// 行为型遗物可以触发抽牌等后续钩子，因此与声明式遗物共用同一递归深度上限。
export const MAX_RELIC_DEPTH = 8;

export interface RelicBehaviorContext {
  state: BattleState;
  relic: BattleRelic;
}

export interface RelicBehavior {
  onRoundStart?: (ctx: RelicBehaviorContext) => void;
  onRoundEnd?: (ctx: RelicBehaviorContext) => void;
  beforeCardEffects?: (ctx: RelicBehaviorContext, card: Card, primaryId?: string) => void;
  afterCardPlay?: (ctx: RelicBehaviorContext, card: Card) => void;
  onShuffle?: (ctx: RelicBehaviorContext) => void;
  onCardDrawn?: (ctx: RelicBehaviorContext, cardUid: string) => void;
  onCrit?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
  onAllyHpCrossedHalf?: (ctx: RelicBehaviorContext, targetId: string) => void;
  modifyOutgoingDamage?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
}

type HookArgs = {
  onRoundStart: [];
  onRoundEnd: [];
  beforeCardEffects: [Card, string | undefined];
  afterCardPlay: [Card];
  onShuffle: [];
  onCardDrawn: [string];
  onCrit: [DamageCtx];
  onAllyHpCrossedHalf: [string];
  modifyOutgoingDamage: [DamageCtx];
};

type RelicHook = keyof HookArgs;
let depth = 0;

/** 行为型遗物的统一派发入口。只遍历战斗状态里的遗物实例，不读取仓库收藏。 */
export function runRelicHook<K extends RelicHook>(
  state: BattleState,
  hook: K,
  ...args: HookArgs[K]
): void {
  if (state.phase !== "player") return;
  if (depth >= MAX_RELIC_DEPTH) return;

  depth += 1;
  try {
    for (const relic of state.relics.slice()) {
      const callback = RELIC_BEHAVIORS[relic.id]?.[hook] as
        | ((ctx: RelicBehaviorContext, ...hookArgs: HookArgs[K]) => void)
        | undefined;
      if (callback) callback({ state, relic }, ...args);
    }
  } finally {
    depth -= 1;
  }
}
