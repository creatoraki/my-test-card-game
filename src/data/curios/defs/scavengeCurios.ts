import { byJob, fail, feedDecision, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const SCAVENGE_CURIOS = {
  safe: {
    name: "蝶钥委托柜",
    role: "loot",
    verb: "打开",
    size: 210,
    description: "高窄的紫藤委托柜只认蝶形钥匙。柜里寄存的物资保存得很好，但贸然开锁可能会触发防盗机关。",
    decisions: [
      {
        id: "forceOpen",
        label: "尝试打开",
        story: "蝶形锁片发出刺耳的摩擦声，委托柜在防盗机关启动前吐出了物资。",
        effects: [
          { type: "GAIN_POOL_ITEM", pool: "generalMaterialOrScrap", count: 2 },
        ],
        failure: fail(
          0.5,
          "防盗机关骤然启动，柜顶的铜铃响彻整个房间，巡逻的守卫正朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", {
            chanceDelta: -0.3,
            bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
            note: "剑士用熟悉的角度压住蝶形锁片，顺手从内格里取出一枚模组",
          }),
          byJob("actuary", {
            convert: {
              story: "铜铃响起的前一刻，精算师算准了锁片的回转周期，把机关牵线改接到了找零格。",
              effects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 2 }],
            },
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给锁孔里的甲虫",
        "甲虫吃饱后钻进锁孔，一格一格咬开了卡死的齿轮，委托柜无声地打开了。",
        "beetle",
        2,
        [
          { type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 },
          { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
        ],
      ),
    ],
    levels: {
      5: {
        replaceEffects: {
          forceOpen: [
            { type: "GAIN_POOL_ITEM", pool: "generalMaterialOrScrap", count: 2 },
            { type: "GRANT_EQUIP" },
          ],
        },
      },
    },
  },
  crystalVein: {
    name: "雷萤晶石座",
    role: "loot",
    verb: "撬取",
    size: 230,
    description: "晶石座上的雷萤结晶仍在流动着不稳定的光芒。贸然撬取会把污染一并带出来。",
    decisions: [
      {
        id: "mine",
        label: "撬下结晶",
        story: "执行者小心地沿着晶簇的纹理撬下几块结晶。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "crystal", count: 1 }],
        failure: fail(
          0.5,
          "晶石的雷光突然灌入空气，执行者在刺痛中勉强收起了结晶。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
          byJob("botanist", {
            chanceDelta: -0.35,
            bonusEffects: [{ type: "ADJUST_POLLUTION", target: "party", amount: -10 }],
            note: "植物学家的观察记录让晶簇恢复稳定，还滤掉了队伍身上的一些污染",
          }),
          withItem({ familyId: "holy-water" }, {
            chanceDelta: -0.3,
            note: "圣水浇在晶座上，压住了四散的雷光",
          }),
        ),
      },
      feedDecision(
        "feedMole",
        "喂给晶座下的鼹鼠",
        "鼹鼠吞下食物后钻进晶座底部，晶簇从内部逐层绽开。",
        "mole",
        1,
        [
          { type: "GAIN_POOL_ITEM", pool: "crystal", count: 3 },
          { type: "GAIN_ITEM", itemId: "neon-tube" },
        ],
      ),
    ],
  },
  vending: {
    name: "月鲸留声机",
    role: "loot",
    verb: "翻找",
    size: 205,
    description: "留声机仍在反复播放同一段潮声。底座的唱片匣里，也许还存着旅人寄放的零食。",
    decisions: [{
      id: "shake",
      label: "翻找唱片匣",
      story: "唱片匣里传来一阵闷响，几件包装完好的食品滚了出来。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "basicFood", count: 2 }],
      failure: fail(
        0.4,
        "沉重的鲸形喇叭突然倾倒，砸到了执行者的腿上。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
        withItem("cola", {
          chanceDelta: -0.4,
          bonusEffects: [
            { type: "GAIN_POOL_ITEM", pool: "food", count: 1 },
            { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 },
          ],
          note: "可乐瓶盖被当作代币投进点播口，唱片匣一次性全部弹开",
        }),
        byJob("actuary", {
          convert: {
            story: "喇叭倒下的瞬间，精算师读出了点播账簿，留声机吐出的不再是食品而是一把高价值货币。",
            effects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 2 }],
          },
        }),
      ),
    }],
  },
  remains: {
    name: "橡叶岔路牌",
    role: "loot",
    verb: "检查",
    size: 110,
    description: "岔路牌下挂着一只被遗落的行囊，牌面的箭头还在缓缓转动，像在记着每一个来过这里的人。",
    decisions: [{
      id: "search",
      label: "翻找行囊",
      story: "行囊里仍有可用的物品。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }],
      failure: fail(
        0.5,
        "行囊里渗出的残余污染顺着手套爬了上来。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }],
        withItem({ familyId: "holy-water" }, {
          chanceDelta: -0.5,
          bonusEffects: [{ type: "GRANT_EQUIP" }],
          note: "圣水冲开了行囊上的封绳，里面的应急装备被完整释放",
        }),
        byJob("prophet", {
          convert: {
            story: "污染涌上来时，预言家读懂了箭头转动的规律，未知房间的位置逐一显现。",
            effects: [{ type: "REVEAL_MAP", threats: false }],
          },
        }),
      ),
    }],
  },
  compactor: {
    name: "琉璃炼金炉",
    role: "loot",
    verb: "出炉",
    size: 220,
    description: "琉璃炉腔里还翻滚着熔渣，炉压正在缓慢上升。里面的残渣可以直接取出，也可以重新炼成更紧凑的形态。",
    decisions: [
      {
        id: "open",
        label: "打开炉门",
        story: "炉门缓缓泄压，你们取出了炉腔里的残渣。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
        failure: fail(
          0.45,
          "炉门弹开时热浪骤然冲出，执行者被掀得踉跄。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          withItem("heavy-burden", {
            chanceDelta: -0.45,
            bonusEffects: [{ type: "GAIN_ITEM", itemId: "compacted-block" }],
            note: "沉重的负担被当作坩埚配重塞进炉里，炼成了一枚规整的废块",
          }),
          byJob("swordsman", { chanceDelta: -0.25, note: "剑士用身体顶住了炉门" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给炉底的清扫虫",
        "清扫虫识别出食物中的有机材料，随即把炉内残渣炼成一枚模组。",
        "cleaner",
        2,
        [
          { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 },
          { type: "GAIN_POOL_ITEM", pool: "module", count: 1 },
        ],
      ),
    ],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
