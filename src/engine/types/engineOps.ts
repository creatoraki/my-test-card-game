import type { FxRecorder } from "./anim";
import type { DiscardReason } from "./base";
import type { BattleState } from "./battleState";
import type { PassiveEvent, RelicEvent } from "./cards";
import type { ProphecyEvent } from "./prophecy";
import type { StatBlock } from "./stats";
import type { DamageResult } from "./statuses";

// ---------------------------------------------------------------------------
// 引擎原语(传给状态钩子, 打破模块循环依赖)
// ---------------------------------------------------------------------------
export interface DamageOpts {
  flags?: string[];
  isAttack?: boolean; // 攻击: 吃力量/虚弱, 需要命中判定, 可暴击
  fixed?: boolean; // 固定伤害: 跳过防御减伤与格挡
  single?: boolean; // 单体攻击: 可触发护航分担
  guarded?: boolean; // 本次伤害是否已经被护航分担
  mustHit?: boolean; // 必中: 跳过命中判定
  unblockable?: boolean; // 不被护盾吸收
  pure?: boolean; // 跳过施放者与目标的伤害状态修正
  noLimitLoss?: boolean; // 持续伤害(DOT)等: 只扣当前 HP, 不压低体力极限
  hitBonus?: number; // 本次效果的命中修正(百分点)
  onDealt?: (hpLost: number) => void; // 落到 HP 后回调实际掉血(未命中/濒死为 0)
  onCrit?: () => void; // 暴击确认后立即回调
}

export interface EngineOps {
  getStat(state: BattleState, targetId: string, stat: keyof StatBlock): number;
  dealDamage(
    state: BattleState,
    sourceId: string | undefined,
    targetId: string,
    amount: number,
    opts?: DamageOpts,
  ): DamageResult;
  // sourceId 为 undefined 时按"无施法者"处理: 不吃治愈力/治愈强度/护盾强度(如再生、场景效果)。
  heal(
    state: BattleState,
    sourceId: string | undefined,
    targetId: string,
    amount: number,
    opts?: { scaled?: boolean; single?: boolean; splash?: boolean },
  ): number;
  gainShield(
    state: BattleState,
    sourceId: string | undefined,
    targetId: string,
    amount: number,
  ): void;
  applyStatus(
    state: BattleState,
    targetId: string,
    statusId: string,
    stacks: number,
    duration?: number,
    data?: Record<string, number>,
    sourceId?: string,
  ): void;
  applyStatMod(
    state: BattleState,
    targetId: string,
    stat: keyof StatBlock,
    amount: number,
    pct?: boolean,
  ): void;
  loseHp(state: BattleState, targetId: string, amount: number): void;
  addCardToHand(state: BattleState, cardId: string, ownerCharId?: string): void;
  discard(state: BattleState, uid: string, reason: DiscardReason, rec?: FxRecorder): void;
  flushAutoPlays(state: BattleState): void;
  draw(state: BattleState, n: number): void;
  firePassive(state: BattleState, event: PassiveEvent, rec?: FxRecorder): void;
  fireRelic(state: BattleState, event: RelicEvent, rec?: FxRecorder): void;
  // 预言事件入口, 由 engine/prophecy/prophecy.ts 在加载时注入。
  prophecyEvent(state: BattleState, event: ProphecyEvent): void;
  log(state: BattleState, text: string): void;
}
