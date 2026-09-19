import { GROWTH_BALANCE as balance } from "./growthBalance";
import type { CurioDef } from "./types";

export const GROWTH_CURIOS: Record<string, CurioDef> = {
  equipmentCache: {
    name: "遗落的装备箱", role: "loot", verb: "领取", size: 210,
    description: "封条已经松开，箱内留着一件完整装备。无需投入材料即可领取，装备品质仍由当前地图决定。",
    decisions: [{ id: "claim", label: "领取装备", story: "箱盖弹开，一件完整装备被送入待拾取框。", effects: [{ type: "GRANT_EQUIP" }] }],
  },
  fieldTraining: {
    name: "战术训练终端", role: "loot", verb: "训练", size: 210,
    description: `终端保存着可直接使用的战术记录。全队各获得 ${balance.trainingExp} 点卡组经验，并免费抽取一次角色卡牌。`,
    decisions: [{ id: "train", label: "学习战术并免费抽卡", story: "小队共享了战术记录，终端开放了一次无污染的卡牌候选。",
      effects: [{ type: "GAIN_EXP_PARTY", amount: balance.trainingExp }, { type: "FORGE_DRAW" }] }],
  },
  cardExchange: {
    name: "卡牌置换终端", role: "service", verb: "置换", size: 210,
    description: `消耗任意临期食品共 ${balance.replaceFood} 份，将指定角色的一张卡换为随机普通卡。确认卡牌后才扣款，替换会移除原卡及其模组。`,
    decisions: [{ id: "exchange", label: "选择换卡目标", story: "终端开放了本次置换协议，请选择角色和要替换的卡牌。",
      effects: [{ type: "REPLACE_CARD_COMMON", foodCost: balance.replaceFood }] }],
  },
  bondWorkbench: {
    name: "羁绊重铸台", role: "service", verb: "重铸", size: 210,
    description: `消耗任意临期食品 ${balance.bondFood} 份，重新随机一条装备羁绊。装备属性和完美度保持不变，选择装备后才扣款。`,
    decisions: [{ id: "bond", label: "选择装备重铸羁绊", story: "重铸台开始读取装备接口，等待小队指定目标。",
      effects: [{ type: "TUNE_EQUIPMENT", mode: "bond", foodCost: balance.bondFood }] }],
  },
  perfectnessWorkbench: {
    name: "精密校准台", role: "service", verb: "校准", size: 215,
    description: `消耗任意临期食品共 ${balance.perfectnessFood} 份，重新随机装备完美度。保留羁绊与负面代价，尽量沿原属性方向增减数值；结果可能变好或变差。选择装备后才扣款。`,
    decisions: [{ id: "calibrate", label: "选择装备重置完美度", story: "校准台进入精密模式，等待小队指定目标。",
      effects: [{ type: "TUNE_EQUIPMENT", mode: "perfectness", foodCost: balance.perfectnessFood }] }],
  },
  temporaryRelicCache: {
    name: "临时祝福匣", role: "loot", verb: "领取", size: 190,
    description: "匣中封存着一件可直接领取的一次性祝福遗物。它仅在本次探索生效，不能寄回，离开远征后消失。",
    decisions: [{ id: "blessing", label: "领取一次性遗物", story: "封印松开，短暂的祝福化作一件可携带的遗物。",
      effects: [{ type: "GRANT_DISPOSABLE_RELIC" }] }],
  },
  cardArchive: {
    name: "卡组整理终端", role: "service", verb: "整理", size: 210,
    description: "终端可删除一张卡牌，卡组不能低于最小张数。该服务仅在困难及以上探索开放。",
    decisions: [{ id: "remove", label: "选择卡牌删除", story: "终端开放了卡组整理权限。", effects: [{ type: "FORGE_REMOVE" }] }],
  },
};
