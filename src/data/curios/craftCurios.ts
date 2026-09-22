import { byJob, fail, feedDecision } from "./helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "./types";
import { GROWTH_BALANCE } from "./growthBalance";

export const CRAFT_CURIOS = {
  modBench: {
    name: "街边改装台",
    role: "loot",
    verb: "改装",
    size: 205,
    description: "改装台的工具仍然锋利，台面上还留着可识别的加工协议，也能把三件装备熔成一件。",
    decisions: [
      {
        id: "salvage",
        label: "取下台面零件",
        story: "执行者赶在机械臂复位前，抢下了台面上的零件。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
        failure: fail(
          0.4,
          "改装台的机械臂突然夹紧，执行者的手被夹出一道血痕。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("swordsman", {
            chanceDelta: -0.25,
            bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
            note: "剑士卡住了机械臂的关节，多拆下一份零件",
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给工具槽里的甲虫",
        "甲虫吃饱后钻进夹层，把一枚随机模组推了出来。",
        "beetle",
        2,
        [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      ),
      {
        id: "fuseEquipment",
        label: "选择三件装备熔合",
        story: "三件装备被依次锁进改装台，熔炉开始把它们压缩成一件更高阶的装备。",
        select: [[{ match: { category: "equipment" }, count: 3 }]],
        effects: [{ type: "FUSE_EQUIPMENT" }],
      },
    ],
  },
  cardPrinter: {
    name: "卡牌打印终端",
    role: "loot",
    verb: "接入",
    size: 210,
    description: "终端已经恢复常规打印协议。支付任意临期食品一份，就能获得一次无污染的角色卡牌三选一。",
    decisions: [
      {
        id: "print",
        label: "抽取卡牌（任意食品 ×1）",
        foodCost: GROWTH_BALANCE.drawFood,
        story: "终端收下食品并开启稳定模板，一次无污染抽卡机会已就绪。",
        effects: [{ type: "FORGE_DRAW" }],
      },
    ],
  },
  shrine: {
    name: "路边神龛",
    role: "service",
    verb: "祈愿",
    size: 190,
    description: "神龛里的电子烛火仍在燃烧。它接受遗物，也接受一枚最普通的硬币作为回应。",
    decisions: [
      {
        id: "pray",
        label: "触碰烛火",
        story: "烛火短暂地照亮了队伍，神龛只从口袋里取走了一枚铜币。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "ADJUST_POLLUTION", target: "party", amount: -8 },
        ],
        failure: fail(
          0.3,
          "烛火忽然转成暗红，一股阴冷顺着执行者的手臂爬了上来。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
          byJob("prophet", {
            convert: {
              story: "烛火变色的一刻，预言家听见了神龛背后的城市脉搏，完整地图和所有战斗与陷阱位置被同时揭示。",
              effects: [{ type: "REVEAL_MAP", threats: true }],
            },
          }),
        ),
      },
      {
        id: "tradeRelic",
        label: "选择祝福遗物献上",
        story: "神龛回应了遗物的光芒，远处更高阶的祝福正在向这里靠近。",
        select: [[{ match: { relicPolarity: "blessing" }, count: 1 }]],
        effects: [{ type: "UPGRADE_RELIC" }],
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
