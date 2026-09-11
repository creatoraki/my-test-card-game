import type { DamageCtx, HealCtx, StatusCtx, StatusDef } from "../types";
import { alliesOf } from "../targeting";

function lowestHpAlly(c: StatusCtx) {
  const owner = c.state.combatants[c.ownerId];
  if (!owner) return undefined;
  return alliesOf(c.state, owner).reduce((lowest, current) =>
    current.hp < lowest.hp ? current : lowest,
  );
}

function markAttacker(c: StatusCtx, dmg: DamageCtx): void {
  if (dmg.sourceId && dmg.sourceId !== c.ownerId)
    c.ops.applyStatus(c.state, dmg.sourceId, "aimed", 1);
}

export const BOTANIST_STATUS_DEFS: Record<string, StatusDef> = {
  twinFlower: {
    id: "twinFlower",
    name: "双生花",
    emoji: "🌼",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下回合开始为当前生命最低的存活队友治疗。",
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        const target = lowestHpAlly(c);
        const healAmount = c.inst.data?.healAmount ?? 0;
        if (target && healAmount > 0)
          c.ops.heal(c.state, c.inst.sourceId, target.id, healAmount, { scaled: true, single: true });
      },
    },
  },
  rootBond: {
    id: "rootBond",
    name: "根系联结",
    emoji: "🌿",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    desc: "持有者受到单体治疗时，其余队友各获得治疗量 40% 的治疗。",
    hooks: {
      onHealed: (c: StatusCtx, heal: HealCtx) => {
        if (!heal.single || heal.splash || heal.healed <= 0) return;
        const share = heal.healed * 0.4;
        for (const id of c.state.playerIds) {
          const ally = c.state.combatants[id];
          if (ally?.alive && id !== c.ownerId)
            c.ops.heal(c.state, undefined, id, share, { splash: true });
        }
      },
    },
  },
  thornCrown: {
    id: "thornCrown",
    name: "棘冠",
    emoji: "👑",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "受到攻击后，使攻击者获得 1 层被瞄准。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) markAttacker(c, dmg);
      },
    },
  },
  ivyThorn: {
    id: "ivyThorn",
    name: "常春藤刺",
    emoji: "🍃",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "护盾被击破时，使攻击者获得 1 层被瞄准。",
    hooks: {
      onShieldBroken: (c: StatusCtx, dmg: DamageCtx) => markAttacker(c, dmg),
    },
  },
  aimLock: {
    id: "aimLock",
    name: "锚定瞄准",
    emoji: "🔒",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "下一次触发瞄准时保留被瞄准状态。",
  },
};
