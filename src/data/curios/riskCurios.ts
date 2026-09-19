import type { CurioDef } from "./types";

/** 风险房物件：进房立即触发，必须在几个轻度代价之间做出取舍。美术复用已有交互物素材。 */
export const RISK_CURIOS: Record<string, CurioDef> = {
  collapsedCeiling: {
    name: "坍塌的天花板",
    role: "risk",
    forced: true,
    verb: "应对",
    size: 220,
    description: "刚踏进房间，头顶的天花板就开始成片剥落，碎块正朝队伍砸下来。",
    decisions: [
      {
        id: "brace",
        label: "全队硬扛",
        story: "队伍护住要害硬扛过这一阵落石，每个人都挂了点彩。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }],
      },
      {
        id: "shield",
        label: "由一人顶住碎块",
        story: "一名队员顶住了最大的碎块，碎块里还卡着一些散落的硬币。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 },
          { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
        ],
      },
      {
        id: "barrier",
        label: "消耗粒子撑起屏障",
        story: "净化粒子在头顶展开一层屏障，碎块全部被弹开。",
        effects: [{ type: "MODIFY_ENERGY", amount: -6 }],
      },
    ],
  },
  leakingPipe: {
    name: "泄漏的污染管道",
    role: "risk",
    forced: true,
    verb: "应对",
    size: 210,
    description: "管道在队伍进门的瞬间爆裂，灰绿色的污染雾正迅速灌满房间。",
    decisions: [
      {
        id: "rush",
        label: "直接冲过雾区",
        story: "队伍屏住呼吸冲过雾区，但还是有人吸进了一口污染。",
        effects: [{ type: "ADJUST_POLLUTION", target: "random", amount: 10 }],
      },
      {
        id: "seal",
        label: "徒手封堵裂口",
        story: "一名队员被烫伤了手，但裂口被堵住了，还顺手拆下一块可用的零件。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 },
          { type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 },
        ],
      },
      {
        id: "purge",
        label: "消耗粒子净化雾气",
        story: "净化粒子扫过房间，污染雾被一点点压回管道。",
        effects: [{ type: "MODIFY_ENERGY", amount: -6 }],
      },
    ],
  },
  rogueDrone: {
    name: "失控的安保无人机",
    role: "risk",
    forced: true,
    verb: "应对",
    size: 205,
    description: "一台安保无人机锁定了队伍，枪口的红光已经开始闪烁。",
    decisions: [
      {
        id: "charge",
        label: "正面突破",
        story: "队伍顶着扫射冲上去打落了无人机，身上多了几道擦伤。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.06 }],
      },
      {
        id: "bribe",
        label: "投币骗过识别",
        story: "一枚铜币卡进了识别槽，无人机误判为巡检通过，转身飞走了。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "MODIFY_ENERGY", amount: -3 },
        ],
      },
      {
        id: "dismantle",
        label: "近身拆解",
        story: "一名队员冒着火力贴近拆解，从机体里取下一枚模组。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 },
          { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
        ],
      },
    ],
  },
};
