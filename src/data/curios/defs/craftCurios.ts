import { byJob, fail } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const CRAFT_CURIOS = {
  modBench: {
    name: "无主的拼甲人台",
    role: "service",
    verb: "缝合",
    size: 205,
    description: "裁缝不在，人台上那件拼起来的护甲还差最后几针。挑三件装备挂上人台，发光的缝线会把它们最好的部分缝成一件新的装备。",
    decisions: [
      {
        id: "fuseEquipment",
        label: "选择三件装备挂上人台",
        story: "发光的缝线自己穿过三件装备，一针一针收紧，三件装备被缝成了一件更高阶的装备。",
        select: [[{ match: { category: "equipment" }, count: 3 }]],
        effects: [{ type: "FUSE_EQUIPMENT" }],
      },
    ],
  },
  shrine: {
    name: "饥饿的食秽貘龛",
    role: "service",
    verb: "供奉",
    size: 190,
    description: "象牙白的石貘蹲在石台上，长鼻卷着一只封满秽气的玻璃罐。传说它以污染为食：往供奉钵里放一枚铜币，它会替小队吸走身上的秽气；献上祝福遗物，背上的铃铛会把祝福敲得更响。",
    decisions: [
      {
        id: "pray",
        label: "往供奉钵里放一枚铜币",
        story: "铜币落进石钵，石貘仰起长鼻深深一吸，队伍身上的秽气被吸进了罐里。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "ADJUST_POLLUTION", target: "party", amount: -8 },
        ],
        failure: fail(
          0.3,
          "石貘吸得太急，罐口一歪，一缕秽气倒灌回执行者身上。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
          byJob("prophet", {
            convert: {
              story: "秽气倒灌的一刻，预言家在石貘的梦里看见了整座城市，完整地图和所有战斗与陷阱位置被同时揭示。",
              effects: [{ type: "REVEAL_MAP", threats: true }],
            },
          }),
        ),
      },
      {
        id: "tradeRelic",
        label: "选择祝福遗物挂上铃架",
        story: "遗物挂上钟架，祝福铃自己响了起来，更高阶的祝福正循着铃声靠近。",
        select: [[{ match: { relicPolarity: "blessing" }, count: 1 }]],
        effects: [{ type: "UPGRADE_RELIC" }],
      },
    ],
  },
  fortuneFox: {
    name: "叼牌的三尾灵狐",
    role: "service",
    verb: "求牌",
    size: 205,
    description: "朱漆台上的三尾狐叼着一张牌，摊开的牌阵等人来抽。奉上 2 份临期食品当供品，它会从牌阵里叼出三张，让小队挑走一张。",
    decisions: [
      {
        id: "offerFood",
        label: "奉上供品求牌",
        foodCost: 2,
        story: "灵狐吃完供品，摇着三条尾巴从牌阵里叼出三张牌。",
        effects: [{ type: "FORGE_DRAW_TAINTED", contaminate: 0 }],
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
