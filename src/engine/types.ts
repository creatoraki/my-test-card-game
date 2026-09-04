// ============================================================================
// 核心类型定义 —— 引擎与 UI 共享。此文件只定义类型, 不含逻辑。
// ============================================================================

import type { QuirkId } from "./quirks";

export type Team = "player" | "enemy";
export type Phase = "player" | "won" | "lost";
export type ChallengeId =
  | "restraint"
  | "massacre"
  | "mercy"
  | "rotation"
  | "blitz"
  | "slow_start"
  | "untouched"
  | "no_redraw"
  | "low_cost"
  | "focus_fire"
  | "tempo";
export type DiscardReason =
  | "manual"
  | "effect"
  | "cost"
  | "redraw"
  | "roundEnd"
  | "play"
  | "passiveEnd"; // 回合结束把手牌里的被动卡收进弃牌堆; 不计数也不触发弃牌联动
export type CounterSource =
  | "discardsThisRound"
  | "fastPlaysThisRound"
  | "cardsPlayedThisRound"
  | "lastDiscardBatch"
  | "discardsThisBattle"
  | "lastDiscardBatchFast"
  | "lastRecoverBatchFast"
  | "lastDiscardBatchCost"
  | "lastConvertBatch"
  | "squadBuffCount"
  | "lastSquadBuffConsumed"
  | "lastConsumedStatusStacks"
  | "lastRemovedStatusCount"
  | "activeCardResonance";

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

export interface SquadBuffRewardPools {
  attack: readonly string[];
  defense: readonly string[];
  support: readonly string[];
  passive: readonly string[];
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
//   lowestHpAlly —— 受伤最重的存活队友
export type EffectTarget =
  | "primary"
  | "self"
  | "allFoes"
  | "allAllies"
  | "randomFoe"
  | "randomAlly"
  | "lowestHpAlly";

// ---------------------------------------------------------------------------
// 效果描述符 —— 声明式数据。新增机制 = 新增一个 EffectType + 一个 handler。
// ---------------------------------------------------------------------------
export type EffectType =
  | "DAMAGE"
  | "GAIN_SHIELD"
  | "DRAIN_SHIELD"
  | "HEAL"
  | "APPLY_STATUS"
  | "APPLY_STAT_MOD"
  | "DRAW"
  | "GAIN_RESOURCE"
  | "DISCARD"
  | "RECOVER_FROM_DISCARD"
  | "MARK_CARDS"
  | "CONVERT_CARD_TYPE"
  | "ADD_CARD_TO_HAND"
  | "RESTORE_HP_LIMIT"
  | "REMOVE_STATUS"
  | "VALUE_BOOST"
  | "LOSE_HP"
  // 本次出牌结算期间临时改写**施放者**面板, 出牌结束逆向撤回(见 battle.playCard)。
  // 与 APPLY_STAT_MOD 的区别: 后者写进 Combatant.mods 后本场战斗永久留存。
  | "PLAY_STAT_BONUS"
  | "CULTIVATE_TICK"
  | "GAIN_SQUAD_BUFF"
  | "REMOVE_SQUAD_BUFF"
  | "CONSUME_STATUS"
  | "SPREAD_STATUS"
  | "TICK_STATUS"
  | "RESONATE";

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
  statusKind?: StatusKind | "all"; // REMOVE_STATUS: 要移除的状态种类
  statusData?: Record<string, number>; // APPLY_STATUS: 状态的结构化运行时参数
  statusDataFrom?: { key: string; stat: keyof StatBlock; multiplier: number }; // APPLY_STATUS: 从施法者属性生成参数
  stacks?: number; // APPLY_STATUS: 层数
  stacksFromStat?: { stat: keyof StatBlock; multiplier: number }; // APPLY_STATUS: 层数 = 施法者属性 × 倍率
  spreadPct?: number; // SPREAD_STATUS: 复制给其他目标的状态层数比例
  aimedStacks?: number; // APPLY_STATUS: 目标已有瞄准时额外增加的层数
  aimedStacksMultiplier?: number; // APPLY_STATUS: 目标已有瞄准时层数倍率
  boostSource?: "spendPartyStarlight" | "primaryAimed"; // VALUE_BOOST: 数值加成来源
  boostPct?: number; // VALUE_BOOST: 每次成功触发增加的百分点
  duration?: number; // APPLY_STATUS: 剩余拍数
  targetCount?: number; // randomFoe / randomAlly: 无放回随机目标数
  targetHasStatus?: string; // randomFoe / randomAlly: 只从带指定状态的目标中抽取
  cardId?: string; // ADD_CARD_TO_HAND: 卡牌定义 id
  stacksFrom?: CounterSource; // APPLY_STATUS: 层数直接取自计数
  scaleByCounter?: { counter: CounterSource; per?: number; min?: number; max?: number };
  stat?: keyof StatBlock; // APPLY_STAT_MOD / PLAY_STAT_BONUS: 要修改的属性
  pct?: boolean; // APPLY_STAT_MOD / PLAY_STAT_BONUS: true = 百分比修正(百分点), 缺省 = 固定值修正
  resource?: string; // GAIN_RESOURCE: 资源名(默认 mana)
  flags?: string[]; // 例如 ["unblockable", "mustHit"]
  hits?: number; // DAMAGE: 段数, 缺省 1
  aimedMultiplier?: number; // DAMAGE: 目标已有瞄准时使用的伤害倍率
  hitsFrom?: CounterSource; // DAMAGE: 段数直接等于计数, 可为 0
  maxHits?: number; // DAMAGE: 直接取段数的上限
  bonusHitsFrom?: CounterSource; // DAMAGE: 每 1 点计数追加 1 段
  maxBonusHits?: number; // DAMAGE: 追加段数上限, 缺省不限
  bonusMultiplierFrom?: CounterSource; // DAMAGE: 按计数加算到伤害倍率上(不是乘算)
  bonusMultiplierPer?: number; // DAMAGE: 每 1 点计数加算的倍率
  // DAMAGE: 按目标状况逐目标加算倍率。targetHpBelowPct 用 value 传阈值(百分比)。
  damageBonus?: {
    when: "targetHasShield" | "targetHasNoShield" | "targetHpBelowPct" | "targetHasDebuff";
    multiplier: number;
    value?: number;
  };
  bonusMultiplierPerSelfStack?: number; // DAMAGE: 每 1 层本卡实例累计(state.activeCardStacks)加算的倍率
  onKill?: EffectDescriptor[]; // DAMAGE: 本次效果把某个目标打死时结算一次(主目标 = 被击杀者)
  onKillOnce?: boolean;
  pctOfCurrentHp?: number; // LOSE_HP: 按目标当前生命的比例失去生命(0.1 = 10%)
  cardOwner?: "randomAlly"; // ADD_CARD_TO_HAND: 将卡牌归属改为随机存活我方角色
  lifesteal?: number; // DAMAGE: 按本次效果实际掉血总量的倍率回复施放者
  hitBonus?: number; // DAMAGE: 本次效果的命中修正(百分点)
  amountFrom?: CounterSource; // DRAW / GAIN_RESOURCE: 数量直接等于计数
  discardPick?: "handTop" | "handBottom" | "handRandom" | "handAll"; // DISCARD: 取牌口径
  condition?:
    | "discardedThisRound"
    | "noFastPlaysThisRound"
    | "noPlaysThisRound"
    | "waterfall"
    | "handHasCostAtLeast"
    | "fastCardsInHandAtLeast"
    | "counterAtLeast"
    | "counterBelow"
    | "eventTargetHasStatus"; // 满足条件时才结算
  conditionValue?: number; // handHasCostAtLeast: 手牌中最低牌面费用; fastCardsInHandAtLeast: 手牌中速攻牌数量
  conditionCounter?: CounterSource;
  conditionStatus?: string;
  mark?: string; // MARK_CARDS: 要写入卡牌实例的标记 id
  // MARK_CARDS: 手牌选择方式。eventCard = 触发本次被动的那张牌(state.passiveEventCardUid)。
  markPick?: "handRandom" | "handAll" | "handRandomNonStarPay" | "handHighestCostRandom" | "eventCard";
  recoverPick?: "choose" | "random"; // RECOVER_FROM_DISCARD: 玩家选择或随机选择
  convertTo?: CardType; // CONVERT_CARD_TYPE: 转换后的卡牌类型
  convertPick?: "handRandomNormal" | "handAllFast"; // CONVERT_CARD_TYPE: 手牌普通牌随机 / 全部速攻牌
  squadBuff?: "assembleA" | "assembleB" | "assembleC" | "assembleD";
  squadBuffPick?: "choose" | "randomMissing" | "random" | "all";
  resonatePick?: "handAll" | "lowerCost";
  fromModule?: string; // 由卡牌模组追加的效果标记(模组 itemId); 纯标记, 引擎结算不读取
}

// ---------------------------------------------------------------------------
// 卡牌
// ---------------------------------------------------------------------------
export type CardType = "normal" | "fast" | "passive";
// normal 推进时刻, fast 不推进, passive 被动卡(无费用/不可打出/持在手中自动生效)
export type Rarity = "common" | "uncommon" | "rare";
export type CardRarity = "basic" | Rarity;

// 出牌动画类型(与技能绑定, 决定目标的受击/首击特效表现)。
//   攻击系: slash 斩击 / shot 箭击 / fire 火爆 / ice 冰霜 / lightning 电击 / poison 剧毒
//           iai-slash 居合拔刀斩(程序化 CSS)
//           blade-slash 刀光斩(程序化 CSS, 三拍)
//           tri-slash 三段斩击(Canvas 2D: V形折返 → 折返十连斩 → 延迟受击)
//           blood-slash 血色刀光(程序化 CSS: 下劈 → 刀痕 → 血花爆裂)
//           neon-cross 霓虹数据·交叉斩(程序化 CSS: 双刀交叉 → 白核坏帧 → 像素崩解)
//           triple-strike 流光·三段斩(程序化 CSS: 起手一刀顿住 → 崩断转场 → 六连乱舞 → 斩痕爆点)
//           basic-slash 快斩·单刀弧斩(程序化 CSS: 预兆 → 刃出 → 60ms 停顿 → 爆点，总长 560ms，普通攻击底特效)
//           keen-edge 锐利刀锋斩(程序化 CSS: 聚光起势 → 横扫爆点 → 金属余鸣 → 光尘衰减，总长 1750ms，按锐利刀锋.wav 包络编排)
//   辅助系(柔和光效): heal 治疗 / shield 护盾 / buff 增益
// 纯 UI 表现字段, 引擎逻辑不读取。UI 侧有兜底推断(见 ui/animations.ts)。
export type CardAnim =
  | "slash"
  | "shot"
  | "fire"
  | "ice"
  | "lightning"
  | "poison"
  | "iai-slash"
  | "blade-slash"
  | "tri-slash"
  | "blood-slash"
  | "neon-cross"
  | "triple-strike"
  | "basic-slash"
  | "keen-edge"
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
  starPay?: boolean; // 应星: 可用星辉替代法力水晶
  temporary?: boolean; // 临时卡: 仅战斗内生成, 不进入抽卡池
  costRule?: {
    when: "discardedThisRound" | "fastPlaysThisRound";
    threshold?: number;
    delta: number;
    per?: boolean; // true = 每 1 点计数都叠加一次 delta(线性), 缺省 = 达到阈值时只叠加一次
  };
  // 按卡牌实例的累计层数(Card.discardStacks)调整费用, 达到 atLeast 时叠加 delta。
  stackCostRule?: { atLeast: number; delta: number };
  resonance?: boolean; // 共鸣卡: 打出时强化符合条件的手牌
  passive?: PassiveDef; // 被动卡: 持在手中时按事件自动结算
  onDiscard?: DiscardTrigger;
  keywords?: CardKeywordRef[];
  cultivate?: {
    turns: number;
    effects: EffectDescriptor[];
    mode?: "append" | "replace";
  };
}

// 被动卡的驻留触发。cardDiscarded = 每有一张牌被丢弃, cardDrawn = 每抽到一张牌。
export type PassiveTriggerId =
  | "cardDiscarded"
  | "cardDrawn"
  | "roundEnd"
  | "enemyKilled"
  | "assembleSuccess";

export interface PassiveDef {
  on: PassiveTriggerId | PassiveTriggerId[];
  effects: EffectDescriptor[];
  effectsByTrigger?: Partial<Record<PassiveTriggerId, EffectDescriptor[]>>;
}

// 一次被动事件。cardUid = 触发事件的那张牌(被丢弃的 / 刚抽到的)。
export interface PassiveEvent {
  type: PassiveTriggerId;
  cardUid?: string;
  targetId?: string;
  targetStatuses?: StatusInstance[];
}

export interface DiscardTrigger {
  mode: "useSelf" | "custom" | "returnToHand";
  maxStacks?: number; // returnToHand: 累计层数上限(写进 Card.discardStacks)
  autoTarget?: "randomFoe" | "lowestHpFoe";
  effects?: EffectDescriptor[];
  alsoOnRoundEnd?: boolean;
}

export interface CardKeywordRef {
  id: string;
  effects: EffectDescriptor[];
  fromModule?: string;
}

// 运行期卡牌实例(带唯一 uid, 可被单独升级)
export interface Card extends CardDef {
  uid: string;
  upgraded: boolean;
  contaminated: boolean;
  resonanceStacks?: number; // 手牌内共鸣强化次数; 离手后清零
  marks?: string[];
  cultivateLeft?: number;
  discardStacks?: number; // returnToHand 类弃牌触发的累计层数; 打出后清零
  cardModule?: { uid: string; itemId: string } | null;
}

export type PendingChoice =
  | {
      kind: "recoverFromDiscard";
      sourceCardUid: string;
      count: number;
    }
  | {
      kind: "pickSquadBuff";
      options: string[];
    };

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
  appliedAt?: number; // 施加时持有者的节拍号, 用于跳过施加当拍的处理
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
  onTempo?: (c: StatusCtx) => void;
  onTick?: (c: StatusCtx) => void;
  modifyOutgoingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 施放者身上的状态
  modifyIncomingDamage?: (c: StatusCtx, dmg: DamageCtx) => void; // 目标身上的状态
  onAfterAttacked?: (c: StatusCtx, dmg: DamageCtx) => void; // 荆棘等
  onShieldBroken?: (c: StatusCtx) => void; // 护盾被伤害击破时
  onRoundStart?: (c: StatusCtx) => void; // 我方回合开始(抽牌之前)
}

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
  decay?: "one" | "half"; // 每拍层数衰减; 缺省 = 不衰减
  stackMode?: StackMode; // 同种状态再次施加时的层数合并方式
  refreshMode?: RefreshMode; // 同种状态再次施加时的持续拍数合并方式
  statMods?: Partial<StatBlock>; // 每层提供的固定属性修正
  statModsPct?: Partial<StatBlock>; // 每层提供的百分比属性修正(百分点)
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
  attack: number; // 攻击力: 攻击牌伤害 = 攻击力 ÷ RULES.combat.attackDivisor × 倍率
  healPower: number; // 治愈力: 治疗/护盾基础值 = 治愈力 ÷ RULES.combat.healDivisor × 倍率
  lowCostMastery: number; // 低费精通: 仅在卡牌结算窗口内叠加到攻击力与治愈力
  highCostMastery: number; // 高费精通: 仅在卡牌结算窗口内叠加到攻击力与治愈力
  defense: number; // 防御力: 正值按防御力 / (防御力 + 常量)减伤，负值增伤；穿甲只抵扣正防御，角色基础防御力为 0
  armorPen: number; // 穿甲(固定整数): 结算时抵扣目标防御力, 有效防御力不低于 0
  // 命中 / 回避 / 暴击
  hitRate: number; // 命中率(百分点)
  dodgeRate: number; // 闪避率(百分点, 最终值 70 封顶)
  critRate: number; // 暴击率(百分点, 最终值 70 封顶)
  critDamage: number; // 爆伤(百分点, 150 = 暴击伤害为 1.5 倍)
  precision: number; // 精准(百分点, 只抵消目标闪避, 不封顶)
  // 节奏 / 防护 / 异常
  initiative: number; // 先手: 敌人招式发动时刻 = max(1, 招式延迟 + 我方均值 − 敌方先手)
  blockRate: number; // 格挡率(百分点, 最终值 70 封顶); 成功则本次伤害 ×RULES.combat.blockReduction
  healBoost: number; // 治愈强度(百分点): 最终治疗 ×(1 + 治愈强度/100)
  shieldBoost: number; // 护盾强度(百分点): 最终护盾 ×(1 + 护盾强度/100)
  ailmentResist: number; // 异常抗性(百分点, 最终值 70 封顶); 抵抗哪一项由各异常自己定义
  // 探索 / 小队
  burdenAdapt: number; // 负重适应(固定值): 小队合计, 每 1 点抵扣 1 格占格
  handLimit: number; // 对小队手牌上限的贡献
  drawCount: number; // 对小队每回合基础抽牌数的贡献
}

// 属性修正层。最终属性 = (基础 + flat) × (1 + pct/100)。
// 装备(局外常驻)与卡牌/状态(战斗内)都用这个结构, 只是生命周期不同。
export interface StatModifier {
  flat?: Partial<StatBlock>; // 固定值; 装备的百分点属性也放这里
  pct?: Partial<StatBlock>; // 按基数放大的百分比; 同名 pct 默认相加
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
  tempo: number; // 已行进的持有者节拍数, 建局为 0
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
  aiMemory?: EnemyAiMemory;
}

export interface EnemyAiMemory {
  lastMoveId?: string;
  actsSinceRecycle: number;
  hammerCooldown: number;
  openingDone: boolean;
  justBrokeShell: boolean;
}

export interface EnemyAiScript {
  openingMoveId: string;
  recycleMoveId: string;
  shredMoveId: string;
  hammerMoveId: string;
  breatherMoveIds: string[];
  breatherWeights: Record<string, number>;
  successors: Record<string, Record<string, number>>;
  thresholds: {
    soloShield: number;
    partyShield: number;
    nearZeroShield: number;
    imbalanceRatio: number;
    concentration: number;
  };
  hammerOverride: number;
  hammerCooldown: number;
  recycleInsurance: number;
  brittleShredBias: number;
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
  waterfallPlay: boolean;
  playValueBonusPct: number;
  // 本次出牌期间临时写进施放者面板的加成台账(PLAY_STAT_BONUS)。
  // ★ 出牌结束逐条逆向撤回后清空 —— 它不是场上 buff, 结算完不留痕。
  playStatMods: { targetId: string; stat: keyof StatBlock; amount: number; pct: boolean }[];
  activeCardCost: number | null;
  // 当前结算卡的实例累计层数(Card.discardStacks)。与 activeCardCost 同生命周期。
  activeCardStacks: number;
  // 当前结算卡的共鸣强化次数, 与 activeCardStacks 同生命周期。
  activeCardResonance: number;
  // 被动卡结算窗口内, 触发本次事件的那张牌 uid(供 markPick: "eventCard" 定位)。
  passiveEventCardUid: string | null;
  passiveEventTargetStatuses: StatusInstance[] | null;
  lastDiscardBatchCost: number;
  lastConvertBatch: number;
  squadBuffs: { id: string }[];
  squadBuffRewardPools: SquadBuffRewardPools;
  lastSquadBuffConsumed: number;
  lastConsumedStatusStacks: number;
  lastRemovedStatusCount: number;
  resources: Record<string, number>; // 全队共享池, 如 { mana: 3 }
  // ★ 开战瞬间快照的有效负重点数, 战斗中恒定不变(《探索模式设计.md》§6.3)。
  //   引擎不认识背包与占格, 只认识这一个数 —— 由探索层用 stats.burdenValue 算好传入。
  burden: number;
  // ★ 开战瞬间快照的小队徽章与训练修正。引擎只认识最终数值, 不认识徽章/训练点。
  squadMods: SquadResourceMods;
  // 挑战词条运行态: 本场随机到的词条与其打破状态, 以及首次击杀回合。
  challenges: ChallengeRun[];
  challengeKillRound: number | null;
  // 聚焦: 本回合我方实际打掉过血的敌人 id; 出现第二个即打破。每回合开始重置。
  challengeFocusTargetId: string | null;
  // 抢拍: 已对哪一回合做过判定 —— 保证每回合只在敌人第一次行动前判一次。
  challengeEnemyActRound: number | null;
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
  pure?: boolean; // 跳过施放者与目标的伤害状态修正
  hitBonus?: number; // 本次效果的命中修正(百分点)
  onDealt?: (hpLost: number) => void; // 落到 HP 后回调实际掉血(未命中/濒死为 0)
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
    opts?: { scaled?: boolean },
  ): void;
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
  log(state: BattleState, text: string): void;
}

// ---------------------------------------------------------------------------
// 动画帧 —— 纯 UI 桥接结构。引擎在结算敌人行动时逐个记录, UI 逐帧回放。
// 引擎只填充结构化数据(行动者/受影响目标/掉血量/快照), 不决定具体表现动画。
// ---------------------------------------------------------------------------
// 一段命中明细。多段伤害(EffectDescriptor.hits)每段独立判命中, 故 missed 是逐段的。
export interface AnimHitPart {
  hpDelta: number; // >0 掉血, <0 回血, 0 = 命中但无 HP 变化(护盾全吃/濒死顶住)
  missed?: boolean;
}

export interface AnimHit {
  id: string; // 受影响单位
  hpDelta: number; // 本步对该单位的合计: >0 掉血, <0 回血, 0 仅护盾/状态/自身增益(仍闪特效但不飘字)
  missed?: boolean; // 合计口径: 所有段都未命中才为 true
  // 逐段明细(见 animHits.ts)。缺省 = 单段, UI 退化为一个数字一声音效。
  // UI 靠它渲染多个飘字与多次 HIT 音效; 引擎自身不读取。
  parts?: AnimHitPart[];
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
  reveal?: boolean; // 仅卡牌亮相提示, 不播放攻击演出或镜头推近
  hits: AnimHit[];
  snapshot: BattleState;
}

// 拍点(DOT/HOT)结算单独成一帧 —— 敌人在出招**之前**先掉毒血, 我方在回合结束逐个结算。
// 合进行动帧的话飘字会挤在招式命中之后, 玩家看不出"先中毒再挥拳"的先后。
export interface TempoFx {
  ownerId: string; // 结算拍点的单位
  hits: AnimHit[]; // DOT 掉血 / HOT 回血
  snapshot: BattleState; // 拍点结算后的完整快照(structuredClone)
}

export type FxStep =
  | ({ kind: "enemy" } & AnimFrame)
  | ({ kind: "discard" } & DiscardTriggerFx)
  | ({ kind: "tempo" } & TempoFx);

export interface FxRecorder {
  steps: FxStep[];
}

export type DiscardRecorder = FxRecorder;
