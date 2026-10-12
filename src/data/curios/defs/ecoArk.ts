import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";
import { byJob, fail, withItem } from "../rules/helpers";

export const ARK_CURIOS = {
  arkGeneConsole: {
    name: "驮着地图的负图老龟", role: "service", verb: "请教", size: 205,
    description: "方舟最老的住户。龟甲上的纹路记着整座方舟的路线和每一只守卫的去向。可以请它亮出龟甲上的地图，也能喂它一份临期食品，听它讲讲守卫们的老习惯。",
    decisions: [
      { id: "survey", label: "读取龟甲上的路线与威胁", story: "老龟伸了个懒腰，甲纹一格格亮起，拼成一张完整的区域图。",
        effects: [{ type: "REVEAL_MAP", threats: true }] },
      { id: "learn", label: "喂食并聆听往事", foodCost: 1, story: "老龟慢吞吞嚼完食物，讲起守卫们的老习惯，全队获得卡组经验。",
        effects: [{ type: "GAIN_EXP_PARTY", amount: 4 }] },
    ],
  },
  arkSporeVent: {
    name: "一触即喷的鼓囊菇", role: "trap", forced: true, verb: "应对", size: 215,
    description: "房门开启的一瞬间，栽培箱里的鼓囊菇猛地胀大，顶上的气孔对准了小队，随时会把一肚子孢子喷出来。必须先处理这只菇球。",
    decisions: [
      { id: "seal", label: "消耗净化粒子让菇球休眠", story: "净化膜裹住了菇球，气孔慢慢合上，鼓胀的菌球瘪了下去。",
        effects: [{ type: "MODIFY_ENERGY", amount: -5 }] },
      { id: "cross", label: "掩住口鼻迅速通过", story: "小队穿过了黄绿色的孢子雾，每个人都沾上了一点孢子。",
        effects: [{ type: "ADJUST_POLLUTION", target: "party", amount: 4 }] },
      { id: "manual", label: "由执行者砍断菌柄", story: "执行者一刀砍断了菌柄，手臂被喷出的孢子灼出一道浅口。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.05 }],
        failure: fail(0.2, "菌球塌下来的一刻，积在底部的浓缩孢子喷了执行者一脸。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
          byJob("botanist", { convert: { story: "植物学家让孢子提前休眠，还从菌柄下的栽培土里翻出一份旧补给。", effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }] } }),
          withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水让菇球里的孢子失去了活性" })) },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
