import { critterRecipe, exactItem, jobDecision, offeringDecision } from "./helpers";
import type { CurioDef } from "./types";

export const SCAVENGE_CURIOS: Record<string, CurioDef> = {
  safe: {
    name: "合金保险箱",
    verb: "撬开",
    size: 210,
    description: "保险箱的合金锁芯仍在运转，里面的物资保存得很好，但强行打开可能会触发防盗装置。",
    decisions: [{
      id: "forceOpen",
      label: "强行撬开",
      story: "锁芯发出刺耳的摩擦声，保险箱在防盗装置启动前吐出了一份物资。",
      risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.08 }] },
      effects: [{ type: "GAIN_POOL_ITEM", pool: "generalMaterialOrScrap", count: 1 }],
    },
      offeringDecision(
        "foodLock",
        "投放两份面包或牛奶",
        "保险箱识别出食物中的稳定能量，锁芯转入低压模式并吐出更多物资。",
        critterRecipe("beetle", 2),
        [{ type: "GAIN_POOL_ITEM", pool: "generalMaterial", count: 2 }, { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
      ),
      jobDecision(
        "swordsman",
        "让剑士撬开锁芯",
        "剑士用熟悉的角度压住锁芯，保险箱打开了，但反冲仍擦过了他的装甲。",
        "swordsman",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.15 }, { type: "GAIN_POOL_ITEM", pool: "module", count: 1 }, { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
      ),
    ],
  },
  crystalVein: {
    name: "结晶矿脉",
    verb: "开采",
    size: 230,
    description: "墙体裂隙里流动着不稳定的彩色光芒。贸然开采会把污染一并带出来。",
    decisions: [
      {
        id: "mine",
        label: "徒手开采",
        story: "矿脉的光芒突然灌入空气，队伍只能在刺痛中收集结晶。",
        risk: { chance: 0.5, effects: [{ type: "ADJUST_POLLUTION", target: "random", amount: 12 }] },
        effects: [{ type: "GAIN_ITEM", itemId: "green-crystal" }],
      },
      offeringDecision(
        "stabilize",
        "投放高热量食物",
        "矿脉识别出食物中的稳定能量，裂隙从内部逐层绽开。",
        critterRecipe("mole", 1),
        [
          { type: "GAIN_POOL_ITEM", pool: "crystal", count: 3 },
          { type: "GAIN_ITEM", itemId: "neon-tube" },
        ],
      ),
      jobDecision(
        "botanist",
        "让植物学家校准矿脉",
        "植物学家的观察记录让矿脉恢复稳定，队伍得以避开最浓的污染。",
        "botanist",
        [
          { type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 },
          { type: "GAIN_POOL_ITEM", pool: "crystal", count: 1 },
          { type: "ADJUST_POLLUTION", target: "party", amount: -15 },
        ],
      ),
    ],
  },
  vending: {
    name: "侧翻的自动贩卖机",
    verb: "翻找",
    size: 205,
    description: "侧翻的机器仍在重复播放促销音。它的储藏格也许还有没被压坏的商品。",
    decisions: [
      {
        id: "shake",
        label: "强行翻找",
        story: "机器内部传来一阵闷响，几件包装完好的食品滚了出来。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "party", percent: 0.05 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "basicFood", count: 1 }],
      },
      offeringDecision(
        "cola",
        "投放可乐",
        "可乐条码恢复了售货机的识别协议，储藏格一次性打开。",
        exactItem("cola", 1).map((part) => [part]),
        [
          { type: "GAIN_POOL_ITEM", pool: "food", count: 3 },
          { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 },
        ],
      ),
      jobDecision(
        "actuary",
        "让精算师读取库存",
        "精算师复原了售货机的库存模型，机器吐出的不再是普通食品而是高价值货币。",
        "actuary",
        [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.1 }, { type: "GAIN_POOL_ITEM", pool: "premiumScrap", count: 3 }],
      ),
    ],
  },
  remains: {
    name: "拾荒者遗骸",
    verb: "检查",
    size: 110,
    description: "遗骸旁的工具箱已经锈死，胸口却还挂着一枚没有熄灭的识别牌。",
    decisions: [
      {
        id: "search",
        label: "翻找遗骸",
        story: "遗骸中的残余污染顺着手套爬上来，但工具箱里仍有可用物品。",
        risk: { chance: 0.5, effects: [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }],
      },
      offeringDecision(
        "holyWater",
        "投放圣水",
        "圣水冲开了遗骸旁的识别锁，里面的应急装备被完整释放。",
        [[{ match: { familyId: "holy-water" }, count: 1 }]],
        [{ type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }, { type: "GRANT_EQUIP" }],
      ),
      jobDecision(
        "prophet",
        "让预言家聆听遗言",
        "预言家从识别牌的噪声里听见了整栋楼的回声，未知房间的位置逐一显现。",
        "prophet",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 10 }, { type: "REVEAL_MAP", threats: false }, { type: "GAIN_POOL_ITEM", pool: "consumable", count: 1 }],
      ),
    ],
  },
  compactor: {
    name: "垃圾压缩舱",
    verb: "拆解",
    size: 220,
    description: "压缩舱的压力表还在缓慢上升。里面的废料可以直接取出，也可以重新压成更紧凑的形态。",
    decisions: [
      {
        id: "open",
        label: "打开舱门",
        story: "舱门弹开时压力骤降，附近的队员被冲击波掀得踉跄。",
        risk: { chance: 0.5, effects: [{ type: "DAMAGE_MEMBER_PERCENT", target: "random", percent: 0.12 }] },
        effects: [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
      },
      offeringDecision(
        "compressFood",
        "投放两份饮料或披萨",
        "压缩舱识别出食物中的有机材料，随即把内部零件压成一枚模组。",
        critterRecipe("cleaner", 2),
        [{ type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }, { type: "GAIN_POOL_ITEM", pool: "module", count: 1 }],
      ),
      offeringDecision(
        "compressBurden",
        "投放沉重的负担",
        "沉重的配重件被压成一枚规整的废块，舱门也随之永久锁死。",
        exactItem("heavy-burden", 1).map((part) => [part]),
        [{ type: "GAIN_ITEM", itemId: "compacted-block" }, { type: "GAIN_POOL_ITEM", pool: "scrap", count: 1 }],
      ),
    ],
  },
};
