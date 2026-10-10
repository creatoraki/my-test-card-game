import { byJob, fail, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

/**
 * 陷阱房物件：进房立即触发，玩家指定执行者并选择应对措施。
 * 每条措施都可能失败；执行者职业与背包物品会暗中改变成败。素材分配见 ui/art/corridor/commonPropArt.ts。
 */
export const TRAP_CURIOS = {
  collapsedCeiling: {
    name: "短路的雷萤灯柱",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 220,
    description: "刚踏进房间，墙边的雷萤灯柱就爆出一串火花，灯罩里的电弧正沿着地面朝队伍乱窜。",
    decisions: [
      {
        id: "brace",
        label: "全队压低身形冲过",
        story: "队伍压低身形冲过了电弧区，每个人都被电得发麻。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }],
      },
      {
        id: "shield",
        label: "由执行者拔断供电线",
        story: "执行者挨了一下电击，硬是拔断了供电线，灯座里的储币盒也被震开，掉出几枚硬币。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 },
          { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
        ],
        failure: fail(
          0.4,
          "供电线比预想的更难拔，执行者被电得半跪在地。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          byJob("swordsman", {
            convert: {
              story: "剑士一刀斩断了供电线，劈开的灯座里零件和硬币滚了一地。",
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
        label: "消耗粒子撑起绝缘屏障",
        story: "净化粒子在队伍周围展开一层屏障，电弧全部被弹开。",
        effects: [{ type: "MODIFY_ENERGY", amount: -6 }],
        failure: fail(
          0.3,
          "屏障在最后一刻闪烁了一下，几道电弧钻进来打中了全队。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.04 }],
          byJob("alchemist", { chanceDelta: -0.3, note: "炼金术士稳住了屏障的粒子频率" }),
        ),
      },
    ],
  },
  leakingPipe: {
    name: "失稳的封印能量柱",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 210,
    description: "队伍进门的瞬间，能量柱上的封印锁链崩开一截，柱顶晶体泄出的污染雾正迅速灌满房间。",
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
        label: "由执行者重新扣紧锁链",
        story: "锁链重新扣紧了，执行者还顺手捡走一块崩落的金属件。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 }],
        failure: fail(
          0.5,
          "滚烫的锁链烫伤了执行者的手，封印只被勉强扣上。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
          byJob("botanist", {
            chanceDelta: -0.3,
            note: "植物学家用柱脚的苔藓糊住了封印的裂缝",
          }),
          withItem("standard-gear", { chanceDelta: -0.2, note: "一枚齿轮被卡进锁链绞盘充当插销" }),
        ),
      },
      {
        id: "purge",
        label: "消耗粒子净化雾气",
        story: "净化粒子扫过房间，污染雾被一点点压回晶体里。",
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
    name: "自鸣的警报铃架",
    role: "trap",
    forced: true,
    verb: "应对",
    size: 205,
    description: "声波铃鼓架感应到了队伍，铜铃开始自行摇晃，鼓面上的声波越震越强，随时会把整片区域的守卫叫来。",
    decisions: [
      {
        id: "charge",
        label: "冲上去砸停铃架",
        story: "队伍顶着声波冲上去砸停了铃架，每个人都被震得耳鸣。",
        effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }],
        failure: fail(
          0.3,
          "铃架在倒下前敲出了最后一声，守卫正循声朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士一击斩断了铃锤的拉杆" }),
        ),
      },
      {
        id: "bribe",
        label: "投币切换静音",
        story: "一枚铜币投进了底座的投币槽，铃架切换成静音模式，慢慢停了下来。",
        effects: [
          { type: "CONSUME_ITEM", itemId: "copper-coin", count: 1 },
          { type: "MODIFY_ENERGY", amount: -3 },
        ],
        failure: fail(
          0.4,
          "投币槽吐出了铜币，鼓面对着执行者轰出一记声波。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
          byJob("actuary", {
            convert: {
              story: "精算师改写了投币槽的计费规则，铃架不仅静了下来，还把储币仓里的零钱全吐了出来。",
              effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
            },
          }),
        ),
      },
      {
        id: "dismantle",
        label: "由执行者拆下鼓芯",
        story: "执行者顶着声波贴近拆解，从鼓芯里取下一枚模组。",
        effects: [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.06 },
          { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
        ],
        failure: fail(
          0.5,
          "鼓面在近距离炸响，执行者被震得连连后退，模组也在震荡中碎裂。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士找准了鼓架的固定螺栓" }),
        ),
      },
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
