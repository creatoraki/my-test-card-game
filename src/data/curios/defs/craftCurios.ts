import { byJob, fail, feedDecision } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const CRAFT_CURIOS = {
  modBench: {
    name: "赤铜锻造台",
    role: "loot",
    verb: "锻造",
    size: 205,
    description: "锻造台的炉火仍在低声燃烧，铁砧旁留着还能用的零件，也能把三件装备熔铸成一件。",
    decisions: [
      {
        id: "salvage",
        label: "取下铁砧旁的零件",
        story: "执行者赶在风箱拉杆回弹前，抢下了铁砧旁的零件。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
        failure: fail(
          0.4,
          "挂在工具壁上的铁钳突然滑落，执行者的手被夹出一道血痕。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("swordsman", {
            chanceDelta: -0.25,
            bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
            note: "剑士卡住了风箱拉杆，多拆下一份零件",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给工具壁里的甲虫",
        "甲虫吃饱后钻进工具壁的夹层，把一枚随机模组推了出来。",
        "beetle",
        2,
        [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      ),
      {
        id: "fuseEquipment",
        label: "选择三件装备熔合",
        story: "三件装备被依次投进炉膛，炉火开始把它们熔铸成一件更高阶的装备。",
        select: [[{ match: { category: "equipment" }, count: 3 }]],
        effects: [{ type: "FUSE_EQUIPMENT" }],
      },
    ],
  },
  shrine: {
    name: "潮汐祈愿门",
    role: "service",
    verb: "祈愿",
    size: 190,
    description: "珊瑚拱门里的潮水从未退去。它接受遗物，也接受一枚最普通的硬币作为回应。",
    decisions: [
      {
        id: "pray",
        label: "触碰潮水",
        story: "潮水短暂地漫过队伍的脚踝，祈愿门只从口袋里取走了一枚铜币。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "ADJUST_POLLUTION", target: "party", amount: -8 },
        ],
        failure: fail(
          0.3,
          "潮水忽然转成暗红，一股阴冷顺着执行者的手臂爬了上来。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
          byJob("prophet", {
            convert: {
              story: "潮水变色的一刻，预言家听见了拱门背后的潮汐脉搏，完整地图和所有战斗与陷阱位置被同时揭示。",
              effects: [{ type: "REVEAL_MAP", threats: true }],
            },
          }),
        ),
      },
      {
        id: "tradeRelic",
        label: "选择祝福遗物献上",
        story: "祈愿门回应了遗物的光芒，更高阶的祝福正随潮水向这里靠近。",
        select: [[{ match: { relicPolarity: "blessing" }, count: 1 }]],
        effects: [{ type: "UPGRADE_RELIC" }],
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
