import type { ItemDef, ItemRarity } from "../../items/types";
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

const QUALITY_ORDER: ItemRarity[] = ["common", "fine", "rare", "epic", "legendary"];

// ★ 与装备/材料同样过一遍 withBuyValue —— 消耗品与临期食品要在出击准备的「货柜」里卖,
//   没有 buyValue 就没法标价也没法扣钱(货柜清单见 data/sortieStock.ts)。
const DEFS: ItemDef[] = [
  ...QUALITY_ORDER.map((rarity) =>
    pendingConsumable(
      `sugar-cube-${QUALITY_SUFFIX[rarity]}`,
      "糖块",
      "sugar-cube",
      rarity,
      "回复一名存活角色当前生命",
    ),
  ),
  ...QUALITY_ORDER.map((rarity) =>
    pendingConsumable(
      `medical-kit-${QUALITY_SUFFIX[rarity]}`,
      "医疗包",
      "medical-kit",
      rarity,
      "修复一名角色的体力极限损伤",
    ),
  ),
  ...QUALITY_ORDER.map((rarity) =>
    pendingConsumable(
      `holy-water-${QUALITY_SUFFIX[rarity]}`,
      "圣水",
      "holy-water",
      rarity,
      "降低一名角色的污染值",
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
