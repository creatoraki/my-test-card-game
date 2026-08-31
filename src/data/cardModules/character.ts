// 角色关键词模组 —— 据点装配舱制造产出, 承载角色关键词的跨角色外借。
// 装配限制 = 结构条件 + 「不属于制造者角色」(见《角色关键词模组设计.md》)。

import { hasDamageEffect, type CardModuleDef } from "./types";

export const CHARACTER_CARD_MODULES: CardModuleDef[] = [
  {
    itemId: "rush-module",
    // 剑士是这两个模组的制造者, 自己的卡不能装 —— 见《模组制造》需求。
    canEquip: (def) => def.cardType === "normal" && def.ownerCharId !== "swordsman",
    equipText: "普通牌，且不属于剑士",
    patch: { cardType: "fast" },
  },
  {
    itemId: "discard-module",
    canEquip: (def) => def.cost >= 2 && def.ownerCharId !== "swordsman",
    equipText: "费用 2 及以上，且不属于剑士",
    patch: {},
    appendEffects: [{ type: "DISCARD", amount: 1, discardPick: "handBottom" }],
    textSuffix: "（弃牌模组：使用后弃置手牌最后一张）",
  },
  {
    itemId: "gap-module",
    canEquip: (def) => def.cost >= 2 && def.ownerCharId !== "prophet",
    equipText: "费用 2 及以上，且不属于预言家",
    patch: {},
    costDelta: -1,
    appendEffects: [
      { type: "MARK_CARDS", amount: 1, mark: "heavy", markPick: "handHighestCostRandom" },
    ],
    textSuffix: "（落差模组：费用 -1；使用后随机令手牌中费用最高的牌获得沉重）",
  },
  {
    itemId: "satellite-module",
    canEquip: (def) => def.cost >= 3 && def.ownerCharId !== "prophet",
    equipText: "费用 3 及以上，且不属于预言家",
    patch: {},
    appendEffects: [
      {
        type: "APPLY_STATUS",
        status: "starlight",
        stacks: 1,
        target: "randomAlly",
        targetHasStatus: "starlight",
      },
    ],
    textSuffix: "（卫星模组：使用后随机为已有星辉的我方角色增加 1 层星辉）",
  },
  {
    itemId: "starloan-module",
    canEquip: (def) => def.cost >= 1 && def.ownerCharId !== "prophet",
    equipText: "费用 1 及以上，且不属于预言家",
    patch: {},
    prependEffects: [{ type: "VALUE_BOOST", boostSource: "spendPartyStarlight", boostPct: 20 }],
    textSuffix: "（借星模组：打出时全队各消耗 1 层星辉，每点星辉使本卡数值 +20%）",
  },
  {
    itemId: "aim-module",
    canEquip: (def) =>
      hasDamageEffect(def) &&
      def.ownerCharId !== "botanist" &&
      !def.keywords?.some((keyword) => keyword.id === "aim"),
    equipText: "攻击卡，且不带瞄准词条，也不属于植物学家",
    patch: {},
    prependEffects: [{ type: "VALUE_BOOST", boostSource: "primaryAimed", boostPct: 30 }],
    appendKeywords: [{ id: "aim", effects: [] }],
    textSuffix: "（瞄准模组：附加瞄准；目标已有被瞄准时本卡数值 +30%）",
  },
  {
    itemId: "ripen-module",
    canEquip: (def) => def.ownerCharId !== "botanist",
    equipText: "不属于植物学家",
    patch: {},
    appendEffects: [{ type: "CULTIVATE_TICK", amount: 1 }],
    textSuffix: "（催熟模组：使用后随机使一张带培育的手牌培育层数 -1）",
  },
];
