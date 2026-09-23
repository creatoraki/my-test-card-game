import type { ItemDef, RelicSpec } from "@/items/types";

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
  blessing("relic-lucky-copper", "幸运铜币", "战斗胜利时有 20% 几率额外掉落一枚铜币。", { scope: "explore" }),
  blessing("relic-whetstone", "磨刀石", "每回合第一张攻击卡造成的实际伤害 +3。", { scope: "battle" }),
  blessing("relic-hunter-eye", "猎人的独眼", "每回合开始时，随机对一名敌人附加 1 层穿孔。", { scope: "battle" }),
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
  blessing("relic-gap-comb", "缺齿梳", "战斗开局手牌数 −1，之后每回合抽牌数 +1。", {
    scope: "battle",
    squadMods: { openingHand: -1, drawCount: 1 },
  }),
  blessing("relic-tin-whistle", "锡制哨子", "战斗开始时，为当前生命最高的队员施加 1 拍嘲讽。", { scope: "battle" }),
  blessing("relic-stopwatch", "秒表", "每场战斗累计待机两次后，全队获得 1 层锋利，持续 2 拍。", { scope: "battle" }),
  blessing("relic-recycle-list", "回收清单", "废料带回据点的出售价 +10%。", { scope: "explore" }),
  blessing("relic-expiry-labeler", "临期标签机", "流浪货商额外出售 2 件商品。", { scope: "explore" }),
  blessing("relic-wormwood-drops", "苦艾滴剂", "对没有任何减益的敌人施加中毒/灼烧时，额外施加 3 层。", { scope: "battle" }),
  blessing("relic-emergency-ration", "应急口粮", "每探索 3 个全新房间，全队回复 3 点生命。", { scope: "explore" }),
  blessing("relic-particle-clip", "粒子回收夹", "清空一间房间内的所有可交互物后，返还 2 点净化粒子。", { scope: "explore" }),
  blessing("relic-glow-sticker", "夜光贴纸", "开战时背包每有 3 格空位，全队闪避率 +1%（最高 +8%）。", { scope: "battle" }),
  blessing("relic-small-battery", "小号电池", "每场战斗中，首次打出费用 ≥ 3 的卡牌后，返还 1 点行动点。", { scope: "battle" }),
  blessing(
    "relic-gauze-roll",
    "纱布卷",
    "对体力低于体力极限的目标治疗时，溢出的治疗量转为等量护盾（最多 4 点）。",
    { scope: "battle" },
  ),
  blessing("relic-tally-counter", "计数器", "本场战斗每打出 6 张牌，对随机一名敌人造成 8 点伤害。", { scope: "battle" }),
  blessing("relic-dust-mask", "防尘口罩", "每次野餐时，全队污染 −5。", { scope: "explore" }),
  blessing("relic-thermos", "保温杯", "每次野餐时，全队额外回复 8 点生命。", { scope: "explore" }),
];
