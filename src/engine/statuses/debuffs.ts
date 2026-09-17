import type { StatusDef } from "../types";
import { RULES } from "../rules";

export const DEBUFF_STATUS_DEFS: Record<string, StatusDef> = {
  weak: {
    id: "weak",
    name: "虚弱",
    emoji: "💧",
    kind: "debuff",
    stackMode: "add",
    refreshMode: "max",
    resistMode: "duration",
    desc: `造成的攻击伤害 ×${RULES.combat.weakMultiplier}。持续指定拍数。`,
    hooks: {
      modifyOutgoingDamage: (_c, dmg, mods) => {
        if (dmg.isAttack) mods.mulDealt(RULES.combat.weakMultiplier);
      },
    },
  },
  vulnerable: {
    id: "vulnerable",
    name: "易伤",
    emoji: "🎯",
    kind: "debuff",
    stackMode: "add",
    refreshMode: "max",
    resistMode: "duration",
    desc: `受到的伤害 ×${RULES.combat.vulnerableMultiplier}。持续指定拍数。`,
    hooks: {
      modifyIncomingDamage: (_c, _dmg, mods) => {
        mods.mulTaken(RULES.combat.vulnerableMultiplier);
      },
    },
  },
  hunterMark: {
    id: "hunterMark",
    name: "猎人标记",
    emoji: "🔻",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: `受到的伤害 ×${RULES.combat.hunterMarkMultiplier}。持续 1 回合。`,
    hooks: {
      modifyIncomingDamage: (_c, _dmg, mods) => {
        mods.mulTaken(RULES.combat.hunterMarkMultiplier);
      },
    },
  },
  armorBreak: {
    id: "armorBreak",
    name: "破甲",
    emoji: "🩹",
    kind: "debuff",
    stackMode: "add",
    refreshMode: "max",
    statMods: { defense: -5 },
    resistMode: "duration",
    desc: "防御力 -5。持续指定拍数, 未设置时持续存在。",
  },
  attackDown: {
    id: "attackDown",
    name: "萎靡",
    emoji: "📉",
    kind: "debuff",
    stackMode: "add",
    refreshMode: "max",
    statModsPct: { attack: -15 },
    resistMode: "duration",
    desc: "攻击力 -15%。持续指定拍数, 未设置时持续存在。",
  },
  pierce: {
    id: "pierce",
    name: "穿孔",
    emoji: "🕳️",
    kind: "debuff",
    maxStacks: RULES.pierce.max,
    stackMode: "add",
    refreshMode: "keep",
    desc: `每层使受到的伤害 ×${1 + RULES.pierce.perStack}。最多 ${RULES.pierce.max} 层。`,
    hooks: {
      modifyIncomingDamage: (c, _dmg, mods) => {
        mods.mulTaken(1 + c.inst.stacks * RULES.pierce.perStack);
      },
    },
  },
  jam: {
    id: "jam",
    name: "电磁干扰",
    emoji: "📶",
    kind: "debuff",
    stackMode: "add",
    refreshMode: "max",
    statMods: { hitRate: -6 },
    resistMode: "duration",
    desc: "命中率 -6%。持续指定拍数, 未设置时持续存在。",
  },
};
