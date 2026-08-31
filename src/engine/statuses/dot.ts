import type { DamageCtx, StatusCtx, StatusDef } from "../types";
import { RULES } from "../rules";

export const DOT_STATUS_DEFS: Record<string, StatusDef> = {
  poison: {
    id: "poison",
    name: "中毒",
    emoji: "☠️",
    kind: "debuff",
    decay: "one",
    desc: `每拍每层受到 ${RULES.combat.poisonDamagePerStack} 点伤害(无视护盾), 然后层数 -1。`,
    resistMode: "stacks",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.inst.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.inst.stacks * RULES.combat.poisonDamagePerStack, {
            flags: ["poison"],
            fixed: true,
            pure: true,
            unblockable: true,
          });
      },
    },
  },
  burn: {
    id: "burn",
    name: "灼烧",
    emoji: "🔥",
    kind: "debuff",
    decay: "half",
    desc: "每拍受到等同层数的伤害(无视护盾), 然后层数减半。",
    resistMode: "stacks",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.inst.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.inst.stacks, {
            flags: ["burn"],
            fixed: true,
            pure: true,
            unblockable: true,
          });
      },
    },
  },
  regen: {
    id: "regen",
    name: "再生",
    emoji: "💚",
    kind: "buff",
    desc: `每拍每层回复 ${RULES.combat.regenHealPerStack} 点生命。`,
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.inst.stacks > 0)
          c.ops.heal(c.state, undefined, c.ownerId, RULES.combat.regenHealPerStack * c.inst.stacks);
      },
    },
  },
  thorns: {
    id: "thorns",
    name: "荆棘",
    emoji: "🌵",
    kind: "buff",
    desc: "被攻击时对攻击者造成等同层数的伤害。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack && dmg.sourceId && dmg.sourceId !== c.ownerId)
          c.ops.dealDamage(c.state, c.ownerId, dmg.sourceId, c.inst.stacks, {
            flags: ["thorns"],
            fixed: true,
            unblockable: true,
          });
      },
    },
  },
  vitality: {
    id: "vitality",
    name: "生机",
    emoji: "🌱",
    kind: "buff",
    desc: "每拍回复施加者治愈力 20% 的生命。",
    hooks: {
      onTempo: (c: StatusCtx) => {
        const healAmount = c.inst.data?.healAmount ?? 0;
        if (healAmount > 0 && c.inst.stacks > 0)
          c.ops.heal(c.state, c.inst.sourceId, c.ownerId, healAmount * c.inst.stacks, { scaled: true });
      },
    },
  },
  cactusCounterattack: {
    id: "cactusCounterattack",
    name: "仙人掌",
    emoji: "🌵",
    kind: "buff",
    maxStacks: 1,
    desc: "拥有护盾时被攻击后, 对攻击者造成其攻击力 30% 的反伤。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.blocked <= 0 || !dmg.sourceId || dmg.sourceId === c.ownerId) return;
        const attacker = c.state.combatants[dmg.sourceId];
        if (!attacker) return;
        c.ops.dealDamage(c.state, c.ownerId, dmg.sourceId, c.ops.getStat(c.state, dmg.sourceId, "attack") * 0.3 * c.inst.stacks, {
          flags: ["cactus"],
          fixed: true,
        });
      },
    },
  },
};