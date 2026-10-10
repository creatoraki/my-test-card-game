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
    name: "倒涌的逆流樱泉",
    role: "heal",
    verb: "取水",
    size: 205,
    description: "泉水不往下落，而是夹着樱花瓣螺旋着向上流，托起一颗装着小樱树的水球。重力失常的泉水味道变化不定，喝下去可能疗伤、净化、补充粒子或修复体力极限。",
    decisions: [
      {
        id: "treat",
        label: "掬一捧逆流的泉水",
        story: "泉水顺着指缝往上爬，你们赶在它飘走前喝下，两种不同的药效在体内化开。",
        effects: [roll(2, RECOVERY_OPTIONS)],
        failure: fail(
          0.3,
          "一股逆流猛地冲进鼻腔，执行者呛得眼前发黑。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("botanist", { chanceDelta: -0.3, note: "植物学家认出了花瓣的走向，只取了水流平稳的那一段" }),
          withItem({ relicPolarity: "curse" }, {
            convert: {
              story: "逆流卷着诅咒遗物冲进水球，小樱树把其中的负面成分吸收殆尽，泉底浮起两份可以继续使用的应急物资。",
              effects: [
                { type: "GAIN_ITEM", itemId: "medical-kit-c" },
                { type: "GAIN_ITEM", itemId: "holy-water-c" },
              ],
            },
            note: "一件诅咒遗物被逆流樱泉吸收了",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给池沿上的护理甲虫",
        "护理甲虫吃饱后潜进池底，把三股味道不同的水流同时引了上来。",
        "beetle",
        2,
        [roll(3, RECOVERY_OPTIONS)],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
