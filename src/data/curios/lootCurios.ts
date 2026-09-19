import { exactItem, jobDecision, offeringDecision } from "./helpers";
import type { CurioDef } from "./types";

/** 道具奖励类物件：以直接获取物品为主，投放或职业选项给出更好的收益。美术复用已有交互物素材。 */
export const LOOT_CURIOS: Record<string, CurioDef> = {
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
      },
      offeringDecision(
        "colaUnlock",
        "投放可乐",
        "可乐条码解开了补给箱的夹层锁，夹层里还藏着一份应急物资。",
        exactItem("cola", 1).map((part) => [part]),
        [
          { type: "GAIN_POOL_ITEM", pool: "food", count: 2 },
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
    decisions: [
      {
        id: "prySpare",
        label: "撬出零件",
        story: "柜门弹开时刮过行动者的手臂，但两份零件被完整取出。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.06 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }],
      },
      jobDecision(
        "swordsmanPry",
        "让剑士撬开暗格",
        "剑士用刀背顶开暗格，里面放着一枚保存完好的模组。",
        "swordsman",
        [
          { type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 1 },
          { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
        ],
      ),
    ],
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
    }],
  },
  cashBox: {
    name: "遗落的钱箱",
    role: "loot",
    verb: "清点",
    size: 120,
    description: "钱箱被丢在角落，锁扣已经断开，可以直接收走箱内的零钱。",
    decisions: [
      {
        id: "grabCoins",
        label: "抓取硬币",
        story: "你们打开钱箱，收走了箱底的零钱。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
      },
      jobDecision(
        "actuaryCount",
        "让精算师清点账目",
        "精算师核对了钱箱的流水，找出了藏在夹层里的高面值硬币。",
        "actuary",
        [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 2 }],
      ),
    ],
  },
  moduleCase: {
    name: "封存的模组箱",
    role: "loot",
    verb: "解封",
    size: 205,
    description: "模组箱的封存灯还在闪烁，强行解封可能会泄出一些污染。",
    decisions: [
      {
        id: "forceUnseal",
        label: "强行解封",
        story: "封存层破开时冒出一股灰雾，箱子里的模组被取了出来。",
        risk: { chance: 0.5, effects: [{ type: "ADJUST_POLLUTION", target: "random", amount: 10 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      },
      offeringDecision(
        "neonUnseal",
        "投放霓虹灯管",
        "霓虹灯管接通了封存电路，模组箱安全地打开了两层托盘。",
        exactItem("neon-tube", 1).map((part) => [part]),
        [{ type: "GAIN_POOL_ITEM", pool: "module", count: 2 }],
      ),
    ],
  },
};
