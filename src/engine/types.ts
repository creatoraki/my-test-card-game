// ============================================================================
// 核心类型定义 —— 引擎与 UI 共享。此文件只定义类型, 不含逻辑。
// ============================================================================

import type { QuirkId } from "./quirks";

export type Team = "player" | "enemy";
export type Phase = "player" | "won" | "lost";
export type ChallengeId = "restraint" | "massacre" | "mercy";
export type DiscardReason = "manual" | "effect" | "cost" | "redraw" | "roundEnd" | "play";
export type CounterSource =
  | "discardsThisRound"
  | "fastPlaysThisRound"
  | "cardsPlayedThisRound"
  | "lastDiscardBatch"
  | "discardsThisBattle"
  | "lastDiscardBatchFast"
  | "lastRecoverBatchFast";

export interface ChallengeRun {
  id: ChallengeId;
  broken: boolean;
}

export interface SquadResourceMods {
  openingHand: number;
  drawCount: number;
  redraws: number;
  waits: number;
  mana: number;
  handLimit: number;
}

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
  | "GAIN_SHIELD"
  | "HEAL"
  | "APPLY_STATUS"
  | "APPLY_STAT_MOD"
  | "DRAW"
  | "GAIN_RESOURCE"
  | "DISCARD"
  | "RECOVER_FROM_DISCARD"
  | "MARK_CARDS"
  | "CONVERT_CARD_TYPE";

export interface EffectDescriptor {
  type: EffectType;
  // DAMAGE 二选一(见 effects.ts):
  //   multiplier —— 攻击力倍率伤害, 走完整管线(命中/暴击/防御/格挡/护盾)
  //   amount     —— 固定伤害, 不使用攻击力, 也不吃防御与格挡(仍可被护盾吸收)
  // HEAL / GAIN_SHIELD 二选一: amount = 固定基础值, multiplier = 治愈力倍率。
  // DRAW / GAIN_RESOURCE 使用 amount 作为基础值。
  amount?: number;
  multiplier?: number;
  target?: EffectTarget; // 默认 "primary"
  status?: string; // APPLY_STATUS: 状态 id
  stacks?: number; // APPLY_STATUS: 层数
  stacksFrom?: CounterSource; // APPLY_STATUS: 层数直接取自计数
  stat?: keyof StatBlock; // APPLY_STAT_MOD: 要修改的属性
  pct?: boolean; // APPLY_STAT_MOD: true = 百分比修正(百分点), 缺省 = 固定值修正
  resource?: string; // GAIN_RESOURCE: 资源名(默认 mana)
  flags?: string[]; // 例如 ["unblockable", "mustHit"]
  hits?: number; // DAMAGE: 段数, 缺省 1
  hitsFrom?: CounterSource; // DAMAGE: 段数直接等于计数, 可为 0
  maxHits?: number; // DAMAGE: 直接取段数的上限
  bonusHitsFrom?: CounterSource; // DAMAGE: 每 1 点计数追加 1 段
  maxBonusHits?: number; // DAMAGE: 追加段数上限, 缺省不限
  bonusMultiplierFrom?: CounterSource; // DAMAGE: 按计数加算到伤害倍率上(不是乘算)
  bonusMultiplierPer?: number; // DAMAGE: 每 1 点计数加算的倍率
  damageBonus?: { when: "targetHasShield"; multiplier: number }; // DAMAGE: 按目标护盾逐目标加算倍率
  hitBonus?: number; // DAMAGE: 本次效果的命中修正(百分点)
  amountFrom?: CounterSource; // DRAW / GAIN_RESOURCE: 数量直接等于计数
  discardPick?: "handTop" | "handBottom" | "handRandom" | "handAll"; // DISCARD: 取牌口径
  condition?: "discardedThisRound" | "noFastPlaysThisRound"; // 满足本回合条件时才结算
  mark?: string; // MARK_CARDS: 要写入卡牌实例的标记 id
  markPick?: "handRandom" | "handAll"; // MARK_CARDS: 从手牌随机选择或全部选择
  recoverPick?: "choose" | "random"; // RECOVER_FROM_DISCARD: 玩家选择或随机选择
  convertTo?: CardType; // CONVERT_CARD_TYPE: 转换后的卡牌类型
  convertPick?: "handRandomNormal"; // CONVERT_CARD_TYPE: 从手牌普通牌中随机选择
}

// ---------------------------------------------------------------------------
// 卡牌
// ---------------------------------------------------------------------------
export type CardType = "normal" | "fast"; // normal 推进时刻, fast 不推进
export type Rarity = "common" | "uncommon" | "rare";
export type CardRarity = "basic" | Rarity;

// 出牌动画类型(与技能绑定, 决定目标的受击/首击特效表现)。
//   攻击系: slash 斩击 / shot 箭击 / fire 火爆 / ice 冰霜 / lightning 电击 / poison 剧毒
//           sword-fall 魔剑坠落(序列帧) / iai-slash 居合拔刀斩(程序化 CSS)
//           blade-slash 刀光斩(程序化 CSS, 三拍)
//           tri-slash 三段斩击(Canvas 2D: V形折返 → 折返十连斩 → 延迟受击)
//           blood-slash 血色刀光(程序化 CSS: 下劈 → 刀痕 → 血花爆裂)
//   辅助系(柔和光效): heal 治疗 / shield 护盾 / buff 增益
// 纯 UI 表现字段, 引擎逻辑不读取。UI 侧有兜底推断(见 ui/animations.ts)。
export type CardAnim =
  | "slash"
  | "shot"
  | "fire"
  | "ice"
  | "lightning"
  | "poison"
  | "sword-fall"
  | "iai-slash"
  | "blade-slash"
  | "tri-slash"
  | "blood-slash"
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
  rarity?: CardRarity;
  exhaust?: boolean; // 打出后进消耗堆(本场移除)
  tags?: string[];
  anim?: CardAnim; // 出牌动画类型(纯表现)。缺省时 UI 按效果兜底推断。
  costRule?: {
    when: "discardedThisRound" | "fastPlaysThisRound";
    threshold?: number;
    delta: number;
  };
  onDiscard?: DiscardTrigger;
  keywords?: CardKeywordRef[];
}

export interface DiscardTrigger {
  mode: "useSelf" | "custom";
  autoTarget?: "randomFoe" | "lowestHpFoe";
  effects?: EffectDescriptor[];
  alsoOnRoundEnd?: boolean;
}

export interface CardKeywordRef {
  id: string;
  effects: EffectDescriptor[];
}

// 运行期卡牌实例(带唯一 uid, 可被单独升级)
export interface Card extends CardDef {
  uid: string;
  upgraded: boolean;
  contaminated: boolean;
  marks?: string[];
}

export interface PendingChoice {
  kind: "recoverFromDiscard";
  sourceCardUid: string;
  count: number;
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
  fixed: boolean; // 固定伤害: 不使用攻击力, 也不吃防御与格挡
  missed: boolean; // 命中判定失手 —— 后续各段全部跳过
  crit: boolean; // 本次是否暴击
  blockRolled: boolean; // 本次是否触发格挡(伤害减半)
  blocked: number; // 被护盾吸收的量
  hpLost: number;
  downed?: boolean; // 目标处于我方濒死态, 本次伤害触发死亡骰
  fatal?: boolean; // 濒死死亡骰命中
}

export type DamageResult = "missed" | "hit" | null;

export interface StatusHooks {
  onRoundStart?: (c: StatusCtx) => void;
  onRoundEnd?: (c: StatusCtx) => void;
  onTick?: (c: StatusCtx) => void;
  modifyOutgoingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 施放者身上的状态
  modifyIncomingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 目标身上的状态
  onAfterAttacked?: (c: StatusCtx, dmg: DamageCtx) => void; // 荆棘等
}

// 异常抗性抵抗哪一项 —— 每种异常只能选一种(《角色养成设计.md》3.3)。
//   chance   —— 按抗性掷判定, 成功则本次完全不施加(眩晕这类开关型控制)
//   stacks   —— 按抗性削减层数(中毒这类按层数结算的异常)
//   duration —— 按抗性削减持续回合(本作的持续回合即层数, 与 stacks 同处理)
export type ResistMode = "chance" | "stacks" | "duration";

export interface StatusDef {
  id: string;
  name: string;
  emoji: string;
  kind: StatusKind;
  desc: string;
  maxStacks?: number; // 层数上限; 缺省 = 不封顶
  resistMode?: ResistMode; // 仅 debuff 需要; 缺省 = 不可被异常抗性削减
  hooks?: StatusHooks;
}

// ---------------------------------------------------------------------------
// 属性面板 —— 见《角色养成设计.md》第三/五/六章。
// ⚠ 所有概率与百分比类属性一律存**百分点整数**(命中率 8 = +8%, 爆伤 150 = 150%),
//   引擎里不出现 0.08 这种小数, 避免"到底该加还是该乘"的歧义。
// ---------------------------------------------------------------------------
export interface StatBlock {
  // 生存与输出
  maxHp: number; // 最大生命。★ 战斗中的实时上限读 Combatant.maxHp, 这里只是声明来源
  attack: number; // 攻击力: 攻击牌伤害 = 攻击力 × 倍率
  healPower: number; // 治愈力: 治疗基础值 + 该值
  defense: number; // 防御力: 减伤 = 防御力 / (防御力 + RULES.combat.defenseConstant)，初始防御力通常为 10
  // 命中 / 回避 / 暴击
  hitRate: number; // 命中率(百分点)
  dodgeRate: number; // 闪避率(百分点, 最终值 70 封顶)
  critRate: number; // 暴击率(百分点, 最终值 70 封顶)
  critDamage: number; // 爆伤(百分点, 150 = 暴击伤害为 1.5 倍)
  precision: number; // 精准(百分点, 与命中率同向, 不封顶)
  // 节奏 / 防护 / 异常
  initiative: number; // 先手: 敌人招式发动时刻 = max(1, 招式延迟 + 我方均值 − 敌方先手)
  blockRate: number; // 格挡率(百分点, 最终值 70 封顶); 成功则本次伤害 ×RULES.combat.blockReduction
  healBoost: number; // 治愈强度(百分点): 最终治疗 ×(1 + 治愈强度/100)
  shieldBoost: number; // 护盾强度(百分点): 最终护盾 ×(1 + 护盾强度/100)
  ailmentResist: number; // 异常抗性(百分点, 最终值 70 封顶); 抵抗哪一项由各异常自己定义
  // 探索 / 小队
  burdenAdapt: number; // 负重适应(百分点): 小队合计, 抵消负重惩罚
  handLimit: number; // 对小队手牌上限的贡献
  drawCount: number; // 对小队每回合基础抽牌数的贡献
}

// 属性修正层。最终属性 = (基础 + flat) × (1 + pct/100)。
// 装备(局外常驻)与卡牌/状态(战斗内)都用这个结构, 只是生命周期不同。
export interface StatModifier {
  flat?: Partial<StatBlock>;
  pct?: Partial<StatBlock>; // 百分点; 同名 pct 默认相加
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
  hpLimit: number; // 当前可治疗上限; 玩家受伤时会留下永久体力极限损伤
  maxHp: number; // 实时生命上限(建局时由 stats.maxHp 解析而来)
  shield: number; // 护盾值(可被伤害吸收)。⚠ 与"格挡"(blockRate, 概率减半)是两回事
  stats: StatBlock; // 局外已结算的面板(角色基础 + 装备)
  mods: StatModifier; // 战斗内修正(卡牌/状态/场景), 战斗结束即弃
  statuses: StatusInstance[];
  alive: boolean;
}

export interface Ally extends BaseCombatant {
  team: "player";
  charId: string;
  pollution: number;
  sick: boolean;
  quirks: QuirkId[];
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
  moveDelayDelta: number; // 遭遇战对每次抽取招式的延迟调整
  nextActTick: number | null; // 当前蓄力招式的发动时刻; null = 未在蓄力(行动点数已耗尽)
  actsPerRound: number; // 每回合行动次数上限, 建局时从 EnemyDef 拷入
  actsThisRound: number; // 本回合已消耗的行动点数
  intent: Intent;
}

export type Combatant = Ally | Enemy;

// ---------------------------------------------------------------------------
// 遭遇战改造器 —— 建局时对 EncounterDef 的一次性加成。
// 探索层的「区域危险度」通过它注入战斗(见 explore/session.ts encounterModifier);
// 引擎本身不认识危险度, 只认识这四条改造 —— 日后任何"动态难度"来源都可复用这个结构。
// ---------------------------------------------------------------------------
export interface EncounterModifier {
  extraEnemies?: string[]; // 追加的敌人 defId(排在原有敌人之后, 走默认站位)
  enemyStatuses?: StatusInstance[]; // 全体敌人的开局状态
  moveDelayDelta?: number; // 每次抽招式的延迟调整, 最终延迟钳到下限 1
  hpMultiplier?: number; // 敌人 maxHp 倍率(BOSS 缩放用), 缺省 1
}

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
  redrawsThisRound: number;
  waitsThisRound: number;
  discardsThisRound: number;
  playedThisRound: {
    uid: string;
    cost: number;
    cardType: CardType;
    ownerCharId: string;
  }[];
  lastPlayedCard: {
    uid: string;
    cost: number;
    cardType: CardType;
    ownerCharId: string;
  } | null;
  discardResolving: string[];
  pendingAutoPlays: string[];
  lastDiscardBatch: number;
  discardsThisBattle: number;
  lastDiscardBatchFast: number;
  lastRecoverBatchFast: number;
  pendingChoice: PendingChoice | null;
  resources: Record<string, number>; // 全队共享池, 如 { mana: 3 }
  // ★ 开战瞬间快照的有效负重点数, 战斗中恒定不变(《探索模式设计.md》§6.3)。
  //   引擎不认识背包与占格, 只认识这一个数 —— 由探索层用 stats.burdenValue 算好传入。
  burden: number;
  // ★ 开战瞬间快照的小队徽章与训练修正。引擎只认识最终数值, 不认识徽章/训练点。
  squadMods: SquadResourceMods;
  // 挑战词条运行态: 本场随机到的词条与其打破状态, 以及首次击杀回合。
  challenges: ChallengeRun[];
  challengeKillRound: number | null;
  rngState: number;
  log: LogEntry[];
}

// ---------------------------------------------------------------------------
// 引擎原语(传给状态钩子, 打破模块循环依赖)
// ---------------------------------------------------------------------------
export interface DamageOpts {
  flags?: string[];
  isAttack?: boolean; // 攻击: 吃力量/虚弱, 需要命中判定, 可暴击
  fixed?: boolean; // 固定伤害: 跳过防御减伤与格挡
  mustHit?: boolean; // 必中: 跳过命中判定
  unblockable?: boolean; // 不被护盾吸收
  hitBonus?: number; // 本次效果的命中修正(百分点)
}

export interface EngineOps {
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
    opts?: { scaled?: boolean },
  ): void;
  gainShield(
    state: BattleState,
    sourceId: string | undefined,
    targetId: string,
    amount: number,
  ): void;
  applyStatus(state: BattleState, targetId: string, statusId: string, stacks: number): void;
  applyStatMod(
    state: BattleState,
    targetId: string,
    stat: keyof StatBlock,
    amount: number,
    pct?: boolean,
  ): void;
  discard(state: BattleState, uid: string, reason: DiscardReason): void;
  log(state: BattleState, text: string): void;
}

// ---------------------------------------------------------------------------
// 动画帧 —— 纯 UI 桥接结构。引擎在结算敌人行动时逐个记录, UI 逐帧回放。
// 引擎只填充结构化数据(行动者/受影响目标/掉血量/快照), 不决定具体表现动画。
// ---------------------------------------------------------------------------
export interface AnimHit {
  id: string; // 受影响单位
  hpDelta: number; // >0 掉血, <0 回血, 0 仅护盾/状态/自身增益(仍闪特效但不飘字)
  missed?: boolean;
}

export interface AnimFrame {
  actorId: string; // 行动者(敌人 id)
  enemyDefId: string; // 供 UI 查招式定义以决定动画表现
  moveId: string; // 本次执行(或意图)的招式 id
  hits: AnimHit[]; // 需要闪特效/飘字的目标(primary / self / 群体)
  snapshot: BattleState; // 该动作结算后的完整快照(structuredClone)
}

export interface DiscardTriggerFx {
  cardUid: string;
  actorId: string;
  anim?: CardAnim;
  autoPlay?: boolean;
  hits: AnimHit[];
  snapshot: BattleState;
}

export interface DiscardRecorder {
  triggers: DiscardTriggerFx[];
}
