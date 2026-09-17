import type { DamageCtx, StatusCtx, StatusDef } from "../types";
import { recordHitPart } from "../animHits";

function playerAttacker(c: StatusCtx, dmg: DamageCtx): boolean {
  const source = dmg.sourceId ? c.state.combatants[dmg.sourceId] : undefined;
  return source?.team === "player";
}

function addStaticAfterShieldHit(c: StatusCtx, dmg: DamageCtx): void {
  if (dmg.blocked > 0 && playerAttacker(c, dmg))
    c.ops.applyStatus(c.state, dmg.sourceId!, "static", 1, undefined, undefined, c.ownerId);
}

function clearOnShieldBroken(c: StatusCtx): void {
  c.inst.stacks = 0;
  c.inst.duration = 0;
}

export const ABANDONED_FLOOR_STATUS_DEFS: Record<string, StatusDef> = {
  static: {
    id: "static",
    name: "静电",
    emoji: "⚡",
    kind: "debuff",
    stackMode: "add",
    resistMode: "stacks",
    desc: "每层静电持续存在。达到 3 层时清空并眩晕 1 拍。",
    hooks: {
      onApplied: (c: StatusCtx) => {
        if (c.inst.stacks < 3) return;
        c.inst.stacks = 0;
        c.inst.duration = 0;
        c.ops.applyStatus(c.state, c.ownerId, "stun", 1, 1, undefined, c.ownerId);
      },
    },
  },
  flammable: {
    id: "flammable",
    name: "易燃",
    emoji: "🧨",
    kind: "debuff",
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    desc: "持有期间，灼烧每拍造成的伤害翻倍。",
  },
  scorched: {
    id: "scorched",
    name: "焦灼",
    emoji: "🌡️",
    kind: "debuff",
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    desc: "持有灼烧时，受到的治疗效果减半。",
    hooks: {
      modifyIncomingHeal: (c: StatusCtx) =>
        c.state.combatants[c.ownerId]?.statuses.some((status) => status.id === "burn" && status.stacks > 0)
          ? 0.5
          : 1,
    },
  },
  salvageArmor: {
    id: "salvageArmor",
    name: "回收装甲",
    emoji: "🛠️",
    kind: "buff",
    maxStacks: 3,
    stackMode: "add",
    refreshMode: "max",
    statMods: { defense: 2 },
    desc: "每层防御力 +2。",
  },
  escort: {
    id: "escort",
    name: "护航",
    emoji: "🛡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "拥有护盾时，分担其他友方受到的单体攻击。攻击护航护盾会使攻击者获得静电。",
    hooks: {
      onGuardAlly: (c: StatusCtx, dmg: DamageCtx) => {
        const holder = c.state.combatants[c.ownerId];
        if (
          !holder ||
          c.inst.stacks <= 0 ||
          holder.shield <= 0 ||
          dmg.guarded ||
          !dmg.isAttack ||
          !dmg.single ||
          !playerAttacker(c, dmg) ||
          dmg.amount <= 0
        ) return;
        const share = Math.round(dmg.amount * 0.4);
        if (share <= 0) return;
        holder.shield = Math.max(0, holder.shield - Math.min(holder.shield, share));
        dmg.amount = Math.max(0, dmg.amount - share);
        dmg.guarded = true;
        recordHitPart(holder.id, 0);
        if (holder.shield === 0) clearOnShieldBroken(c);
      },
      onAfterAttacked: addStaticAfterShieldHit,
      onShieldBroken: clearOnShieldBroken,
    },
  },
  conductiveFilm: {
    id: "conductiveFilm",
    name: "导电薄膜",
    emoji: "🔌",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "薄膜护盾存在期间，攻击命中护盾的角色获得静电。",
    hooks: {
      onAfterAttacked: addStaticAfterShieldHit,
      onShieldBroken: clearOnShieldBroken,
    },
  },
};
