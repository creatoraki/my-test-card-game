import type { CounterSource, EffectTarget } from "./base";
import type { CardType } from "./cards";
import type { ProphecyId } from "./prophecy";
import type { StatBlock } from "./stats";
import type { StatusKind } from "./statuses";

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
  | "STRIP_STATUS"
  | "VALUE_BOOST"
  | "LOSE_HP"
  | "GAIN_POLLUTION"
  // 本次出牌结算期间临时改写**施放者**面板, 出牌结束逆向撤回(见 battle.playCard)。
  // 与 APPLY_STAT_MOD 的区别: 后者写进 Combatant.mods 后本场战斗永久留存。
  | "PLAY_STAT_BONUS"
  | "CULTIVATE_TICK"
  | "GAIN_SQUAD_BUFF"
  | "REMOVE_SQUAD_BUFF"
  | "CONSUME_STATUS"
  | "SPREAD_STATUS"
  | "TICK_STATUS"
  | "EXTEND_STATUS"
  | "TRANSFER_STATUS"
  | "TRANSFER_DEBUFFS"
  | "EXHAUST_HAND_CARDS"
  | "RESONATE"
  | "SETTLE_INSURANCE"
  | "TRANSFORM_CARD"
  | "COPY_CARD_TO_HAND"
  | "CHOOSE_HAND_CARD"
  | "REVEAL_CARDS"
  | "START_PROPHECY" // 预言家打出预言(见 engine/prophecy)
  | "DELAY_ENEMY_ACT"; // 目标敌人当前蓄力招式的发动时刻推迟 amount

export interface EffectDescriptor {
  type: EffectType;
  // DAMAGE 二选一(见 effects.ts):
  //   multiplier —— 攻击力倍率伤害, 走完整管线(命中/暴击/防御/格挡/护盾)
  //   amount     —— 固定伤害, 不使用攻击力, 也不吃防御与格挡(仍可被护盾吸收)
  // HEAL / GAIN_SHIELD 二选一: amount = 固定基础值, multiplier = 治愈力倍率。
  // DRAW / GAIN_RESOURCE 使用 amount 作为基础值。
  // GAIN_POLLUTION 使用 amount 作为污染点数。
  amount?: number;
  multiplier?: number;
  target?: EffectTarget; // 默认 "primary"
  status?: string; // APPLY_STATUS: 状态 id
  statusKind?: StatusKind | "all"; // REMOVE_STATUS: 要移除的状态种类
  statusData?: Record<string, number>; // APPLY_STATUS: 状态的结构化运行时参数
  statusDataFrom?: { key: string; stat: keyof StatBlock; multiplier: number }; // APPLY_STATUS: 从施法者属性生成参数
  stacks?: number; // APPLY_STATUS: 层数
  setStacks?: boolean; // APPLY_STATUS: 覆盖已有层数，0 层时移除
  maxStacks?: number; // CONSUME_STATUS: 单次最多消耗的层数；APPLY_STATUS: 本次附加层数上限
  stacksFromStat?: { stat: keyof StatBlock; multiplier: number; bonusMultiplierFrom?: CounterSource; bonusMultiplierPer?: number }; // APPLY_STATUS: 层数 = 施放者属性 × 倍率, 可按计数增加倍率
  spreadPct?: number; // SPREAD_STATUS: 复制给其他目标的状态层数比例
  boostSource?: "spendPartyStarlight" | "fullDraw"; // VALUE_BOOST: 数值加成来源
  boostPct?: number; // VALUE_BOOST: 每次成功触发增加的百分点
  duration?: number; // APPLY_STATUS: 剩余拍数
  targetCount?: number; // randomFoe / randomAlly: 无放回随机目标数
  targetHasStatus?: string; // randomFoe / randomAlly: 只从带指定状态的目标中抽取
  targetWithoutStatus?: string; // randomFoe / randomAlly / allFoes: 排除带指定状态的目标
  cardId?: string; // ADD_CARD_TO_HAND: 卡牌定义 id
  stacksFrom?: CounterSource; // APPLY_STATUS: 层数直接取自计数
  stacksFromPer?: number; // APPLY_STATUS: stacksFrom 计数的倍率, 缺省 1
  consumePct?: number; // CONSUME_STATUS: 按当前层数比例消耗(向下取整), 与 maxStacks 同时存在时取较小值
  amountBonusFrom?: CounterSource; // GAIN_SHIELD 固定值模式: 按计数加算到 amount 上
  amountBonusPer?: number; // GAIN_SHIELD 固定值模式: 每 1 点计数加算的 amount
  scaleByCounter?: {
    counter: CounterSource;
    per?: number;
    min?: number;
    max?: number;
    add?: number; // 计数 × per 后再加上的常数
  };
  stat?: keyof StatBlock; // APPLY_STAT_MOD / PLAY_STAT_BONUS: 要修改的属性
  pct?: boolean; // APPLY_STAT_MOD / PLAY_STAT_BONUS: true = 百分比修正(百分点), 缺省 = 固定值修正
  resource?: string; // GAIN_RESOURCE: 资源名(默认 mana)
  flags?: string[]; // 例如 ["unblockable", "mustHit"]
  hits?: number; // DAMAGE: 段数, 缺省 1
  pierceOnHit?: number; // DAMAGE: 每段命中后为目标附加的穿孔层数
  hitsFrom?: CounterSource; // DAMAGE: 段数直接等于计数, 可为 0
  maxHits?: number; // DAMAGE: 直接取段数的上限
  bonusHitsFrom?: CounterSource; // DAMAGE: 每 1 点计数追加 1 段
  maxBonusHits?: number; // DAMAGE: 追加段数上限, 缺省不限
  bonusMultiplierFrom?: CounterSource; // DAMAGE: 按计数加算到伤害倍率上(不是乘算)
  bonusMultiplierPer?: number; // DAMAGE: 每 1 点计数加算的倍率
  maxBonusMultiplier?: number; // DAMAGE: bonusMultiplierFrom 的加算倍率上限
  // DAMAGE: 按目标状况逐目标加算倍率。targetHpBelowPct 用 value 传阈值(百分比)。
  damageBonus?: {
    when: "targetHasShield" | "targetHasNoShield" | "targetHpBelowPct" | "targetHasDebuff" | "targetHasStatus" | "perStatusStack";
    multiplier: number;
    value?: number;
    status?: string;
  };
  bonusMultiplierPerSelfStack?: number; // DAMAGE: 每 1 层本卡实例累计(state.activeCardStacks)加算的倍率
  onKill?: EffectDescriptor[]; // DAMAGE: 本次效果把某个目标打死时结算一次(主目标 = 被击杀者)
  onKillOnce?: boolean;
  onHit?: EffectDescriptor[]; // DAMAGE: 本次至少命中一个目标时结算一次
  onCrit?: EffectDescriptor[]; // DAMAGE: 本次至少暴击一次时结算一次
  randomPerHit?: boolean; // DAMAGE: randomFoe 每段重新选择目标
  pctOfCurrentHp?: number; // LOSE_HP: 按目标当前生命的比例失去生命(0.1 = 10%)
  cardOwner?: "randomAlly"; // ADD_CARD_TO_HAND: 将卡牌归属改为随机存活我方角色
  lifesteal?: number; // DAMAGE: 按本次效果实际掉血总量的倍率回复施放者
  lifestealTarget?: "allAllies"; // DAMAGE: 按实际伤害为全队分别回复
  lifestealOverflow?: "lowestHpAlly"; // DAMAGE: 吸血溢出部分治疗最伤的存活队友
  hitBonus?: number; // DAMAGE: 本次效果的命中修正(百分点)
  amountFrom?: CounterSource; // DRAW / GAIN_RESOURCE / ADD_CARD_TO_HAND / REVEAL_CARDS / CHOOSE_HAND_CARD: 数量直接等于计数
  maxAmount?: number; // 按计数重复处理效果时的上限
  durationFrom?: { counter: CounterSource; per?: number }; // APPLY_STATUS: 持续时间额外增加
  tickNow?: boolean; // APPLY_STATUS: 附加后立即结算本次新增层数
  excludePrimary?: boolean; // 解析目标时排除主目标
  fullDraw?: "hit" | "miss"; // 整条效果按本次满弓结果门控
  fullDrawTargets?: "hit" | "miss"; // 按目标过滤本次满弓命中/未命中的对象
  discardPick?: "handTop" | "handBottom" | "handRandom" | "handAll"; // DISCARD: 取牌口径
  condition?:
    | "discardedThisRound"
    | "noFastPlaysThisRound"
    | "noPlaysThisRound"
    | "waterfall"
    | "eventIsSourceCard"
    | "handHasCostAtLeast"
    | "fastCardsInHandAtLeast"
    | "counterAtLeast"
    | "counterBelow"
    | "eventTargetHasStatus"
    | "targetAttackedThisRound"
    | "targetNotAttackedThisRound"
    | "fullyStarPaid"
    | "targetLacksStatus"
    | "primaryBelowHpLimit"
    | "primaryActsWithin"; // 满足条件时才结算。primaryActsWithin: 主目标敌人的招式将在 conditionValue 时刻内发动
  conditionValue?: number; // handHasCostAtLeast: 手牌中最低牌面费用; fastCardsInHandAtLeast: 手牌中速攻牌数量
  conditionValueMax?: number; // counterAtLeast: 可选闭区间上限
  conditionCounter?: CounterSource;
  conditionStatus?: string;
  mark?: string; // MARK_CARDS: 要写入卡牌实例的标记 id
  // MARK_CARDS: 手牌选择方式。eventCard = 触发本次被动的那张牌(state.passiveEventCardUid)。
  markPick?: "handRandom" | "handAll" | "handRandomNonStarPay" | "handHighestCostRandom" | "eventCard" | "handBottom" | "handRandomUnmarked" | "targetHandRandom";
  markUnique?: boolean; // MARK_CARDS: 手牌中已存在该标记时跳过
  onEachRemoved?: EffectDescriptor[]; // STRIP_STATUS: 每移除一个状态后结算
  onNoneRemoved?: EffectDescriptor[]; // STRIP_STATUS: 一个状态都没有移除时结算
  recoverPick?: "choose" | "random"; // RECOVER_FROM_DISCARD: 玩家选择或随机选择
  recoverMark?: string; // RECOVER_FROM_DISCARD: 回收的牌附加标记
  handChoiceAction?: "moveToBottom" | "noto" | "cultivateTick" | "markSource" | "markTarget" | "devour" | "stripMarks" | "grantStarPact"; // CHOOSE_HAND_CARD: 选牌后的动作
  followUp?: EffectDescriptor[]; // CHOOSE_HAND_CARD: 选牌后的后续效果
  revealMode?: "costChain" | "attackOrDraw" | "scryPick"; // REVEAL_CARDS: 翻牌方式
  convertTo?: CardType; // CONVERT_CARD_TYPE: 转换后的卡牌类型
  convertPick?: "handRandomNormal" | "handAllFast"; // CONVERT_CARD_TYPE: 手牌普通牌随机 / 全部速攻牌
  squadBuff?: "assembleA" | "assembleB" | "assembleC" | "assembleD";
  squadBuffPick?: "choose" | "randomMissing" | "random" | "all";
  resonatePick?: "handAll" | "lowerCost";
  fromModule?: string; // 由卡牌模组追加的效果标记(模组 itemId); 纯标记, 引擎结算不读取
  prophecy?: ProphecyId; // START_PROPHECY: 预言 id
}
