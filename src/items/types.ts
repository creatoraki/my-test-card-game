// ============================================================================
// 物品层类型定义 —— 与 engine/types.ts 同惯例: 只定义类型, 不含逻辑, 不 import 实现。
//
// 本层描述的是「实物战利品」(见 探索模式设计.md §五/§六 与 物品设计.md):
//   探索层产出的是**占背包格的实物**, 活着回到据点才进仓库; 团灭则连背包一起丢。
//   items/ 与 engine/ explore/ 平行, 是第三个纯 TS 层 —— 因为物品被**探索层**(背包/掉落)
//   与**城镇层**(仓库/穿戴)对称消费, 塞进任何一边都会造出反向依赖。
//
// ⚠⚠ 本文件的 ItemRarity 是**物品**稀有度(五档), 与 engine/types.ts 的 Rarity(卡牌, 三档)
//    是两套互不相干的枚举 —— 两者都有 "common"/"rare" 字面量, TS 不会报错地互相赋值。
//    卡牌那套只出现在 Card/卡组锻造里, 物品这套只出现在 ItemDef/ItemStack 里, 别混用。
// ============================================================================

import type { StatBlock } from "../engine/types";

// ---------------------------------------------------------------------------
// 稀有度 —— 五档(《物品设计.md》第四章)
// ---------------------------------------------------------------------------
export type ItemRarity = "common" | "fine" | "rare" | "epic" | "legendary";

// 由低到高。掉落权重表、UI 排序、边框强度都读它, 不要各写一份。
export const RARITY_ORDER: ItemRarity[] = ["common", "fine", "rare", "epic", "legendary"];

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "普通",
  fine: "精良",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

// ---------------------------------------------------------------------------
// 类别与装备槽
// ---------------------------------------------------------------------------
// 与《探索模式设计.md》§6.1 的物品类别表一一对应。
export type ItemCategory =
  | "scrap" // 废料: 带回据点的回收台出售, 换居民积分
  | "material" // 模组材料: 制造成品模组的原料, 不等同于可直接装配的 module
  | "module" // 成品模组: 装配到卡牌上; 与制造模组的 material 原料不同
  | "equipment" // 装备: 穿戴或分解
  | "data" // 数据存档: 回城解锁叙事, 不直接兑换积分
  | "consumable"; // 消耗品: 探索途中使用

export type EquipSlot = "weapon" | "armor" | "trinket"; // 《物品设计.md》第二章

export const SLOT_LABEL: Record<EquipSlot, string> = {
  weapon: "武器",
  armor: "防具",
  trinket: "饰品",
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  scrap: "废料",
  material: "模组材料",
  module: "模组",
  equipment: "装备",
  data: "数据存档",
  consumable: "消耗品",
};

// ---------------------------------------------------------------------------
// 消耗品的效果
// ---------------------------------------------------------------------------
// ⚠ 刻意**不**直接复用 explore/types.ts 的 ExploreEffect —— 那会让 items/ 反向依赖
//   explore/, 进而把 townStore 也拖进探索层的类型图。explore/session.useItem 负责把
//   这几种翻译成对会话的直接修改, 翻译表只有一处。
// ★ 带「指定角色」前缀的效果需要玩家点选目标角色头像后才能生效(见 ExploreScreen 的
//   目标选择流程); 其余效果使用后立即结算。
export type ItemUse =
  | { kind: "healParty"; percent: number } // 全队按 maxHp 百分比回血
  | { kind: "healOneFull"; othersPercent: number } // 单人回满 + 其余按百分比
  | { kind: "gainEnergy"; amount: number } // 净化粒子 +
  | { kind: "healOne"; percent: number } // 指定一名存活角色按 maxHp 百分比回血
  | { kind: "healLimitOne"; amount: number } // 指定一名存活角色修复 hpLimit 损伤
  | { kind: "reducePollutionOne"; amount: number } // 指定一名存活角色降低污染值(城镇侧落地)
  | { kind: "openModuleCrate"; tier: number }; // 开箱: 随机开出一件指定阶的通用模组, 进待拾取框

// 需要玩家点选目标角色的消耗品效果 kind。UI 据此决定是否进入头像选择流程。
export const TARGETED_ITEM_USE_KINDS = ["healOne", "healLimitOne", "reducePollutionOne"] as const;
export type TargetedItemUseKind = (typeof TARGETED_ITEM_USE_KINDS)[number];

// ---------------------------------------------------------------------------
// 定义与实例
// ---------------------------------------------------------------------------
export interface EquipAffixDef {
  stat: keyof StatBlock;
  min: number;
  max: number;
  weight: number;
}

export interface EquipModelDef {
  budget: { min: number; max: number; rolls?: number };
  blockMax: number;
  blockMin?: number;
  affixes: EquipAffixDef[];
  drawbacks?: EquipAffixDef[];
  costRefund?: number;
  costRefundFlat?: number;
}

export interface EquipRoll {
  budget: number;
  points: Partial<Record<keyof StatBlock, number>>;
  cost?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  desc: string;

  // 一「堆」最多几件。★ 首版一律 1 ⇒ 一件物品 = 一格。
  //   堆叠逻辑在 inventory.ts 里写好了但数据上没启用: 若废料能 5 件一堆, 十来件废料只占
  //   2-3 格, §6.2 的「一趟 12-18 格」产出配额与 −12%~−18% 的负重惩罚会当场崩塌。
  //   日后想放宽, 只改这里的数字, 逻辑一行不用动。
  maxStack: number;

  icon?: string; // ui/itemArt.tsx 的图标 key; 缺省按 category 兜底
  sellValue?: number; // 据点回收台的出售价(居民积分)。可回收物资填写
  // 据点商店的**购买**价(居民积分)。⚠ 与 sellValue 是两个方向、两套数, 不要互相换算:
  //   sellValue = 玩家把废料卖给回收台; buyValue = 玩家从商店买走这件东西。
  //   ★ 缺省 = 商店永不上架这件物品(见 data/shop.ts 的候选池筛选)。
  buyValue?: number;
  // 远征途中不可移除: 丢弃、强制丢弃、放弃拾取、投递口寄件四条出口全部对它关闭。
  undroppable?: boolean;

  // ---- 装备专属(category === "equipment" 时才有意义) ----
  slot?: EquipSlot;
  // 形状刻意与 townStore.EquipmentMods / engine 的 StatModifier 完全一致 ⇒ 穿戴时直接合并。
  mods?: { flat?: Partial<StatBlock>; pct?: Partial<StatBlock> };
  model?: EquipModelDef;
  // ★ 随机羁绊词条本期不实现(《物品设计.md》第五/六章), 字段先留:
  //   affinity = 羁绊饰品的固定羁绊; affinityRollable = 掉落时是否 roll 一条随机羁绊。
  affinity?: string;
  affinityRollable?: boolean;

  // 同一「族」的若干 def 各占一个稀有度档(如 armor-plate 族的 common/fine/rare 三件)。
  // 掉落表写 familyId 时, qualityBias 就在这一族内部把权重右移 ——
  // 「同一张掉落表, 低档时掉一堆破烂, 高档时掉同类里的好货」(设计文档 §5.1)。
  familyId?: string;

  use?: ItemUse; // 消耗品专属
}

// 运行期实例。★ 一个 ItemStack = 背包/仓库里的**一堆**, 也就是一个占位单元。
export interface ItemStack {
  uid: string; // 唯一实例号(与卡牌共用 data/index.ts 的发号器)
  itemId: string;
  count: number; // 1..def.maxStack
  affinity?: string; // 掉落时 roll 出的随机羁绊。⚠ 本期只存不生效
  roll?: EquipRoll;
}

// ---------------------------------------------------------------------------
// 掉落表
// ---------------------------------------------------------------------------
// 两种形态: 指名物品 / 指名家族。**只有后者吃 qualityBias**(品质右移只在族内发生)。
export type DropEntry =
  | { kind: "item"; itemId: string; chance: number; min?: number; max?: number }
  | { kind: "family"; familyId: string; chance: number; min?: number; max?: number };
