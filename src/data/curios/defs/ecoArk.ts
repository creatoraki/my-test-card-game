import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";
import { byJob, fail, withItem } from "../rules/helpers";

export const ARK_CURIOS = {
  arkGeneConsole: {
    name: "枝序谱系树", role: "service", verb: "读取", size: 205,
    description: "机械树的每一颗发光果实都存着生态守卫的行动谱系。可以读取巡逻路线，也能消耗一份临期食品为树根供能，学习一段战术。",
    decisions: [
      { id: "survey", label: "读取方舟路线与威胁分布", story: "果实里的定位数据被还原成一张完整的区域图。",
        effects: [{ type: "REVEAL_MAP", threats: true }] },
      { id: "learn", label: "供能并学习战术", foodCost: 1, story: "谱系记录完成了解码，全队获得卡组经验。",
        effects: [{ type: "GAIN_EXP_PARTY", amount: 4 }] },
    ],
  },
  arkSporeVent: {
    name: "疯长的藤蔓格栅", role: "trap", forced: true, verb: "应对", size: 215,
    description: "房门开启的一瞬间，格栅上的藤蔓猛地疯长，把积存的孢子喷向小队。必须先处理这片藤蔓。",
    decisions: [
      { id: "seal", label: "消耗净化粒子让藤蔓休眠", story: "净化膜裹住了整面格栅，藤蔓缩回原处，孢子也不再喷出。",
        effects: [{ type: "MODIFY_ENERGY", amount: -5 }] },
      { id: "cross", label: "掩住口鼻迅速通过", story: "小队穿过了淡绿色的雾，每个人都沾上了一点孢子。",
        effects: [{ type: "ADJUST_POLLUTION", target: "party", amount: 4 }] },
      { id: "manual", label: "由执行者砍断主藤", story: "执行者砍断了最粗的主藤，手臂被带刺的藤条划出一道浅口。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.05 }],
        failure: fail(0.2, "断藤猛地回抽，藏在根部的浓缩孢子喷了执行者一脸。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
          byJob("botanist", { convert: { story: "植物学家让孢子提前休眠，还从藤根下翻出一份旧补给。", effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }] } }),
          withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水让藤蔓上的孢子失去了活性" })) },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
