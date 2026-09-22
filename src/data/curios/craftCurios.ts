import { critterRecipe, jobDecision, offeringDecision } from "./helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "./types";
import { GROWTH_BALANCE } from "./growthBalance";

export const CRAFT_CURIOS = {
  modBench: {
    name: "街边改装台",
    role: "loot",
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
} satisfies Partial<Record<CurioKind, CurioDef>>;
