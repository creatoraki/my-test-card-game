import { byJob, fail, feedDecision, poolItem, rollRange, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef, CurioEffect } from "../types";

// 搜刮类：每种物件 2 个候选品类，交互时随机给 1 类或 2 类（各半，平均 1.5 件）、每类 1 件；
// 喂养小生物必定成功且 2 类都给。美术分配见 ui/art/corridor/commonPropArt.ts。

const SNAIL_OPTIONS: CurioEffect[] = [poolItem("food"), poolItem("consumable")];
const CLOCK_OPTIONS: CurioEffect[] = [poolItem("generalMaterial"), poolItem("scrap")];
const VAULT_OPTIONS: CurioEffect[] = [{ type: "GRANT_EQUIP" }, poolItem("module")];

export const LOOT_CURIOS = {
  supplyCrate: {
    name: "搁浅的锈蜗储物壳",
    role: "loot",
    verb: "翻找",
    size: 200,
    description: "一只搬运零件的机械蜗牛累得缩进了铜壳，搁浅在路边。壳上一圈圈螺纹抽屉里塞着它一路捡来的东西：可能是食品，也可能是应急道具。",
    decisions: [
      {
        id: "open",
        label: "拉开螺纹抽屉",
        story: "你们顺着螺纹一格格拉开抽屉，翻出了还能用的东西。",
        effects: [rollRange(1, 2, SNAIL_OPTIONS)],
        failure: fail(
          0.2,
          "蜗牛被惊动，猛地往壳里一缩，带出的一大团黏液糊了执行者满手。",
          [{ type: "ADJUST_POLLUTION", target: "actor", amount: 6 }],
          withItem("cola", { chanceDelta: -0.2, note: "可乐冲开了滑轨上的黏液，抽屉拉开时没惊动蜗牛" }),
          byJob("actuary", { chanceDelta: -0.15, note: "精算师掐准了蜗牛呼吸的间隙，趁它放松时才动手" }),
        ),
      },
      feedDecision(
        "feedCleaner",
        "喂给壳缝里的清扫虫",
        "清扫虫吞下食物后钻进螺纹深处，把卡在最里面的两格抽屉都推了出来。",
        "cleaner",
        1,
        SNAIL_OPTIONS,
      ),
    ],
  },
  toolLocker: {
    name: "停摆的布谷钟楼",
    role: "loot",
    verb: "拆卸",
    size: 205,
    description: "老式布谷钟楼斜靠在断墙上，指针停在一个早已过去的时刻，木鸟卡在小门里，嘴里还叼着一枚硬币。侧板脱落的机芯里有能拆的零件和零钱，只是发条还绷着劲。",
    decisions: [
      {
        id: "dismantle",
        label: "拆开钟楼机芯",
        story: "你们小心地卸下几颗齿轮，机芯里藏着的东西被完整取了出来。",
        effects: [rollRange(1, 2, CLOCK_OPTIONS)],
        failure: fail(
          0.35,
          "绷紧的发条突然回弹，钟摆横扫过来，重重砸在执行者的手臂上。",
          [{ type: "DAMAGE_MEMBER_PERCENT", target: "actor", percent: 0.08 }],
          byJob("swordsman", { chanceDelta: -0.35, note: "剑士用刀背卡住了回弹的钟摆" }),
        ),
      },
      feedDecision(
        "feedMole",
        "喂给机芯里的掘地鼹",
        "掘地鼹吃饱后钻进机芯深处，把齿轮缝里卡着的东西全拱了出来。",
        "mole",
        1,
        CLOCK_OPTIONS,
      ),
    ],
  },
  safe: {
    name: "打盹的眠猫金库",
    role: "loot",
    verb: "开锁",
    size: 210,
    description: "一只铸铁机械猫蜷成一团睡在金币堆上，圆鼓鼓的肚子就是一扇金库门，转盘锁后面锁着装备和模组。它颈上的铃铛被细线拴着，一旦它醒来，整层楼都会听见。",
    decisions: [
      {
        id: "forceOpen",
        label: "轻转猫爪转盘锁",
        story: "转盘锁咔哒一声对上了最后一格，机械猫翻了个身，肚子上的金库门悄悄打开了。",
        effects: [rollRange(1, 2, VAULT_OPTIONS)],
        failure: fail(
          0.4,
          "机械猫猛地睁眼炸毛，挣断了铃铛上的细线，尖锐的铃声响彻整个房间，巡逻的守卫正朝这里赶来。",
          [{ type: "ALARM_BATTLE" }],
          byJob("swordsman", { chanceDelta: -0.3, note: "剑士用刀尖按住了铃铛，没让它响起来" }),
          byJob("actuary", {
            convert: {
              story: "铃声响起的前一刻，精算师算出了转盘锁的出厂规律，顺手从猫爪缝里抠出两枚值钱的硬币。",
              effects: [poolItem("premiumScrap"), poolItem("premiumScrap")],
            },
          }),
        ),
      },
      feedDecision(
        "feedBeetle",
        "喂给猫耳里的甲虫",
        "甲虫吃饱后钻进转盘锁，一格一格咬开了卡死的齿轮。机械猫睡得更沉了，金库门无声地打开。",
        "beetle",
        2,
        VAULT_OPTIONS,
      ),
    ],
  },
  relicCache: {
    name: "尘封的环锁密匣", role: "loot", verb: "开启", size: 190,
    description: "密匣落满灰尘，匣盖上的环锁封印仍在微微发光。开启后可直接获得一件随机遗物。",
    decisions: [{
      id: "open", label: "开启密匣", story: "环锁一圈圈松开，一件遗物从匣底浮起，被送入待拾取框。",
      effects: [{ type: "GRANT_RANDOM_RELIC" }],
      failure: fail(
        0.2,
        "环锁松开时的反冲灌进执行者体内，遗物的光芒也随之熄灭。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }],
        withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水浸透封印，让环锁安静地松开" }),
      ),
    }],
  },
  temporaryRelicCache: {
    name: "起程祈愿龛", role: "loot", verb: "祈愿", size: 190,
    description: "出发点路边的石龛里还亮着烛火，向它祈一个愿，祝福会凝成一件一次性遗物。遗物仅在本次探索生效，不能寄回，离开远征后消失。",
    decisions: [{ id: "blessing", label: "祈愿并领取一次性遗物", story: "龛中的烛火轻轻一跳，短暂的祝福化作一件可携带的遗物。",
      effects: [{ type: "GRANT_DISPOSABLE_RELIC" }] }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
