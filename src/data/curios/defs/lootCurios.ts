import { byJob, fail, feedDecision, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

/** 道具奖励类物件：以直接获取物品为主，执行者职业与背包物品会暗中改变成败。美术见 ui/art/corridor/commonPropArt.ts。 */
export const LOOT_CURIOS = {
  supplyCrate: {
    name: "藤叶探险箱",
    role: "loot",
    verb: "打开",
    size: 200,
    description: "缠满翡翠藤叶的探险箱半掩着箱盖，箱里还留着几份包装完好的食品。",
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
            note: "可乐瓶盖撬开了夹层的藤扣，里面还藏着一件应急道具",
          }),
          byJob("actuary", { chanceDelta: -0.15, note: "精算师核对生产日期，避开了变质的那一批" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给藤叶下的清扫虫",
        "清扫虫吞下食物后钻进藤叶缝隙，把卡在夹层里的补给全都推了出来。",
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
    name: "熄火的锻造台",
    role: "loot",
    verb: "撬开",
    size: 205,
    description: "锻造台的炉火早已熄灭，工具壁的锁扣变形卡死，缝隙里露出几件还能用的零件。",
    decisions: [{
      id: "prySpare",
      label: "撬出零件",
      story: "工具壁吱呀一声弹开，两份零件被完整取出。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }],
      failure: fail(
        0.4,
        "变形的工具壁猛地回弹，挂钩狠狠刮过执行者的手臂。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
        byJob("swordsman", {
          chanceDelta: -0.4,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
          note: "剑士用刀背顶开了风箱后的暗格，里面放着一枚模组",
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
    name: "苔铃蘑菇邮筒",
    role: "loot",
    verb: "拆开",
    size: 210,
    description: "长满青苔的蘑菇邮筒塞得鼓鼓囊囊，里面的包裹一直没有人来取。",
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
        "邮筒顶上的苔铃被碰响，清脆的铃声在走廊里回荡开来。",
        [{ type: "ALARM_BATTLE" }],
        byJob("prophet", {
          convert: {
            story: "预言家提前听出了铃声的节拍，趁它响起前摘下了铃舌，铃里还夹着一张货单。",
            effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
          },
        }),
      ),
    }],
  },
  cashBox: {
    name: "遗落的旅行布袋",
    role: "loot",
    verb: "清点",
    size: 120,
    description: "草药旅行布袋被丢在角落，系绳已经松开，侧袋里还压着旅人没花完的零钱。",
    decisions: [{
      id: "grabCoins",
      label: "收走零钱",
      story: "你们解开侧袋，收走了里面的零钱。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
      failure: fail(
        0.15,
        "布袋底部渗着一层黏稠的污染汁液，执行者的手套被腐蚀出几个小洞。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 8 }],
        byJob("actuary", {
          chanceDelta: -0.15,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 1 }],
          note: "精算师翻看了旅人的账本，找出了藏在夹层里的高面值硬币",
        }),
      ),
    }],
  },
  moduleCase: {
    name: "封存的潮汐宝匣",
    role: "loot",
    verb: "解封",
    size: 205,
    description: "潮汐宝匣的封存灯还在闪烁，匣里锁着模组。强行解封可能会泄出一些污染。",
    decisions: [{
      id: "unseal",
      label: "解开封存",
      story: "封存层缓缓打开，匣里的模组被取了出来。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      failure: fail(
        0.45,
        "封存层破开时冒出一股灰雾，执行者被呛得头晕目眩。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
        withItem("neon-tube", {
          chanceDelta: -0.45,
          bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
          note: "霓虹灯管接通了封存回路，宝匣安全地打开了两层托盘",
        }),
        byJob("alchemist", { chanceDelta: -0.25, note: "炼金术士先中和了封存层里的残留气体" }),
      ),
    }, {
      // 稳妥的另一条路: 不拆封存层, 整箱带走 —— 多占一格背包, 回头在背包或仓库里再拆。
      id: "carryCase",
      label: "整箱带走",
      story: "你们没有惊动封存层，把匣里的模组箱整个塞进了背包。",
      effects: [{ type: "GAIN_ITEM", itemId: "module-crate-t1", count: 1 }],
    }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
