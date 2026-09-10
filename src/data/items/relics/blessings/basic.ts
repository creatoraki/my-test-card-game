import type { ItemDef, RelicSpec } from "../../../../items/types";

const blessing = (
  id: string,
  name: string,
  desc: string,
  relic: Omit<RelicSpec, "polarity">,
): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity: "common",
  desc,
  maxStack: 1,
  relic: { polarity: "blessing", ...relic },
});

export const BASIC_BLESSING_RELIC_DEFS: ItemDef[] = [
  blessing("relic-warm-match", "余温火柴", "当手牌只剩一张卡牌时，该卡的攻击力与治愈力 +30。", { scope: "battle" }),
  blessing("relic-lucky-copper", "幸运铜币", "战斗胜利时有 20% 几率额外掉落一枚值钱的铜币。", { scope: "explore" }),
  blessing("relic-whetstone", "磨刀石", "每回合第一张攻击卡造成的实际伤害 +3。", { scope: "battle" }),
  blessing(
    "relic-hunter-eye",
    "猎人的独眼",
    "战斗开始时随机标记一名敌人，持续 1 回合；该敌人受到的伤害 +20%。",
    { scope: "battle" },
  ),
  blessing(
    "relic-energy-crystal",
    "储能水晶",
    "回合结束时若仍有未使用的行动点，下回合第一张卡牌的攻击力与治愈力 +40。",
    { scope: "battle" },
  ),
  blessing("relic-pendulum", "钟摆", "每当洗牌时，额外抽 1 张牌。", { scope: "battle" }),
  blessing("relic-compressed-biscuit", "压缩饼干", "进入空白事件时，全队回复 5 点生命。", { scope: "explore" }),
  blessing("relic-sport-shoes", "运动鞋", "全队先手 +1。", { scope: "battle", mods: { flat: { initiative: 1 } } }),
  blessing("relic-dried-herb", "干燥药草", "战斗结束时，所有存活角色恢复 1 点体力极限。", { scope: "explore" }),
  blessing("relic-lucky-button", "幸运纽扣", "每场战斗第一次造成暴击后，抽 1 张牌。", { scope: "battle" }),
  blessing(
    "relic-magnet-charm",
    "磁化护符",
    "每场战斗抽到的第一张被动牌可以多持有 1 回合。",
    { scope: "battle" },
  ),
  blessing("relic-black-iron-nail", "黑铁钉", "攻击拥有减益的敌人时，额外造成 3 点伤害。", { scope: "battle" }),
  blessing("relic-heat-stone", "蓄热石", "若本回合未受到伤害，下回合第一张卡牌的攻击力与治愈力 +40。", { scope: "battle" }),
];
