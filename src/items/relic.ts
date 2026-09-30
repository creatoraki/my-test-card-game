// ============================================================================
// 遗物规格 —— 类型、渠道与中文标签的唯一定义处。
//
// 一件遗物由四个维度标准化描述(数据见 data/items/relics/):
//   · 类型   polarity(祝福/诅咒) × scope(战斗/探索生效)
//   · 稀有度 ItemDef.rarity —— 与所在数据文件名一一对应(blessings/common.ts 只放 common)
//   · 说明   ItemDef.desc —— 只写效果本身, 以「。」结尾; 获取途径、一次性等信息一律不写进来
//   · 渠道   RelicSpec.channel —— 绝大多数遗物是普通, 省略不写; 只有渠道限定的遗物才标注
// ============================================================================

import type { EffectDescriptor, RelicTriggerId, SquadResourceMods, StatModifier } from "@/engine/types";
import type { ItemRarity } from "./types";

export type { RelicTriggerId } from "@/engine/types";

export type RelicPolarity = "blessing" | "curse";

/** 遗物在哪一层结算。battle = 战斗引擎读取; explore = 探索会话读取。 */
export type RelicScope = "battle" | "explore";

/**
 * 遗物的发放渠道。
 * · normal       普通(缺省): 祝福遗物进入随机池, 可从遗物匣、流浪货商、据点商店、通关奖励、圣水池净化、神龛升级获得
 * · bossDrop     首领掉落限定: 不进随机池, 只由首领掉落表按 id 指名
 * · specialEvent 特殊事件限定: 不进随机池, 只由特定事件/可交互物按 id 指名
 * · picnic       野餐限定: 不进任何随机池, 只由野餐食谱按 id 指名, 以一次性物资发放
 * · blessingBox  祝福匣限定: 只进临时遗物池, 只能从临时祝福匣抽出, 以一次性物资发放
 * 后两者统称一次性渠道: 永远进不了仓库, 且互不相通 —— 野餐遗物抽不出匣子, 匣子遗物也不会被食谱指名。
 */
export type RelicChannel = "normal" | "bossDrop" | "specialEvent" | "picnic" | "blessingBox";

export interface RelicSpec {
  polarity: RelicPolarity;
  scope: RelicScope;
  /** 缺省 = normal。 */
  channel?: RelicChannel;
  // ---- 声明式机制(可选) —— 写不下的效果放行为表, 见 data/items/relics/index.ts 的说明 ----
  on?: RelicTriggerId | RelicTriggerId[];
  effects?: EffectDescriptor[];
  mods?: StatModifier;
  squadMods?: Partial<SquadResourceMods>; // 小队资源修正(开局手牌/每回合抽牌/换牌/待机/费用/手牌上限)
  every?: number;
  purifyTo?: string | { rarity: ItemRarity };
}

export const relicChannelOf = (spec: RelicSpec): RelicChannel => spec.channel ?? "normal";

/** 一次性渠道(野餐限定 / 祝福匣限定): 只以一次性实例发放, 没有回收价。 */
export const isDisposableChannel = (channel: RelicChannel): boolean =>
  channel === "picnic" || channel === "blessingBox";

export const RELIC_POLARITY_LABEL: Record<RelicPolarity, string> = {
  blessing: "祝福遗物",
  curse: "诅咒遗物",
};

export const RELIC_SCOPE_LABEL: Record<RelicScope, string> = {
  battle: "战斗中生效",
  explore: "探索中生效",
};

export const RELIC_TRIGGER_LABEL: Record<RelicTriggerId, string> = {
  roundStart: "回合开始",
  roundEnd: "回合结束",
  cardPlayed: "出牌后",
  allyAttacked: "队友受击",
  enemyKilled: "击杀敌人",
  nodeArrived: "抵达节点",
  itemPicked: "拾取物品",
  rested: "休整后",
  battleVictory: "战斗胜利",
};
