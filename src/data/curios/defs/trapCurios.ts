import { byJob, fail, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

/**
 * 陷阱房物件：进房立即触发，玩家指定执行者并选择应对措施。
 * 每条措施都可能失败；执行者职业与背包物品会暗中改变成败。美术复用已有交互物素材。
 */
export const TRAP_CURIOS = {
  collapsedCeiling: {
    name: "坍塌的天花板",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 220,
    description: "刚踏进房间，头顶的天花板就开始成片剥落，碎块正朝队伍砸下来。",
    decisions: [
      {
        id: "brace",
        label: "全队护住要害",
        story: "队伍护住要害硬扛过这一阵落石，每个人都挂了点彩。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }],
      },
      {
        id: "shield",
        label: "由执行者顶住碎块",
        story: "执行者顶住了最大的碎块，碎块里还卡着一些散落的硬币。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 },
          { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
        ],
        failure: fail(
          0.4,
          "碎块比预想的更重，执行者被砸得半跪在地。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          byJob("swordsman", {
            convert: {
              story: "剑士一刀劈开了砸下的碎块，碎块里藏着的零件和硬币滚了一地。",
              effects: [
                { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
                { type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 },
              ],
            },
          }),
        ),
      },
      {
        id: "barrier",
        label: "消耗粒子撑起屏障",
        story: "净化粒子在头顶展开一层屏障，碎块全部被弹开。",
        effects: [{ type: "MODIFY_ENERGY", amount: -6 }],
        failure: fail(
          0.3,
          "屏障在最后一刻闪烁了一下，几块碎石穿透进来砸中了全队。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.04 }],
          byJob("alchemist", { chanceDelta: -0.3, note: "炼金术士稳住了屏障的粒子频率" }),
        ),
      },
    ],
  },
  leakingPipe: {
    name: "泄漏的污染管道",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 210,
    description: "管道在队伍进门的瞬间爆裂，灰绿色的污染雾正迅速灌满房间。",
    decisions: [
      {
        id: "rush",
        label: "直接冲过雾区",
        story: "队伍屏住呼吸冲过了雾区。",
        effects: [],
        failure: fail(
          0.6,
          "雾气比想象中浓，执行者还是吸进了一大口污染。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 14 }],
          withItem({ familyId: "holy-water" }, { chanceDelta: -0.6, note: "圣水浸湿的面罩挡住了污染雾" }),
        ),
      },
      {
        id: "seal",
        label: "由执行者封堵裂口",
        story: "裂口被堵住了，执行者还顺手拆下一块可用的零件。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
        failure: fail(
          0.5,
          "滚烫的管壁烫伤了执行者的手，裂口只被勉强堵住。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
          byJob("botanist", {
            chanceDelta: -0.3,
            note: "植物学家认出了管道里的菌膜，用它糊住了裂口",
          }),
          withItem("standard-gear", { chanceDelta: -0.2, note: "一枚齿轮被卡进裂口充当塞子" }),
        ),
      },
      {
        id: "purge",
        label: "消耗粒子净化雾气",
        story: "净化粒子扫过房间，污染雾被一点点压回管道。",
        effects: [{ type: "MODIFY_ENERGY", amount: -6 }],
        failure: fail(
          0.25,
          "粒子流被雾气冲散，一部分污染还是落在了全队身上。",
          [{ type: "ADJUST_POLLUTION", target: "party", amount: 5 }],
          byJob("alchemist", {
            convert: {
              story: "炼金术士把被冲散的粒子重新收拢，反而提纯出一小股净化粒子。",
              effects: [{ type: "MODIFY_ENERGY", amount: 4 }],
            },
          }),
        ),
      },
    ],
  },
  rogueDrone: {
    name: "失控的安保无人机",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 205,
    description: "一台安保无人机锁定了队伍，枪口的红光已经开始闪烁。",
    decisions: [
      {
        id: "charge",
        label: "正面突破",
        story: "队伍顶着扫射冲上去打落了无人机，身上多了几道擦伤。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }],
        failure: fail(
          0.3,
          "无人机在坠毁前拉响了警报，守卫正朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士一击斩断了无人机的信号天线" }),
        ),
      },
      {
        id: "bribe",
        label: "投币骗过识别",
        story: "一枚铜币卡进了识别槽，无人机误判为巡检通过，转身飞走了。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "MODIFY_ENERGY", amount: -3 },
        ],
        failure: fail(
          0.4,
          "识别槽吐出了铜币，无人机对着执行者打出一串警告射击。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
          byJob("actuary", {
            convert: {
              story: "精算师改写了识别槽的计费规则，无人机不仅放行，还把储币仓里的零钱全吐了出来。",
              effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
            },
          }),
        ),
      },
      {
        id: "dismantle",
        label: "由执行者近身拆解",
        story: "执行者冒着火力贴近拆解，从机体里取下一枚模组。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.06 },
          { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
        ],
        failure: fail(
          0.5,
          "无人机在近距离开火，执行者被打得连连后退，模组也在爆炸中损毁。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士找准了机体的装甲缝隙" }),
        ),
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
