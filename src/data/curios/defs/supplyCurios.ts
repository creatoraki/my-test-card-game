import { byJob, fail, feedDecision, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const SUPPLY_CURIOS = {
  medical: {
    name: "应急医疗柜",
    role: "heal",
    verb: "检查",
    size: 205,
    description: "医疗柜的急救灯还亮着，但内部的自动诊断程序已经无法判断谁更需要治疗。",
    decisions: [
      {
        id: "treat",
        label: "启动急救程序",
        story: "急救臂完成了自检，一段治疗脉冲已经就绪。",
        effects: [{ type: "HEAL_ONE", percent: 0.3 }],
        failure: fail(
          0.35,
          "诊断程序误判了伤情，急救臂的针头扎偏了位置。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("botanist", { chanceDelta: -0.35, note: "植物学家手动校准了诊断参数" }),
          withItem({ relicPolarity: "curse" }, {
            convert: {
              story: "医疗柜把诅咒遗物中的负面频段抽离，留下两种可以继续使用的应急物资。",
              effects: [
                { type: "GAIN_ITEM", itemId: "medical-kit-c" },
                { type: "GAIN_ITEM", itemId: "holy-water-c" },
              ],
            },
            note: "一件诅咒遗物被医疗柜吸收了",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给柜里的护理甲虫",
        "护理甲虫吃饱后爬满了整排治疗舱，治疗舱同时启动。",
        "beetle",
        2,
        [{ type: "HEAL_PARTY", percent: 0.4 }, { type: "ADJUST_POLLUTION", target: "party", amount: -15 }],
      ),
    ],
  },
  sink: {
    name: "净水槽",
    role: "heal",
    verb: "取水",
    size: 210,
    description: "净水槽的循环泵还在工作，浑浊水面下藏着一层不稳定的净化膜。",
    decisions: [{
      id: "drink",
      label: "直接饮用",
      story: "净水流过过滤膜，执行者体内的污染被压下去一截。",
      effects: [{ type: "ADJUST_POLLUTION", target: "actor", amount: -12 }],
      failure: fail(
        0.4,
        "过滤膜发出刺耳的蜂鸣后破裂，浑水呛得执行者一阵剧咳。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
        byJob("alchemist", {
          convert: {
            story: "过滤膜破裂的瞬间，炼金术士把滤芯残液接住，重新配成了两瓶圣水。",
            effects: [{ type: "GAIN_ITEM", itemId: "holy-water-c", count: 2 }],
          },
        }),
        withItem("milk", {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "ADJUST_POLLUTION", target: "party", amount: -8 }],
          note: "牛奶替净水槽补足了有机滤芯，整条管线的污染被一并冲散",
        }),
      ),
    }],
  },
  repairPod: {
    name: "修复舱",
    role: "heal",
    verb: "校准",
    size: 215,
    description: "修复舱的机械臂停在半空，看来它只认得完整的医疗组件和传动零件。",
    decisions: [{
      id: "repair",
      label: "躺进修复舱",
      story: "修复舱完成了预热，治疗程序正在等待指定对象。",
      effects: [{ type: "HEAL_ONE", percent: 0.25 }],
      failure: fail(
        0.4,
        "修复舱拒绝执行完整程序，反而抽走了一部分净化粒子维持运转。",
        [{ type: "MODIFY_ENERGY", amount: -4 }],
        withItem({ familyId: "medical-kit" }, {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "HEAL_LIMIT_ONE", percent: 0.3 }],
          note: "医疗包嵌入接口，修复舱额外开放了体力极限修复",
        }),
        withItem("standard-gear", { chanceDelta: -0.2, note: "一枚齿轮补上了卡死的传动轴" }),
      ),
    }],
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
        effects: [{ type: "MODIFY_ENERGY", amount: 12 }],
        failure: fail(
          0.4,
          "锈死的泄压阀猛地崩开，执行者被高压粒子流灼伤。",
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
        "喂给储能罐边的清扫虫",
        "清扫虫把糖分当作燃料送进储能罐，净化站稳定地吐出一整轮粒子。",
        "cleaner",
        2,
        [{ type: "MODIFY_ENERGY", amount: 25 }],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
