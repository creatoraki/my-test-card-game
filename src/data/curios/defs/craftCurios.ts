import { byJob, fail } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const CRAFT_CURIOS = {
  modBench: {
    name: "合成实验台",
    role: "service",
    verb: "熔合",
    size: 205,
    description: "实验台上的合成釜仍在低声运转，台下的晶石箱还在发光，可以把三件装备熔合成一件。",
    decisions: [
      {
        id: "fuseEquipment",
        label: "选择三件装备熔合",
        story: "三件装备被依次投进合成釜，釜中的光开始把它们熔合成一件更高阶的装备。",
        select: [[{ match: { category: "equipment" }, count: 3 }]],
        effects: [{ type: "FUSE_EQUIPMENT" }],
      },
    ],
  },
  shrine: {
    name: "全息神龛",
    role: "service",
    verb: "祈愿",
    size: 190,
    description: "神龛里的全息圣像垂着双手，供台上的青色烛火仍在燃烧。它接受遗物，也接受一枚最普通的硬币作为回应。",
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
        story: "圣像抬起双手回应了遗物的光芒，远处更高阶的祝福正在向这里靠近。",
        select: [[{ match: { relicPolarity: "blessing" }, count: 1 }]],
        effects: [{ type: "UPGRADE_RELIC" }],
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
