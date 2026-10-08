import type { BattleRelic, BattleState, Card, CardType, DamageCtx, DamageModifierSink, DiscardReason } from "../types";
import { BOND_BEHAVIORS, RELIC_BEHAVIORS } from "../core/hookRegistry";

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
  modifyCritChance?: (ctx: RelicBehaviorContext, info: CritChanceInfo) => void; // 掷暴击前: 只往 info.bonus 里加减百分点
  beforeHpLoss?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void; // 扣血前(护盾已吸收): 可改 dmg.amount
  onCardExhausted?: (ctx: RelicBehaviorContext, cardUid: string) => void; // 任意卡牌进入消耗堆
  // 以下时点的说明见 HookArgs。
  onTickAdvanced?: (ctx: RelicBehaviorContext) => void;
  onCritRolled?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
  afterDamageDealt?: (ctx: RelicBehaviorContext, dmg: DamageCtx) => void;
  onAttackDodged?: (ctx: RelicBehaviorContext, dmg: DamageCtx, amountBefore: number) => void;
  onShieldBroken?: (ctx: RelicBehaviorContext, dmg: DamageCtx, shieldBefore: number) => void;
  afterStatusApplied?: (ctx: RelicBehaviorContext, info: StatusAppliedInfo) => void;
  afterEnemyDeath?: (ctx: RelicBehaviorContext, targetId: string) => void;
  onCardPlayRecorded?: (ctx: RelicBehaviorContext, played: PlayedCardInfo) => void;
  onCardDiscarded?: (ctx: RelicBehaviorContext, cardUid: string, reason: DiscardReason) => void;
}

export interface CritChanceInfo {
  sourceId: string;
  targetId: string;
  bonus: number; // 百分点
  force?: boolean; // 必定暴击(突破暴击率上限)
}

export interface HealResultInfo {
  targetId: string;
  sourceId?: string; // 缺省 = 无施法者(再生、场景效果等)
  hpBefore: number;
  overflow: number; // 被体力极限截掉、没能落到生命上的治疗量
}

export interface StatusApplyInfo {
  targetId: string;
  statusId: string;
  stacks: number;
  sourceId?: string;
  cancelled?: boolean; // 置 true = 本次施加整体作废
}

// 状态施加完成之后(合并、限层已结束)。只在层数为正时派发。
export interface StatusAppliedInfo {
  targetId: string;
  statusId: string;
  stacks: number;
  duration?: number;
  data?: Record<string, number>;
  sourceId?: string;
}

// 一张牌的出牌记录(与 BattleState.playedThisRound 同口径, 已计入视为速攻等改写)。
export interface PlayedCardInfo {
  uid: string;
  cost: number;
  cardType: CardType;
  ownerCharId: string;
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
  modifyCritChance: [CritChanceInfo];
  beforeHpLoss: [DamageCtx];
  onCardExhausted: [string];
  // ---- 以下时点目前只有羁绊使用(遗物也可直接实现同名钩子) ----
  onTickAdvanced: []; // 每推进 1 个时刻(到点敌人行动之前)
  onCritRolled: [DamageCtx]; // 暴击确认后、防御减伤之前: 可往 dmg.flags 里写规则改写
  afterDamageDealt: [DamageCtx]; // 一次伤害完整结算之后(含击杀判定)
  onAttackDodged: [DamageCtx, number]; // 攻击落空(闪避): 第二个参数为落空前的伤害
  onShieldBroken: [DamageCtx, number]; // 护盾被伤害打空: 第二个参数为打空前的护盾量
  afterStatusApplied: [StatusAppliedInfo];
  afterEnemyDeath: [string]; // 敌人已经完成死亡(alive = false)之后
  onCardPlayRecorded: [PlayedCardInfo]; // 出牌记录写入 playedThisRound 之后
  onCardDiscarded: [string, DiscardReason]; // 计数类弃牌(主动 / 效果 / 费用 / 羁绊)之后
};

export type RelicHook = keyof HookArgs;
export type RelicHookArgs = HookArgs;
let depth = 0;

/**
 * 行为型遗物与羁绊的统一派发入口。只遍历战斗状态里的遗物实例与已激活羁绊，不读取仓库收藏。
 * 羁绊在引擎眼里就是「按档位生效的隐形遗物」: 同一套时点、同一个递归深度上限。
 */
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
    for (const bond of state.bond?.list ?? []) {
      if (state.phase !== "player") break;
      const callback = BOND_BEHAVIORS[bond.id]?.[hook] as
        | ((ctx: { state: BattleState; tier: number }, ...hookArgs: HookArgs[K]) => void)
        | undefined;
      if (callback) callback({ state, tier: bond.tier }, ...args);
    }
  } finally {
    depth -= 1;
  }
}
