import type { DamageModifierSink } from "../damage/types";
import type { BattleState } from "./battleState";
import type { Card } from "./cards";
import type { EngineOps } from "./engineOps";
import type { StatBlock } from "./stats";

// ---------------------------------------------------------------------------
// 状态效果(buff / debuff) —— 定义含行为钩子; 挂在单位身上的只是 { id, stacks }。
// ---------------------------------------------------------------------------
export type StatusKind = "buff" | "debuff";

export type StackMode = "add" | "max" | "segments";
export type RefreshMode = "max" | "override" | "keep";

export interface StatusSegment {
  stacks: number;
  duration?: number;
  appliedAt: number;
}

export interface StatusInstance {
  id: string;
  stacks: number;
  duration?: number; // 剩余拍数; 缺省 = 不因节拍过期
  data?: Record<string, number>; // 状态的结构化运行时参数
  sourceId?: string; // 施加该状态的单位, 供持续效果读取施法者属性
  appliedAt?: number; // 施加时持有者的节拍号, 非立即计时状态用于跳过施加当拍的处理
  segments?: StatusSegment[]; // stackMode="segments" 专用; stacks/duration 为派生汇总值
}

// 传给状态钩子的上下文。ops 提供引擎原语, 使 statuses.ts 无需 import 具体实现。
export interface StatusCtx {
  state: BattleState;
  ownerId: string;
  inst: StatusInstance;
  stacks: number;
  ops: EngineOps;
}

export interface DamageCtx {
  sourceId?: string;
  targetId: string;
  amount: number; // 在管线中被逐段修改; 乘区修正见 damage/modifiers.ts
  flags: string[];
  isAttack: boolean;
  fixed: boolean; // 固定伤害: 不使用攻击力, 也不吃防御与格挡
  single?: boolean; // 单体攻击: 可触发护航分担
  guarded?: boolean; // 本次伤害是否已经被护航分担
  missed: boolean; // 命中判定失手 —— 后续各段全部跳过
  crit: boolean; // 本次是否暴击
  blockRolled: boolean; // 本次是否触发格挡(伤害减半)
  blocked: number; // 被护盾吸收的量
  hpLost: number;
  downed?: boolean; // 目标处于我方濒死态, 本次伤害触发死亡骰
  fatal?: boolean; // 濒死死亡骰命中
  keepHpLimit?: boolean; // 由 onBeforeHpLoss 设置: 本次扣血不压低体力极限
}

export interface HealCtx {
  sourceId?: string;
  targetId: string;
  amount: number;
  healed: number;
  single: boolean;
  splash: boolean;
}

export type DamageResult = "missed" | "hit" | null;

export interface StatusHooks {
  onApplied?: (c: StatusCtx) => void; // 状态合并、限层并清理后触发
  onTempo?: (c: StatusCtx) => void;
  onTick?: (c: StatusCtx) => void;
  // 乘区修正(纯计算, 预览也会调用): 只能往 mods 里登记, 不能改 dmg, 不能有副作用。
  modifyOutgoingDamage?: (c: StatusCtx, dmg: Readonly<DamageCtx>, mods: DamageModifierSink) => void; // 施放者身上的状态
  modifyIncomingDamage?: (c: StatusCtx, dmg: Readonly<DamageCtx>, mods: DamageModifierSink) => void; // 目标身上的状态
  modifyIncomingHeal?: (c: StatusCtx, heal: Readonly<HealCtx>) => number; // 返回受到治疗倍率
  onBeforeHitRoll?: (c: StatusCtx, dmg: DamageCtx) => void; // 目标身上: 命中掷骰前, 可设 dmg.missed(罗生门)
  onBeforeHpLoss?: (c: StatusCtx, dmg: DamageCtx) => void; // 目标身上: 护盾吸收后、扣血前, 可改 amount 或设 keepHpLimit
  onAfterAttacked?: (c: StatusCtx, dmg: DamageCtx) => void; // 荆棘等
  onGuardAlly?: (c: StatusCtx, dmg: DamageCtx) => void; // 护卫其他友方承受的单体攻击
  onShieldBroken?: (c: StatusCtx, dmg: DamageCtx) => void; // 护盾被伤害击破时
  onHealed?: (c: StatusCtx, heal: HealCtx) => void; // 持有者受到治疗时
  onRoundStart?: (c: StatusCtx) => void; // 我方回合开始(抽牌之前)
  onCardDiscarded?: (c: StatusCtx, cardUid: string) => void;
  onCardPlayed?: (c: StatusCtx, card: Card) => void;
  onAfterAttack?: (c: StatusCtx, dmg: DamageCtx) => void;
  onCultivateStage?: (c: StatusCtx, card: Card, stage: CultivateStage) => void;
  onExpire?: (c: StatusCtx) => void; // 状态在本次节拍后过期时触发一次
  onOverflow?: (c: StatusCtx, overflow: number) => void; // 施加层数超出上限时, 溢出部分的层数
}

// 状态详情里额外展示的数值行(预言进度等)。
export interface StatusDetailStat {
  label: string;
  value: number;
  suffix?: string;
}

export type CultivateStage = "growing" | "mature" | "overripe";

// 异常抗性抵抗哪一项 —— 每种异常只能选一种(《角色养成设计.md》3.3)。
//   chance   —— 按抗性掷判定, 成功则本次完全不施加(眩晕这类开关型控制)
//   stacks   —— 按抗性削减层数(中毒这类按层数结算的异常)
//   duration —— 按抗性削减持续拍数(显式 duration 优先, 否则按层数处理)
export type ResistMode = "chance" | "stacks" | "duration";

export interface StatusDef {
  id: string;
  name: string;
  emoji: string;
  kind: StatusKind;
  desc: string;
  maxStacks?: number; // 层数上限; 缺省 = 不封顶
  maxStacksOf?: (state: BattleState, ownerId: string) => number; // 动态层数上限, 优先于 maxStacks
  detailStats?: (inst: StatusInstance) => StatusDetailStat[];
  undispellable?: true; // 不可被驱散 / 剥离 / 转移
  decay?: "one" | "half"; // 每拍层数衰减; 缺省 = 不衰减
  durationStartsImmediately?: boolean; // true = 施加当拍也扣除一次持续时间
  stackMode?: StackMode; // 同种状态再次施加时的层数合并方式
  refreshMode?: RefreshMode; // 同种状态再次施加时的持续拍数合并方式
  statMods?: Partial<StatBlock>; // 每层提供的固定属性修正
  statModsPct?: Partial<StatBlock>; // 每层提供的百分比属性修正(百分点)
  resistMode?: ResistMode; // 仅 debuff 需要; 缺省 = 不可被异常抗性削减
  hooks?: StatusHooks;
}
