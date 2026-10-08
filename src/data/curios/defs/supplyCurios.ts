import { byJob, fail, feedDecision, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const SUPPLY_CURIOS = {
  medical: {
    name: "萤露调药台",
    role: "heal",
    verb: "调药",
    size: 205,
    description: "调药台上的萤露仍在发光，但配药的天平已经失准，无法判断谁更需要治疗。",
    decisions: [
      {
        id: "treat",
        label: "调配药剂",
        story: "萤露在药瓶里沉淀完毕，一剂治疗药已经调好。",
        effects: [{ type: "HEAL_ONE", percent: 0.3 }],
        failure: fail(
          0.35,
          "失准的天平配错了药量，执行者被过烈的药性灼得一阵刺痛。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("botanist", { chanceDelta: -0.35, note: "植物学家亲手校准了药材配比" }),
          withItem({ relicPolarity: "curse" }, {
            convert: {
              story: "调药台把诅咒遗物中的负面成分萃取出来，留下两种可以继续使用的应急物资。",
              effects: [
                { type: "GAIN_ITEM", itemId: "medical-kit-c" },
                { type: "GAIN_ITEM", itemId: "holy-water-c" },
              ],
            },
            note: "一件诅咒遗物被调药台吸收了",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给药台里的护理甲虫",
        "护理甲虫吃饱后爬满了整排药瓶，萤露同时蒸腾成治疗药雾。",
        "beetle",
        2,
        [{ type: "HEAL_PARTY", percent: 0.4 }, { type: "ADJUST_POLLUTION", target: "party", amount: -15 }],
      ),
    ],
  },
  sink: {
    name: "蔷薇焙茶台",
    role: "heal",
    verb: "饮茶",
    size: 210,
    description: "焙茶台的琉璃壶还在咕嘟作响，蔷薇茶汤下浮着一层不稳定的净化膜。",
    decisions: [{
      id: "drink",
      label: "饮下茶汤",
      story: "茶汤滤过净化膜，执行者体内的污染被压下去一截。",
      effects: [{ type: "ADJUST_POLLUTION", target: "actor", amount: -12 }],
      failure: fail(
        0.4,
        "琉璃壶发出刺耳的鸣响后炸裂，滚烫的茶汤呛得执行者一阵剧咳。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
        byJob("alchemist", {
          convert: {
            story: "琉璃壶炸裂的瞬间，炼金术士接住了残余的茶汤，重新配成了两瓶圣水。",
            effects: [{ type: "GAIN_ITEM", itemId: "holy-water-c", count: 2 }],
          },
        }),
        withItem("milk", {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "ADJUST_POLLUTION", target: "party", amount: -8 }],
          note: "牛奶调成了一壶蔷薇奶茶，全队身上的污染被一并冲散",
        }),
      ),
    }],
  },
  repairPod: {
    name: "萤露疗伤台",
    role: "heal",
    verb: "研磨",
    size: 215,
    description: "疗伤台的萤露研磨器卡在半圈，看来它只认得完整的医疗组件和传动零件。",
    decisions: [{
      id: "repair",
      label: "敷上萤露药膏",
      story: "萤露研磨完成，治疗药膏正在等待指定对象。",
      effects: [{ type: "HEAL_ONE", percent: 0.25 }],
      failure: fail(
        0.4,
        "研磨器空转了一整圈，反而抽走了一部分净化粒子维持萤露的光芒。",
        [{ type: "MODIFY_ENERGY", amount: -4 }],
        withItem({ familyId: "medical-kit" }, {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "HEAL_LIMIT_ONE", percent: 0.3 }],
          note: "医疗包里的绷带配上萤露药膏，额外修复了体力极限",
        }),
        withItem("standard-gear", { chanceDelta: -0.2, note: "一枚齿轮补上了研磨器卡死的传动轴" }),
      ),
    }],
  },
  energyStation: {
    name: "雷萤充能座",
    role: "heal",
    verb: "充能",
    size: 215,
    description: "充能座的晶石里还蓄着一层稳定的净化粒子，只是导流阀已经锈死。",
    decisions: [
      {
        id: "forceCharge",
        label: "强行充能",
        story: "你们撬开导流阀，一股粒子流灌进队伍的净化装置。",
        effects: [{ type: "MODIFY_ENERGY", amount: 12 }],
        failure: fail(
          0.4,
          "锈死的导流阀猛地崩开，执行者被晶石迸出的雷光灼伤。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
          byJob("alchemist", {
            chanceDelta: -0.4,
            bonusEffects: [{ type: "MODIFY_ENERGY", amount: 6 }, { type: "ADJUST_POLLUTION", target: "party", amount: -5 }],
            note: "炼金术士把残留粒子重新提纯，顺手滤掉了队伍身上的一部分污染",
          }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给晶座边的清扫虫",
        "清扫虫把糖分当作燃料送进晶座，充能座稳定地吐出一整轮粒子。",
        "cleaner",
        2,
        [{ type: "MODIFY_ENERGY", amount: 25 }],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
