import { byJob, fail, feedDecision, roll, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef, CurioEffect } from "../types";

// 恢复类：4 个候选效果，交互时不重复抽 2 条；喂养小生物改为抽 3 条且必定成功。
// 单人效果直接作用于执行者。

const RECOVERY_OPTIONS: CurioEffect[] = [
  { type: "HEAL_ONE", percent: 0.3 },
  { type: "ADJUST_POLLUTION", target: "party", amount: -8 },
  { type: "MODIFY_ENERGY", amount: 12 },
  { type: "HEAL_LIMIT_ONE", percent: 0.3 },
];

export const SUPPLY_CURIOS = {
  medical: {
    name: "药剂调配台",
    role: "heal",
    verb: "调药",
    size: 205,
    description: "调配台上的药瓶和茶壶还在冒着热气，但配药的天平已经失准，调出来的药剂可能疗伤、净化、补充粒子或修复体力极限。",
    decisions: [
      {
        id: "treat",
        label: "调配药剂",
        story: "药液在瓶里沉淀完毕，两剂药效不同的药剂已经调好。",
        effects: [roll(2, RECOVERY_OPTIONS)],
        failure: fail(
          0.3,
          "失准的天平配错了药量，执行者被过烈的药性灼得一阵刺痛。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("botanist", { chanceDelta: -0.3, note: "植物学家亲手校准了药材配比" }),
          withItem({ relicPolarity: "curse" }, {
            convert: {
              story: "调配台把诅咒遗物中的负面成分萃取出来，留下两种可以继续使用的应急物资。",
              effects: [
                { type: "GAIN_ITEM", itemId: "medical-kit-c" },
                { type: "GAIN_ITEM", itemId: "holy-water-c" },
              ],
            },
            note: "一件诅咒遗物被调配台吸收了",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给药架上的护理甲虫",
        "护理甲虫吃饱后爬满了整排药瓶，药液同时蒸腾成三种药雾。",
        "beetle",
        2,
        [roll(3, RECOVERY_OPTIONS)],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
