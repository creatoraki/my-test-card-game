import type { DamageCtx, StatusCtx, StatusDef } from "../types";
import { RULES } from "../rules";

export const DEBUFF_STATUS_DEFS: Record<string, StatusDef> = {
  weak: {
    id: "weak",
    name: "虚弱",
    emoji: "💧",
    kind: "debuff",
    resistMode: "duration",
    desc: `造成的攻击伤害 ×${RULES.combat.weakMultiplier}。持续指定拍数。`,
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.weakMultiplier;
      },
    },
  },
  vulnerable: {
    id: "vulnerable",
    name: "易伤",
    emoji: "🎯",
    kind: "debuff",
    resistMode: "duration",
    desc: `受到的伤害 ×${RULES.combat.vulnerableMultiplier}。持续指定拍数。`,
    hooks: {
      modifyIncomingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        dmg.amount *= RULES.combat.vulnerableMultiplier;
      },
    },
  },
  armorBreak: {
    id: "armorBreak",
    name: "破甲",
    emoji: "🩹",
    kind: "debuff",
    statMods: { defense: -5 },
    resistMode: "duration",
    desc: "防御力 -5。持续指定拍数, 未设置时持续存在。",
  },
  attackDown: {
    id: "attackDown",
    name: "萎靡",
    emoji: "📉",
    kind: "debuff",
    statModsPct: { attack: -15 },
    resistMode: "duration",
    desc: "攻击力 -15%。持续指定拍数, 未设置时持续存在。",
  },
  aimed: {
    id: "aimed",
    name: "瞄准",
    emoji: "🎯",
    kind: "debuff",
    maxStacks: 1,
    desc: "被瞄准。下次瞄准卡命中该目标时移除, 并触发该卡的瞄准效果。",
  },
};