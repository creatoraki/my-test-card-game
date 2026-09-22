import { critterRecipe, exactItem, jobDecision, offeringDecision } from "./helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "./types";

export const SUPPLY_CURIOS = {
  medical: {
    name: "应急医疗柜",
    role: "heal",
    verb: "检查",
    size: 205,
    description: "医疗柜的急救灯还亮着，但内部的自动诊断程序已经无法判断谁更需要治疗。",
    decisions: [
      {
        id: "takeSugar",
        label: "取出糖块",
        story: "你们打开备用营养匣，里面还留着一块没有受潮的糖块。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }] },
        effects: [{ type: "GAIN_ITEM", itemId: "sugar-cube-c" }],
      },
      offeringDecision(
        "milkCare",
        "投放两份牛奶",
        "牛奶的营养条码通过医疗柜核验，整排治疗舱同时启动。",
        critterRecipe("beetle", 2).filter((recipe) => recipe[0].match.itemIds?.[0] === "milk"),
        [{ type: "HEAL_PARTY", percent: 0.4 }, { type: "ADJUST_POLLUTION", target: "party", amount: -15 }],
      ),
      offeringDecision(
        "curseCare",
        "投放诅咒遗物",
        "医疗柜把遗物中的负面频段抽离，留下两种可以继续使用的应急物资。",
        [[{ match: { relicPolarity: "curse" }, count: 1 }]],
        [{ type: "GAIN_ITEM", itemId: "medical-kit-c" }, { type: "GAIN_ITEM", itemId: "holy-water-c" }],
      ),
    ],
  },
  sink: {
    name: "净水槽",
    role: "heal",
    verb: "取水",
    size: 210,
    description: "净水槽的循环泵还在工作，浑浊水面下藏着一层不稳定的净化膜。",
    decisions: [
      {
        id: "drink",
        label: "直接饮用",
        story: "净水流过过滤膜时发出刺耳的蜂鸣，行动者勉强压下了体内的污染。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }] },
        effects: [{ type: "ADJUST_POLLUTION", target: "actor", amount: -8 }],
      },
      offeringDecision(
        "milkPurify",
        "投放两份牛奶",
        "牛奶替净水槽补足了有机滤芯，整条管线的污染被一并冲散。",
        critterRecipe("beetle", 2).filter((recipe) => recipe[0].match.itemIds?.[0] === "milk"),
        [{ type: "ADJUST_POLLUTION", target: "party", amount: -15 }],
      ),
      jobDecision(
        "alchemist",
        "让炼金术士重配滤芯",
        "炼金术士把滤芯残液重新配成两瓶圣水，但自身也吸收了不稳定的反应物。",
        "alchemist",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }, { type: "GAIN_ITEM", itemId: "holy-water-c", count: 2 }],
      ),
    ],
  },
  repairPod: {
    name: "修复舱",
    role: "heal",
    verb: "校准",
    size: 215,
    description: "修复舱的机械臂停在半空，看来它只接受一份完整的医疗组件和传动零件。",
    decisions: [
      {
        id: "forceRepair",
        label: "尝试启动",
        story: "修复舱拒绝执行完整程序，只能把一小段治疗脉冲打向队伍。",
        risk: { chance: 0.5, effects: [{ type: "MODIFY_ENERGY", amount: -4 }] },
        effects: [{ type: "HEAL_ONE", percent: 0.25 }],
      },
      offeringDecision(
        "fullRepair",
        "投放医疗包和齿轮",
        "医疗包与齿轮同时嵌入接口，修复舱锁定了一名队员的体力极限。",
        [[{ match: { familyId: "medical-kit" }, count: 1 }, { match: { itemIds: ["standard-gear"] }, count: 1 }]],
        [{ type: "HEAL_LIMIT_ONE", percent: 0.5 }],
      ),
    ],
  },
  energyStation: {
    name: "粒子净化站",
    role: "heal",
    verb: "充能",
    size: 215,
    description: "净化站的储能罐里还残留着一层稳定的净化粒子，只是泄压阀已经锈死。",
    decisions: [
      {
        id: "forceCharge",
        label: "强行充能",
        story: "你们撬开泄压阀，一股粒子流灌进队伍的净化装置。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }] },
        effects: [{ type: "MODIFY_ENERGY", amount: 12 }],
      },
      offeringDecision(
        "colaCharge",
        "投放两份可乐",
        "可乐里的糖分被净化站当作临时燃料，储能罐稳定地吐出一整轮粒子。",
        [exactItem("cola", 2)],
        [{ type: "MODIFY_ENERGY", amount: 25 }],
      ),
      jobDecision(
        "alchemistCharge",
        "让炼金术士重配粒子",
        "炼金术士把残留粒子重新提纯，顺手滤掉了队伍身上的一部分污染。",
        "alchemist",
        [{ type: "MODIFY_ENERGY", amount: 18 }, { type: "ADJUST_POLLUTION", target: "party", amount: -5 }],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
