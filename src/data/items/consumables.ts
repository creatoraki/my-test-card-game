import type { ItemDef, ItemRarity, ItemUse } from "../../items/types";
import { withBuyValue } from "./pricing";

const QUALITY_SUFFIX: Record<ItemRarity, string> = {
  common: "c",
  fine: "f",
  rare: "r",
  epic: "e",
  legendary: "l",
};

const QUALITY_LABEL: Record<ItemRarity, string> = {
  common: "普通",
  fine: "精良",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

// ★ 统一占位数值(平衡待调): 三族消耗品各稀有度先共用同一档效果,
//   强度阶梯留到平衡轮次再填 —— 每族只改这里一个数。
const HEAL_PERCENT = 0.2;
const LIMIT_REPAIR_AMOUNT = 10;
const POLLUTION_REDUCE = 15;
const SUGAR_CUBE_BUY_VALUE = 30;
const MEDICAL_KIT_BUY_VALUE = 200;
const HOLY_WATER_BUY_VALUE = 50;

function pendingConsumable(
  id: string,
  name: string,
  familyId: string,
  rarity: ItemRarity,
  effect: string,
): ItemDef {
  return {
    id,
    name,
    category: "consumable",
    rarity,
    desc: `${QUALITY_LABEL[rarity]}级${name}：${effect}数值待平衡，当前暂不可使用。`,
    maxStack: 1,
    familyId,
    icon: "consumable",
  };
}

// 已启用的消耗品: desc 里写死实际效果(与 use 字段同一份数值口径), 不再挂「暂不可使用」。
function usableConsumable(
  id: string,
  name: string,
  familyId: string,
  rarity: ItemRarity,
  desc: string,
  use: ItemUse,
  buyValue: number,
): ItemDef {
  return {
    id,
    name,
    category: "consumable",
    rarity,
    desc,
    maxStack: 1,
    familyId,
    icon: "consumable",
    use,
    buyValue,
  };
}

const QUALITY_ORDER: ItemRarity[] = ["common", "fine", "rare", "epic", "legendary"];

// ★ 与装备/材料同样过一遍 withBuyValue —— 消耗品与临期食品要在出击准备的「货柜」里卖,
//   没有 buyValue 就没法标价也没法扣钱(货柜清单见 data/sortieStock.ts)。
const DEFS: ItemDef[] = [
  ...QUALITY_ORDER.map((rarity) =>
    usableConsumable(
      `sugar-cube-${QUALITY_SUFFIX[rarity]}`,
      "糖块",
      "sugar-cube",
      rarity,
      `${QUALITY_LABEL[rarity]}级糖块：使用后回复一名存活角色 ${Math.round(HEAL_PERCENT * 100)}% 生命。`,
      { kind: "healOne", percent: HEAL_PERCENT },
      SUGAR_CUBE_BUY_VALUE,
    ),
  ),
  ...QUALITY_ORDER.map((rarity) =>
    usableConsumable(
      `medical-kit-${QUALITY_SUFFIX[rarity]}`,
      "医疗包",
      "medical-kit",
      rarity,
      `${QUALITY_LABEL[rarity]}级医疗包：使用后修复一名存活角色 ${LIMIT_REPAIR_AMOUNT} 点体力极限。`,
      { kind: "healLimitOne", amount: LIMIT_REPAIR_AMOUNT },
      MEDICAL_KIT_BUY_VALUE,
    ),
  ),
  ...QUALITY_ORDER.map((rarity) =>
    usableConsumable(
      `holy-water-${QUALITY_SUFFIX[rarity]}`,
      "圣水",
      "holy-water",
      rarity,
      `${QUALITY_LABEL[rarity]}级圣水：使用后降低一名存活角色 ${POLLUTION_REDUCE} 点污染值。`,
      { kind: "reducePollutionOne", amount: POLLUTION_REDUCE },
      HOLY_WATER_BUY_VALUE,
    ),
  ),
  ...QUALITY_ORDER.map((rarity) =>
    pendingConsumable(
      `fruit-juice-${QUALITY_SUFFIX[rarity]}`,
      "果汁",
      "fruit-juice",
      rarity,
      "强化全队下一场战斗的先手",
    ),
  ),
  {
    id: "milk",
    name: "牛奶",
    category: "consumable",
    rarity: "common",
    desc: "基础临期食品，可用于支付医疗机器人和幸存者营地的小额交易。",
    maxStack: 5,
    icon: "consumable",
  },
  {
    id: "bread",
    name: "面包",
    category: "consumable",
    rarity: "common",
    desc: "基础临期食品，可用于支付维修机器人和回收设备的小额交易。",
    maxStack: 5,
    icon: "consumable",
  },
  {
    id: "cola",
    name: "可乐",
    category: "consumable",
    rarity: "common",
    desc: "标准包装饮料，垃圾桶机器人和自动售货机能够识别。",
    maxStack: 5,
    icon: "consumable",
  },
  {
    id: "hamburger",
    name: "汉堡",
    category: "consumable",
    rarity: "common",
    desc: "高热量临期食品，可用于医疗机器人和战斗补给站的高价值交易。",
    maxStack: 5,
    icon: "consumable",
  },
  {
    id: "fried-chicken",
    name: "炸鸡",
    category: "consumable",
    rarity: "common",
    desc: "稀缺高热量临期食品，可用于流浪回收商和幸存者营地的交易。",
    maxStack: 5,
    icon: "consumable",
  },
  {
    id: "pizza",
    name: "披萨",
    category: "consumable",
    rarity: "common",
    desc: "组合型临期食品，价值最高但占用较大的交易资源。",
    maxStack: 5,
    icon: "consumable",
  },
];

export const CONSUMABLE_ITEM_DEFS: ItemDef[] = withBuyValue(DEFS);
