import { byJob, fail, feedDecision, withItem } from "./helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "./types";

/** 道具奖励类物件：以直接获取物品为主，执行者职业与背包物品会暗中改变成败。美术复用已有交互物素材。 */
export const LOOT_CURIOS = {
  supplyCrate: {
    name: "散落的补给箱",
    role: "loot",
    verb: "打开",
    size: 200,
    description: "补给箱的封条已经断开，箱子里还留着几份包装完好的食品。",
    decisions: [
      {
        id: "takeFood",
        label: "取出食品",
        story: "你们把箱底翻了个遍，挑出两份还没过期的食品。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "food", count: 2 }],
        failure: fail(
          0.2,
          "箱底的食品早已胀袋变质，执行者被扑面的酸气呛得直咳。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 6 }],
          withItem("cola", {
            chanceDelta: -0.2,
            bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }],
            note: "可乐条码解开了夹层锁，一瓶可乐被卡进了锁槽",
          }),
          byJob("actuary", { chanceDelta: -0.15, note: "精算师核对生产日期，避开了变质的那一批" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给箱底的清扫虫",
        "清扫虫吞下食物后钻进箱底，把卡在夹缝里的补给全都推了出来。",
        "cleaner",
        1,
        [
          { type: "GAIN_POOL_ITEM", pool: "food", count: 3 },
          { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 },
        ],
      ),
    ],
  },
  toolLocker: {
    name: "工具储物柜",
    role: "loot",
    verb: "撬开",
    size: 205,
    description: "储物柜的锁扣已经变形，柜门缝里露出几件还能用的零件。",
    decisions: [{
      id: "prySpare",
      label: "撬出零件",
      story: "柜门吱呀一声弹开，两份零件被完整取出。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }],
      failure: fail(
        0.4,
        "变形的柜门猛地回弹，狠狠刮过执行者的手臂。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
        byJob("swordsman", {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
          note: "剑士用刀背顶开了暗格，里面放着一枚模组",
        }),
      ),
    }],
    levels: {
      5: {
        replaceEffects: {
          prySpare: [
            { type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 },
            { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
          ],
        },
      },
    },
  },
  courierDrone: {
    name: "坠毁的快递无人机",
    role: "loot",
    verb: "拆开",
    size: 210,
    description: "快递无人机卡在管线之间，货仓里的包裹还没有被投递出去。",
    decisions: [{
      id: "openParcel",
      label: "拆开包裹",
      story: "包裹里装着一份应急物资和一份简单的口粮。",
      effects: [
        { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 },
        { type: "GAIN_POOL_ITEM", pool: "basicFood", count: 1 },
      ],
      failure: fail(
        0.25,
        "无人机的防盗程序被触发，尖锐的警报声在走廊里回荡开来。",
        [{ type: "ALARM_BATTLE" }],
        byJob("prophet", {
          convert: {
            story: "预言家提前听出了警报的节拍，趁它响起前拆下了信号模块，里面还夹着一张货单。",
            effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
          },
        }),
      ),
    }],
  },
  cashBox: {
    name: "遗落的钱箱",
    role: "loot",
    verb: "清点",
    size: 120,
    description: "钱箱被丢在角落，锁扣已经断开，可以直接收走箱内的零钱。",
    decisions: [{
      id: "grabCoins",
      label: "抓取硬币",
      story: "你们打开钱箱，收走了箱底的零钱。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
      failure: fail(
        0.15,
        "箱底涂着一层黏稠的污染胶，执行者的手套被腐蚀出几个小洞。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
        byJob("actuary", {
          chanceDelta: -0.15,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 1 }],
          note: "精算师核对了钱箱流水，找出了藏在夹层里的高面值硬币",
        }),
      ),
    }],
  },
  moduleCase: {
    name: "封存的模组箱",
    role: "loot",
    verb: "解封",
    size: 205,
    description: "模组箱的封存灯还在闪烁，强行解封可能会泄出一些污染。",
    decisions: [{
      id: "unseal",
      label: "解开封存",
      story: "封存层缓缓打开，箱子里的模组被取了出来。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      failure: fail(
        0.45,
        "封存层破开时冒出一股灰雾，执行者被呛得头晕目眩。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
        withItem("neon-tube", {
          chanceDelta: -0.45,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
          note: "霓虹灯管接通了封存电路，模组箱安全地打开了两层托盘",
        }),
        byJob("alchemist", { chanceDelta: -0.25, note: "炼金术士先中和了封存层里的残留气体" }),
      ),
    }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
