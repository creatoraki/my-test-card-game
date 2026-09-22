import { byJob, fail, feedDecision, withItem } from "./helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "./types";

export const SCAVENGE_CURIOS = {
  safe: {
    name: "合金保险箱",
    role: "loot",
    verb: "打开",
    size: 210,
    description: "保险箱的合金锁芯仍在运转，里面的物资保存得很好，但贸然开锁可能会触发防盗装置。",
    decisions: [
      {
        id: "forceOpen",
        label: "尝试打开",
        story: "锁芯发出刺耳的摩擦声，保险箱在防盗装置启动前吐出了物资。",
        effects: [
          { type: "GAIN_POOL_ITEM", pool: "generalMaterialOrScrap", count: 2 },
        ],
        failure: fail(
          0.5,
          "防盗装置骤然启动，红色警灯把整个房间照得通明，巡逻的守卫正朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", {
            chanceDelta: -0.3,
            bonusEffects: [{ type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
            note: "剑士用熟悉的角度压住锁芯，顺手从内格里取出一枚模组",
          }),
          byJob("actuary", {
            convert: {
              story: "警报响起的前一刻，精算师算准了锁芯的回转周期，把警报线路改接到了找零口。",
              effects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 2 }],
            },
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给锁孔里的甲虫",
        "甲虫吃饱后钻进锁芯，一格一格咬开了卡死的齿轮，保险箱无声地打开了。",
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
    name: "结晶矿脉",
    role: "loot",
    verb: "开采",
    size: 230,
    description: "墙体裂隙里流动着不稳定的彩色光芒。贸然开采会把污染一并带出来。",
    decisions: [
      {
        id: "mine",
        label: "挖取结晶",
        story: "执行者小心地沿着裂隙敲下几块结晶。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "crystal", count: 1 }],
        failure: fail(
          0.5,
          "矿脉的光芒突然灌入空气，执行者在刺痛中勉强收起了结晶。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 12 }],
          byJob("botanist", {
            chanceDelta: -0.35,
            bonusEffects: [{ type: "ADJUST_POLLUTION", target: "party", amount: -10 }],
            note: "植物学家的观察记录让矿脉恢复稳定，还滤掉了队伍身上的一些污染",
          }),
          withItem({ familyId: "holy-water" }, {
            chanceDelta: -0.3,
            note: "圣水浇在裂隙上，压住了四散的光芒",
          }),
        ),
      },
      feedDecision(
        "feedMole",
        "喂给岩缝里的鼹鼠",
        "鼹鼠吞下食物后沿着矿脉一路掘进，裂隙从内部逐层绽开。",
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
    name: "侧翻的自动贩卖机",
    role: "loot",
    verb: "翻找",
    size: 205,
    description: "侧翻的机器仍在重复播放促销音。它的储藏格也许还有没被压坏的商品。",
    decisions: [{
      id: "shake",
      label: "翻找货格",
      story: "机器内部传来一阵闷响，几件包装完好的食品滚了出来。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "basicFood", count: 2 }],
      failure: fail(
        0.4,
        "贩卖机突然翻转，沉重的机身压到了执行者的腿上。",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }],
        withItem("cola", {
          chanceDelta: -0.4,
          bonusEffects: [
            { type: "GAIN_POOL_ITEM", pool: "food", count: 1 },
            { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 },
          ],
          note: "可乐条码恢复了售货机的识别协议，储藏格一次性打开",
        }),
        byJob("actuary", {
          convert: {
            story: "机身压下来的瞬间，精算师读出了库存模型，机器吐出的不再是食品而是一把高价值货币。",
            effects: [{ type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 2 }],
          },
        }),
      ),
    }],
  },
  remains: {
    name: "拾荒者遗骸",
    role: "loot",
    verb: "检查",
    size: 110,
    description: "遗骸旁的工具箱已经锈死，胸口却还挂着一枚没有熄灭的识别牌。",
    decisions: [{
      id: "search",
      label: "翻找遗骸",
      story: "工具箱里仍有可用的物品。",
      effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }],
      failure: fail(
        0.5,
        "遗骸中的残余污染顺着手套爬了上来。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }],
        withItem({ familyId: "holy-water" }, {
          chanceDelta: -0.5,
          bonusEffects: [{ type: "GRANT_EQUIP" }],
          note: "圣水冲开了遗骸旁的识别锁，里面的应急装备被完整释放",
        }),
        byJob("prophet", {
          convert: {
            story: "污染涌上来时，预言家从识别牌的噪声里听见了整栋楼的回声，未知房间的位置逐一显现。",
            effects: [{ type: "REVEAL_MAP", threats: false }],
          },
        }),
      ),
    }],
  },
  compactor: {
    name: "垃圾压缩舱",
    role: "loot",
    verb: "拆解",
    size: 220,
    description: "压缩舱的压力表还在缓慢上升。里面的废料可以直接取出，也可以重新压成更紧凑的形态。",
    decisions: [
      {
        id: "open",
        label: "打开舱门",
        story: "舱门缓缓泄压，你们取出了里面的废料。",
        effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 2 }],
        failure: fail(
          0.45,
          "舱门弹开时压力骤降，执行者被冲击波掀得踉跄。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.12 }],
          withItem("heavy-burden", {
            chanceDelta: -0.45,
            bonusEffects: [{ type: "GAIN_ITEM", itemId: "compacted-block" }],
            note: "沉重的负担被当作配重塞进舱里，压成了一枚规整的废块",
          }),
          byJob("swordsman", { chanceDelta: -0.25, note: "剑士用身体顶住了舱门" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给舱底的清扫虫",
        "清扫虫识别出食物中的有机材料，随即把舱内零件压成一枚模组。",
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
