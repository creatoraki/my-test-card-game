import type { CurioDef } from "./types";

/** 新手固定蓝图专用物件；不进入普通地图的随机物件池。 */
export const TUTORIAL_CURIOS: Record<string, CurioDef> = {
  tutorialArmory: {
    name: "训练装备柜",
    verb: "领取",
    size: 210,
    description: "训练装备柜已经为队伍准备好一件校准完成的装备。",
    decisions: [{
      id: "claimEquip",
      label: "领取训练装备",
      story: "柜门滑开，一件校准完成的装备被送入待拾取框。",
      effects: [{ type: "GRANT_EQUIP" }],
    }],
  },
  tutorialModBench: {
    name: "训练模组台",
    verb: "领取",
    size: 210,
    description: "训练模组台已把一枚攻击力模组送到交付槽。",
    decisions: [{
      id: "claimModule",
      label: "领取攻击力模组",
      story: "模组台完成检验，一枚攻击力模组被送入待拾取框。",
      effects: [{ type: "GAIN_ITEM", itemId: "attack-module-t1" }],
    }],
  },
  tutorialForge: {
    name: "训练锻造终端",
    verb: "锻造",
    size: 215,
    description: "训练锻造终端可以免费生成一次角色卡组候选。",
    decisions: [{
      id: "freeForge",
      label: "开始免费锻造",
      story: "终端启动免费锻造程序，一次卡组候选被登记到待办奖励。",
      effects: [{ type: "FORGE_DRAW_TAINTED", contaminate: 0 }],
    }],
  },
  tutorialMedical: {
    name: "训练医疗站",
    verb: "治疗",
    size: 215,
    description: "训练医疗站会为所有存活成员恢复生命，并清除一部分污染。",
    decisions: [{
      id: "treatParty",
      label: "启动全队治疗",
      story: "医疗站扫描全队，治疗脉冲稳定地穿过每名成员的装甲接口。",
      effects: [
        { type: "HEAL_PARTY", percent: 0.4 },
        { type: "ADJUST_POLLUTION", target: "party", amount: -10 },
      ],
    }],
  },
};
