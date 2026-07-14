// ============================================================================
// 核心类型定义 —— 引擎与 UI 共享。此文件只定义类型, 不含逻辑, 不 import 其他模块。
// ============================================================================

export type Team = "player" | "enemy";
export type Phase = "player" | "won" | "lost";

// ---------------------------------------------------------------------------
// 目标选择
// ---------------------------------------------------------------------------
// 卡牌/招式的"主目标"选择方式:
//   foe      —— 需要选择一个敌对单位(玩家点选 / 敌人按仇恨选)
//   ally     —— 需要选择一个友方单位
//   self     —— 施放者自身
//   allFoes  —— 全体敌对
//   allAllies—— 全体友方
//   none     —— 无需主目标(效果自带 target)
export type Targeting = "foe" | "ally" | "self" | "allFoes" | "allAllies" | "none";

// 单条效果作用到谁(相对施放者):
//   primary   —— 卡牌/招式选定的主目标
//   self      —— 施放者
//   allFoes   —— 施放者的全部敌人
//   allAllies —— 施放者的全部队友
//   randomFoe —— 随机一个敌人
//   randomAlly—— 随机一个队友
export type EffectTarget =
  | "primary"
  | "self"
  | "allFoes"
  | "allAllies"
  | "randomFoe"
  | "randomAlly";

// ---------------------------------------------------------------------------
// 效果描述符 —— 声明式数据。新增机制 = 新增一个 EffectType + 一个 handler。
// ---------------------------------------------------------------------------
export type EffectType =
  | "DAMAGE"
  | "GAIN_BLOCK"
  | "HEAL"
  | "APPLY_STATUS"
  | "DRAW"
  | "GAIN_RESOURCE"
  | "MODIFY_THREAT";

export interface EffectDescriptor {
  type: EffectType;
  amount?: number;
  target?: EffectTarget; // 默认 "primary"
  status?: string; // APPLY_STATUS: 状态 id
  stacks?: number; // APPLY_STATUS: 层数
  resource?: string; // GAIN_RESOURCE: 资源名(默认 mana)
  flags?: string[]; // 例如 ["unblockable"]
}

// ---------------------------------------------------------------------------
// 卡牌
// ---------------------------------------------------------------------------
export type CardType = "normal" | "fast"; // normal 推进时刻, fast 不推进
export type Rarity = "common" | "uncommon" | "rare";

// 出牌动画类型(与技能绑定, 决定目标的受击/首击特效表现)。
//   攻击系: slash 斩击 / shot 箭击 / fire 火爆 / ice 冰霜 / lightning 电击 / poison 剧毒
//   辅助系(柔和光效): heal 治疗 / shield 护盾 / buff 增益
// 纯 UI 表现字段, 引擎逻辑不读取。UI 侧有兜底推断(见 ui/animations.ts)。
export type CardAnim =
  | "slash"
  | "shot"
  | "fire"
  | "ice"
  | "lightning"
  | "poison"
  | "heal"
  | "shield"
  | "buff";

export interface CardDef {
  id: string;
  name: string;
  ownerCharId: string; // 归属角色(用于配色 / self 效果 / 角色阵亡后禁用)
  cost: number; // 消耗资源(法力水晶)
  cardType: CardType;
  targeting: Targeting;
  effects: EffectDescriptor[];
  text: string;
  rarity?: Rarity;
  exhaust?: boolean; // 打出后进消耗堆(本场移除)
  tags?: string[];
  anim?: CardAnim; // 出牌动画类型(纯表现)。缺省时 UI 按效果兜底推断。
}

// 运行期卡牌实例(带唯一 uid, 可被单独升级)
export interface Card extends CardDef {
  uid: string;
  upgraded: boolean;
}

// ---------------------------------------------------------------------------
// 状态效果(buff / debuff) —— 定义含行为钩子; 挂在单位身上的只是 { id, stacks }。
// ---------------------------------------------------------------------------
export type StatusKind = "buff" | "debuff";

export interface StatusInstance {
  id: string;
  stacks: number;
}

// 传给状态钩子的上下文。ops 提供引擎原语, 使 statuses.ts 无需 import 具体实现。
export interface StatusCtx {
  state: BattleState;
  ownerId: string;
  inst: StatusInstance;
  ops: EngineOps;
}

export interface DamageCtx {
  sourceId?: string;
  targetId: string;
  amount: number; // 在管线中被逐段修改
  flags: string[];
  isAttack: boolean;
  blocked: number;
  hpLost: number;
}

export interface StatusHooks {
  onRoundStart?: (c: StatusCtx) => void;
  onRoundEnd?: (c: StatusCtx) => void;
  onTick?: (c: StatusCtx) => void;
  modifyOutgoingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 施放者身上的状态
  modifyIncomingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 目标身上的状态
  onAfterAttacked?: (c: StatusCtx, dmg: DamageCtx) => void; // 荆棘等
}

export interface StatusDef {
  id: string;
  name: string;
  emoji: string;
  kind: StatusKind;
  desc: string;
  hooks?: StatusHooks;
}

// ---------------------------------------------------------------------------
// 战斗单位
// ---------------------------------------------------------------------------
export interface BaseCombatant {
  id: string;
  name: string;
  emoji: string;
  team: Team;
  hp: number;
  maxHp: number;
  block: number;
  statuses: StatusInstance[];
  alive: boolean;
}

export interface Ally extends BaseCombatant {
  team: "player";
  threat: number; // 仇恨值
  charId: string;
}

export interface Intent {
  moveId: string;
  name: string;
  emoji: string;
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  value?: number; // 预览数值(伤害/护盾)
}

export interface Enemy extends BaseCombatant {
  team: "enemy";
  enemyDefId: string;
  castTick: number; // 行动间隔(时刻)
  nextActTick: number; // 下次行动的时刻(本回合内)
  actsThisRound: number;
  aiIndex: number; // 意图脚本指针
  intent: Intent;
}

export type Combatant = Ally | Enemy;

// ---------------------------------------------------------------------------
// 战斗状态 —— 完全可序列化(无函数), 可 structuredClone / 存 localStorage。
// ---------------------------------------------------------------------------
export interface LogEntry {
  round: number;
  tick: number;
  text: string;
}

export interface BattleState {
  encounterId: string;
  round: number;
  tick: number;
  phase: Phase;
  combatants: Record<string, Combatant>;
  playerIds: string[];
  enemyIds: string[];
  cards: Record<string, Card>;
  draw: string[]; // 卡牌 uid
  hand: string[];
  discard: string[];
  exhaust: string[];
  resources: Record<string, number>; // 全队共享池, 如 { mana: 3 }
  rngState: number;
  log: LogEntry[];
}

// ---------------------------------------------------------------------------
// 引擎原语(传给状态钩子, 打破模块循环依赖)
// ---------------------------------------------------------------------------
export interface DamageOpts {
  flags?: string[];
  isAttack?: boolean;
  unblockable?: boolean;
}

export interface EngineOps {
  dealDamage(
    state: BattleState,
    sourceId: string | undefined,
    targetId: string,
    amount: number,
    opts?: DamageOpts,
  ): void;
  heal(state: BattleState, targetId: string, amount: number): void;
  gainBlock(state: BattleState, targetId: string, amount: number): void;
  applyStatus(state: BattleState, targetId: string, statusId: string, stacks: number): void;
  modifyThreat(state: BattleState, targetId: string, amount: number): void;
  log(state: BattleState, text: string): void;
}

// ---------------------------------------------------------------------------
// 动画帧 —— 纯 UI 桥接结构。引擎在结算敌人行动时逐个记录, UI 逐帧回放。
// 引擎只填充结构化数据(行动者/受影响目标/掉血量/快照), 不决定具体表现动画。
// ---------------------------------------------------------------------------
export interface AnimHit {
  id: string; // 受影响单位
  hpDelta: number; // >0 掉血, <0 回血, 0 仅护盾/状态/自身增益(仍闪特效但不飘字)
}

export interface AnimFrame {
  actorId: string; // 行动者(敌人 id)
  enemyDefId: string; // 供 UI 查招式定义以决定动画表现
  moveId: string; // 本次执行(或意图)的招式 id
  hits: AnimHit[]; // 需要闪特效/飘字的目标(primary / self / 群体)
  snapshot: BattleState; // 该动作结算后的完整快照(structuredClone)
}
