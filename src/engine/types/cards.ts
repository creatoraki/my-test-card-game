import type { Targeting } from "./base";
import type { EffectDescriptor } from "./effects";
import type { StatusInstance } from "./statuses";

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
  | "lunar-ring"
  | "sakura-flurry"
  | "twin-arrow"
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
  fullDrawAnim?: CardAnim; // 满弓实际触发时改用的动画(纯表现)。
  starPay?: boolean; // 应星: 可用星辉替代法力水晶
  temporary?: boolean; // 临时卡: 仅战斗内生成, 不进入抽卡池
  playReturn?: { when: "fastPlaysThisRound"; atLeast: number; costDelta: number };
  voidCard?: boolean; // 回合结束自动从手牌移入消耗堆
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
  cultivateTargeting?: Targeting; // 培育就绪后覆盖卡牌主目标选择方式
  cultivate?: {
    turns: number;
    effects: EffectDescriptor[];
    mode?: "append" | "replace";
    overripe: { effects: EffectDescriptor[]; targeting?: Targeting };
  };
  volley?: { threshold: number; consumeAll?: boolean };
  handAura?: { cardId: string; cost: number };
}

// 被动卡的驻留触发。cardDiscarded = 每有一张牌被丢弃, cardDrawn = 每抽到一张牌, cardPlayed = 每打出一张牌。
export type PassiveTriggerId =
  | "cardDiscarded"
  | "cardDrawn"
  | "roundEnd"
  | "enemyKilled"
  | "assembleSuccess"
  | "allyAttacked"
  | "cardPlayed"
  | "roundStart"
  | "burnApplied";

export interface PassiveDef {
  on: PassiveTriggerId | PassiveTriggerId[];
  effects: EffectDescriptor[];
  effectsByTrigger?: Partial<Record<PassiveTriggerId, EffectDescriptor[]>>;
}

// 一次被动事件。cardUid = 触发事件的那张牌(被丢弃的 / 刚抽到的 / 刚打出的)。
export interface PassiveEvent {
  type: PassiveTriggerId;
  cardUid?: string;
  targetId?: string;
  targetStatuses?: StatusInstance[];
}

export type RelicTriggerId =
  | "roundStart"
  | "roundEnd"
  | "cardPlayed"
  | "allyAttacked"
  | "enemyKilled"
  | "nodeArrived"
  | "itemPicked"
  | "rested"
  | "battleVictory";

export interface RelicEvent {
  type: RelicTriggerId;
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
  maxTriggers?: number; // 关键词效果最多结算次数, 不影响真实触发次数记录
  onceEffects?: EffectDescriptor[]; // 关键词至少触发一次时只结算一次
  fromModule?: string;
}

// 运行期卡牌实例(带唯一 uid, 可被单独升级)
export interface Card extends CardDef {
  uid: string;
  upgraded: boolean;
  contaminated: boolean;
  // 磁化护符的被动牌保留回合数。0 / 缺省表示按普通规则回收。
  holdRounds?: number;
  resonanceStacks?: number; // 手牌内共鸣强化次数; 离手后清零
  costStacks?: number; // 雷走回手累计费用加成; 真正进弃牌堆后清零
  notoPending?: boolean; // 纳刀待取回标记
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
      recoverMark?: string;
    }
  | {
      kind: "pickHandCard";
      sourceCardUid: string;
      ownerCharId: string;
      action: "moveToBottom" | "noto" | "cultivateTick" | "markSource" | "markTarget" | "devour" | "stripMarks";
      remaining: number;
      followUp?: EffectDescriptor[];
    }
  | {
      kind: "pickFromDraw";
      sourceCardUid: string;
      options: string[];
      mark?: string;
    }
  | {
      kind: "pickSquadBuff";
      options: string[];
      mode?: "gain" | "remove";
    };
