import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

/** 新手固定蓝图专用物件；不进入普通地图的随机物件池。 */
export const TUTORIAL_CURIOS = {
  tutorialArmory: {
    name: "训练装备匣",
    role: "loot",
    enName: "TRAINING EQUIPMENT CHEST",
    verb: "领取",
    size: 210,
    description: "训练装备匣已经为小队备好一件校准完成的装备。是否现在领取补给？",
    decisions: [{
      id: "claimEquip",
      label: "领取训练装备",
      story: "匣盖弹开，一件校准完成的装备被送入待拾取框。",
      effects: [{ type: "GRANT_EQUIP" }],
    }],
  },
  tutorialModBench: {
    name: "训练锻造台",
    role: "loot",
    verb: "领取",
    size: 210,
    description: "训练锻造台已备好一枚攻击力模组与三份临期食品，可用于体验锻造师服务。",
    decisions: [{
      id: "claimModule",
      label: "领取模组与三份食品",
      story: "锻造台完成检验，攻击力模组被送入待拾取框，三份临期食品放入背包。",
      effects: [{ type: "GAIN_ITEM", itemId: "attack-module-t1" },
        { type: "FORCE_ITEM", itemId: "bread", count: 3 }],
    }],
  },
  tutorialMedical: {
    name: "训练调药台",
    role: "heal",
    verb: "治疗",
    size: 215,
    description: "训练调药台会为所有存活成员恢复生命，并清除一部分污染。",
    decisions: [{
      id: "treatParty",
      label: "调配全队药剂",
      story: "调药台蒸腾起萤露药雾，治疗稳定地流过每名成员。",
      effects: [
        { type: "HEAL_PARTY", percent: 0.4 },
        { type: "ADJUST_POLLUTION", target: "party", amount: -10 },
      ],
    }],
  },
  tutorialRelicCache: {
    name: "遗物储备宝库",
    role: "loot",
    verb: "开启",
    size: 190,
    description: "储备宝库里封存着三种不同的祝福遗物，开启后可以当场挑走一件。",
    decisions: [{
      id: "openCache",
      label: "开启储备宝库",
      story: "扇贝壳盖缓缓张开，三件祝福遗物同时在珍珠光里亮起。",
      effects: [{
        type: "RELIC_OFFER",
        relicIds: ["relic-heart-mirror", "relic-old-clockwork", "relic-light-feather"],
      }],
    }],
  },
  // 演示换金物拾取；金币只由首领与宝箱怪投放，这里固定给铜币。
  tutorialCashBox: {
    name: "遗落的旅行布袋",
    role: "loot",
    verb: "清点",
    size: 120,
    description: "旅行布袋被丢在角落，系绳已经松开，侧袋里还剩几枚旧铜币。",
    decisions: [{
      id: "grabCoins",
      label: "收走铜币",
      story: "你们解开侧袋，收走了里面的两枚铜币。",
      effects: [{ type: "GAIN_ITEM", itemId: "copper-coin", count: 2 }],
    }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
