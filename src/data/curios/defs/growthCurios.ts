import { GROWTH_BALANCE as balance } from "../rules/growthBalance";
import { byJob, fail, withItem } from "../rules/helpers";
import type { CurioKind } from "@/explore/corridor/types";
import type { CurioDef } from "../types";

export const GROWTH_CURIOS = {
  equipmentCache: {
    name: "遗落的装备箱", role: "loot", verb: "领取", size: 210,
    description: "封条已经松开，箱内留着一件完整装备。无需投入材料即可领取，装备品质仍由当前地图决定。",
    decisions: [{
      id: "claim", label: "领取装备", story: "箱盖弹开，一件完整装备被送入待拾取框。",
      effects: [{ type: "GRANT_EQUIP" }],
      failure: fail(
        0.15,
        "箱盖弹开的同时触发了连锁警报，守卫循声而来，装备被锁回了箱底。",
        [{ type: "ALARM_BATTLE" }],
        byJob("swordsman", { chanceDelta: -0.15, note: "剑士先一步割断了警报线" }),
      ),
    }],
  },
  bondWorkbench: {
    name: "羁绊重铸台", role: "service", verb: "重铸", size: 210,
    description: `消耗任意临期食品 ${balance.bondFood} 份，重新随机一条装备羁绊；指定系别时只在该系别内重掷，消耗翻倍。装备属性和完美度保持不变，选择装备后才扣款。`,
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
  relicCache: {
    name: "尘封的遗物匣", role: "loot", verb: "开启", size: 190,
    description: "匣子表面落满灰尘，封印仍在微微发光。开启后可直接获得一件随机遗物。",
    decisions: [{
      id: "open", label: "开启遗物匣", story: "封印碎裂，一件遗物从匣底浮起，被送入待拾取框。",
      effects: [{ type: "GRANT_RANDOM_RELIC" }],
      failure: fail(
        0.2,
        "封印碎裂时的反冲灌进执行者体内，遗物的光芒也随之熄灭。",
        [{ type: "ADJUST_POLLUTION", target: "actor", amount: 15 }],
        withItem({ familyId: "holy-water" }, { chanceDelta: -0.2, note: "圣水浸透封印，让它安静地碎开" }),
      ),
    }],
  },
} satisfies Partial<Record<CurioKind, CurioDef>>;
