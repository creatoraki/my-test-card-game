import type { BattleRelic, BattleState, Card, DamageCtx, DamageModifierSink } from "../types";
import { RELIC_BEHAVIORS } from "../hookRegistry";

// 行为型遗物可以触发抽牌等后续钩子，因此与声明式遗物共用同一递归深度上限。
export const MAX_RELIC_DEPTH = 8;

export interface RelicBehaviorContext {
  state: BattleState;
  relic: BattleRelic;
}

export interface RelicBehavior {
  onRoundStart?: (ctx: RelicBehaviorContext) => void;
  onRoundEnd?: (ctx: RelicBehaviorContext) => void;
  onWait?: (ctx: RelicBehaviorContext) => void;
  onDownedFatal?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
  modifyStatusApply?: (ctx: RelicBehaviorContext, info: StatusApplyInfo) => void;
  beforeCardEffects?: (ctx: RelicBehaviorContext, card: Card, primaryId?: string) => void;
  afterCardPlay?: (ctx: RelicBehaviorContext, card: Card) => void;
  onShuffle?: (ctx: RelicBehaviorContext) => void;
  onCardDrawn?: (ctx: RelicBehaviorContext, cardUid: string) => void;
  onCrit?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
  onAllyHpCrossedHalf?: (ctx: RelicBehaviorContext, targetId: string) => void;
  afterHeal?: (ctx: RelicBehaviorContext, info: HealResultInfo) => void;
  onEnemyKilled?: (ctx: RelicBehaviorContext, targetId: string) => void; // 触发时敌人仍保留死亡前的状态
  onAllyDeath?: (ctx: RelicBehaviorContext, targetId: string) => void;
  // 纯计算, 预览也会调用: 只能往 mods 里登记。一次性加成的消耗放到 afterDamageModified。
  modifyOutgoingDamage?: (ctx: RelicBehaviorContext, dmg: Readonly<DamageCtx>, mods: DamageModifierSink) => void;
  afterDamageModified?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void; // 乘区结算完毕、命中判定前(不论最终是否命中)
}

export interface HealResultInfo {
  targetId: string;
  hpBefore: number;
  overflow: number; // 被体力极限截掉、没能落到生命上的治疗量
}

export interface StatusApplyInfo {
  targetId: string;
  statusId: string;
  stacks: number;
}

type HookArgs = {
  onRoundStart: [];
  onRoundEnd: [];
  onWait: [];
  onDownedFatal: [DamageCtx];
  modifyStatusApply: [StatusApplyInfo];
  beforeCardEffects: [Card, string | undefined];
  afterCardPlay: [Card];
  onShuffle: [];
  onCardDrawn: [string];
  onCrit: [DamageCtx];
  onAllyHpCrossedHalf: [string];
  afterHeal: [HealResultInfo];
  onEnemyKilled: [string];
  onAllyDeath: [string];
  modifyOutgoingDamage: [DamageCtx, DamageModifierSink];
  afterDamageModified: [DamageCtx];
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
