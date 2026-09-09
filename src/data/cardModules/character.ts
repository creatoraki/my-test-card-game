// 角色关键词模组 —— 据点装配舱制造产出, 承载角色关键词的跨角色外借。
// 装配限制 = 结构条件 + 「不属于制造者角色」(见《角色关键词模组设计.md》)。

import { ASSEMBLE_MODULE_LETTERS, assembleModuleItemId } from "../items/modules";
import { hasDamageEffect, type CardModuleDef } from "./types";

// 炼金术士的组装模组 —— 四件同构, 只差部件字母, 所以用工厂展开而不是抄四遍。
// 费用 +1 是这组模组唯一的稀释器: 组装部件本身没有次数限制, 不加费就是白送三张牌的进度。
const ASSEMBLE_CARD_MODULES: CardModuleDef[] = ASSEMBLE_MODULE_LETTERS.map((letter) => ({
  itemId: assembleModuleItemId(letter),
  canEquip: (def) => def.ownerCharId !== "alchemist",
  equipText: "不属于炼金术士",
  patch: {},
  costDelta: 1,
  appendEffects: [{ type: "GAIN_SQUAD_BUFF", squadBuff: `assemble${letter}`, target: "self" }],
  textSuffix: `（组装模组${letter}：费用 +1；打出后获得组装 ${letter}）`,
}));

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
  ...ASSEMBLE_CARD_MODULES,
  {
    // 急诊模组: 把「目标本回合被打过」这个前置条件借给别的角色 —— 施放者给自己伪造一次受击记录。
    itemId: "emergency-module",
    canEquip: (def) => def.ownerCharId !== "actuary",
    equipText: "不属于精算师",
    patch: {},
    appendEffects: [
      { type: "APPLY_STATUS", status: "feignInjury", stacks: 1, duration: 1, target: "self" },
    ],
    textSuffix: "（急诊模组：打出后自身获得假装受伤，持续 1 回合；期间自身可直接触发急诊）",
  },
  {
    // 回响模组: 回响会把卡牌基础效果原样重放到带回响的队友身上, 所以只能装在指向队友的卡上 ——
    // 装在攻击卡上等于把伤害重放给队友, 那是纯粹的坑。治愈力 -30 是这份重放收益的对价。
    itemId: "echo-module",
    canEquip: (def) =>
      def.targeting === "ally" &&
      def.ownerCharId !== "actuary" &&
      !def.keywords?.some((keyword) => keyword.id === "echo"),
    equipText: "指向队友的卡牌，且不带回响词条，也不属于精算师",
    patch: {},
    prependEffects: [{ type: "PLAY_STAT_BONUS", stat: "healPower", amount: -30 }],
    appendKeywords: [{ id: "echo", effects: [] }],
    textSuffix: "（回响模组：治愈力 -30；附加回响）",
  },
];
