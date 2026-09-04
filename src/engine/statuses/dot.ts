import type { DamageCtx, StatusCtx, StatusDef } from "../types";

export const DOT_STATUS_DEFS: Record<string, StatusDef> = {
  poison: {
    id: "poison",
    name: "中毒",
    emoji: "☠️",
    kind: "debuff",
    stackMode: "segments",
    desc: "每拍每层受到 1 点伤害(无视护盾, 不降低体力极限), 持续指定回合。",
    resistMode: "stacks",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.stacks, {
            flags: ["poison"],
            fixed: true,
            pure: true,
            unblockable: true,
            noLimitLoss: true,
          });
      },
    },
  },
  burn: {
    id: "burn",
    name: "灼烧",
    emoji: "🔥",
    kind: "debuff",
    stackMode: "segments",
    desc: "每拍每层受到 1 点伤害(无视护盾, 不降低体力极限), 持续指定回合。",
    resistMode: "stacks",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.stacks, {
            flags: ["burn"],
            fixed: true,
            pure: true,
            unblockable: true,
            noLimitLoss: true,
          });
      },
    },
  },
  regen: {
    id: "regen",
    name: "再生",
    emoji: "💚",
    kind: "buff",
    stackMode: "segments",
    desc: "每拍每层回复 1 点生命, 持续指定回合。",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.stacks > 0) c.ops.heal(c.state, undefined, c.ownerId, c.stacks);
      },
    },
  },
  thorns: {
    id: "thorns",
    name: "荆棘",
    emoji: "🌵",
    kind: "buff",
    stackMode: "add",
    refreshMode: "max",
    desc: "被攻击时对攻击者造成等同层数的伤害。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack && dmg.sourceId && dmg.sourceId !== c.ownerId)
          c.ops.dealDamage(c.state, c.ownerId, dmg.sourceId, c.stacks, {
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
    stackMode: "segments",
    desc: "每拍回复施加者治愈力 20% 的生命。",
    hooks: {
      onTempo: (c: StatusCtx) => {
        const healAmount = c.inst.data?.healAmount ?? 0;
        if (healAmount > 0 && c.stacks > 0)
          c.ops.heal(c.state, c.inst.sourceId, c.ownerId, healAmount * c.stacks, { scaled: true });
      },
    },
  },
  cactusCounterattack: {
    id: "cactusCounterattack",
    name: "仙人掌",
    emoji: "🌵",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "拥有护盾时被攻击后, 对攻击者造成其攻击力 30% 的反伤。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.blocked <= 0 || !dmg.sourceId || dmg.sourceId === c.ownerId) return;
        const attacker = c.state.combatants[dmg.sourceId];
        if (!attacker) return;
        c.ops.dealDamage(c.state, c.ownerId, dmg.sourceId, c.ops.getStat(c.state, dmg.sourceId, "attack") * 0.3 * c.stacks, {
          flags: ["cactus"],
          fixed: true,
        });
      },
    },
  },
};