import type { StatusDef } from "../types";
import { germinate } from "../ecoArk/germination";
import { ARK } from "../ecoArk/shared";
import { gardenDamageMultiplier } from "../ecoArk/guard";

export const ECO_ARK_STATUS_DEFS: Record<string, StatusDef> = {
  arkCollateral: {
    id: "arkCollateral", name: "押品", emoji: "🔒", kind: "buff",
    maxStacks: 1, undispellable: true,
    desc: "扣押卡牌与法力水晶。持续时间：永久；击杀持有押品的敌人后返还，不可支付水晶赎回。",
  },
  arkNamedBurst: {
    id: "arkNamedBurst", name: "点名齐射", emoji: "🎯", kind: "buff",
    maxStacks: 1, expiresOnAct: true, aims: true,
    desc: "锁定点名齐射的攻击目标。蓄力期间，角色打出卡牌会将点名转移到该角色。持续时间：永久；发动齐射或取消蓄力后移除。",
  },
  arkRootReturn: {
    id: "arkRootReturn", name: "根网回灌", emoji: "🌱", kind: "buff", maxStacks: 1,
    desc: "每次孢子萌发，治疗生命比例最低的同伴 8 点。持续时间：永久。",
  },
  arkGardenShelter: {
    id: "arkGardenShelter", name: "园丁庇护", emoji: "🌿", kind: "buff", maxStacks: 1,
    desc: "庇护其他怪物，使其连续受到同一角色的攻击牌攻击时伤害减半。多只园丁不叠加，可互相庇护。持续时间：永久。",
  },
  arkGardenProtected: {
    id: "arkGardenProtected", name: "受到庇护", emoji: "🌿", kind: "buff", maxStacks: 1,
    desc: "连续受到同一角色的攻击牌攻击时，伤害减半。每张牌只更新一次记忆，未命中不更新。提供庇护的园丁死亡后解除。持续时间：永久。",
    hooks: { modifyIncomingDamage: (c, dmg, mods) => mods.mulTaken(gardenDamageMultiplier(c.state, dmg)) },
  },
  [ARK.spore]: {
    id: ARK.spore, name: "孢子", emoji: "🍄", kind: "debuff",
    stackMode: "add", resistMode: "stacks",
    desc: "不会自然衰减，可被净化。满 3 层立即萌发并清空：随机缠住 2 张所属手牌，并获得 2 层中毒，持续 3 拍；没有所属手牌也会触发萌发治疗。",
    detailStats: (inst) => [{ label: "距萌发还差", value: Math.max(0, 3 - inst.stacks), suffix: "层" }],
    hooks: { onApplied: (c) => { if (c.inst.stacks >= 3) germinate(c.state, c.ownerId); } },
  },
  [ARK.pods]: {
    id: ARK.pods, name: "寄生种荚", emoji: "🌰", kind: "debuff",
    stackMode: "max", maxStacks: 1, refreshMode: "override", resistMode: "duration",
    desc: "该角色每打出一张牌，获得 1 层持续 2 拍的中毒，无触发次数上限。寄生种荚自身持续 3 拍，再次施加刷新持续时间；可被净化。",
  },
};
