import { critterRecipe, exactItem, jobDecision, offeringDecision } from "./helpers";
import type { CurioDef } from "./types";

export const CRAFT_CURIOS: Record<string, CurioDef> = {
  modBench: {
    name: "街边改装台",
    verb: "改装",
    size: 205,
    description: "改装台的工具仍然锋利，但台面上只留着两种可识别的加工协议。",
    decisions: [
      {
        id: "salvage",
        label: "取下台面零件",
        story: "改装台的机械臂突然夹紧，行动者只能在受伤前抢下一份通用材料。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.06 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
      },
      offeringDecision(
        "breadModule",
        "投放两份面包",
        "面包的热量让改装台重新点亮，机械臂从夹层中推出一枚随机模组。",
        critterRecipe("beetle", 2).filter((recipe) => recipe[0].match.itemIds?.[0] === "bread"),
        [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      ),
      offeringDecision(
        "fuseEquipment",
        "投放三件装备",
        "三件装备被依次锁进改装台，熔炉开始把它们压缩成一件更高阶的装备。",
        [[{ match: { category: "equipment" }, count: 3 }]],
        [{ type: "FUSE_EQUIPMENT" }],
      ),
    ],
  },
  cardPrinter: {
    name: "卡牌打印终端",
    verb: "接入",
    size: 210,
    description: "打印终端的墨盒已经干涸，只有一根霓虹灯管能重新接通它的普通卡牌模板。",
    decisions: [
      {
        id: "printTainted",
        label: "尝试打印",
        story: "终端勉强打印出一套卡牌模板，但它把污染也一并写入了其中。",
        effects: [{ type: "FORGE_DRAW_TAINTED", contaminate: 1 }],
      },
      offeringDecision(
        "replaceCommon",
        "投放霓虹灯管",
        "霓虹灯管补足了打印终端的显色频段，可以将一张卡替换成普通模板。",
        exactItem("neon-tube", 1).map((part) => [part]),
        [{ type: "REPLACE_CARD_COMMON" }],
      ),
    ],
  },
  shrine: {
    name: "路边神龛",
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
      },
      offeringDecision(
        "tradeRelic",
        "投放祝福遗物",
        "神龛回应了遗物的光芒，远处更高阶的祝福正在向这里靠近。",
        [[{ match: { relicPolarity: "blessing" }, count: 1 }]],
        [{ type: "UPGRADE_RELIC" }],
      ),
      jobDecision(
        "prophet",
        "让预言家聆听神谕",
        "预言家听见神龛背后的城市脉搏，完整地图和所有战斗位置被同时揭示。",
        "prophet",
        [
          { type: "ADJUST_POLLUTION", target: "actor", amount: 20 },
          { type: "REVEAL_MAP", threats: true },
        ],
      ),
    ],
  },
};
