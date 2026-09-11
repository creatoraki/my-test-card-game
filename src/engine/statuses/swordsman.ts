import type { Card, DamageCtx, StatusCtx, StatusDef } from "../types";

function hasCardInHand(state: StatusCtx["state"], cardId: string): boolean {
  return state.hand.some((uid) => state.cards[uid]?.id === cardId);
}

function alliesWithShield(c: StatusCtx, amount: number): void {
  for (const id of c.state.playerIds) {
    const ally = c.state.combatants[id];
    if (ally?.alive) c.ops.gainShield(c.state, c.ownerId, id, amount);
  }
}

export const SWORDSMAN_STATUS_DEFS: Record<string, StatusDef> = {
  mirrorMoon: {
    id: "mirrorMoon",
    name: "镜月",
    emoji: "🌙",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "每丢弃 1 张手牌，全队获得 10% 治愈力的护盾。",
    hooks: {
      onCardDiscarded: (c: StatusCtx) => {
        const amount = c.ops.getStat(c.state, c.ownerId, "healPower") * 0.1;
        alliesWithShield(c, amount);
      },
    },
  },
  ironCloak: {
    id: "ironCloak",
    name: "铁衣",
    emoji: "🛡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "受到的伤害降低 20%。",
    hooks: {
      modifyIncomingDamage: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.amount > 0) dmg.amount *= 0.8;
      },
    },
  },
  windCut: {
    id: "windCut",
    name: "风切",
    emoji: "🌪️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    statModsPct: { hitRate: 10 },
    desc: "命中率 +10%；打出同归属速攻牌时刷新持续时间。",
    hooks: {
      onCardPlayed: (c: StatusCtx, card: Card) => {
        if (card.ownerCharId === c.ownerId && card.cardType === "fast") c.inst.duration = 2;
      },
    },
  },
  zanshin: {
    id: "zanshin",
    name: "残心",
    emoji: "🫀",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "回合开始时获得 1 点法力并抽 2 张牌，随后移除。",
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        if (c.inst.stacks <= 0) return;
        c.state.resources.mana = (c.state.resources.mana ?? 0) + c.inst.stacks;
        c.ops.draw(c.state, 2);
        c.ops.log(c.state, `${c.state.combatants[c.ownerId]?.name ?? "角色"} 的残心生效`);
        c.inst.stacks = 0;
        c.inst.duration = 0;
      },
    },
  },
  zanshinFocus: {
    id: "zanshinFocus",
    name: "残心·凝神",
    emoji: "🎯",
    kind: "buff",
    statModsPct: { critRate: 10 },
    desc: "每层暴击率 +10%。",
  },
  yachiyo: {
    id: "yachiyo",
    name: "八千代",
    emoji: "🌸",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "手牌少于 3 张时，攻击伤害获得加算增伤。",
    hooks: {
      modifyOutgoingDamage: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || !hasCardInHand(c.state, "yachiyo") || c.state.hand.length >= 3) return;
        dmg.bonusPct += c.state.hand.length === 1 ? 40 : 20;
      },
    },
  },
};
