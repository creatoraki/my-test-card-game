import type { Card, DamageCtx, StatusCtx, StatusDef } from "../types";
import { foesOf } from "../combat/targeting";

export const BOTANIST_STATUS_DEFS: Record<string, StatusDef> = {
  thornCrown: {
    id: "thornCrown",
    name: "棘冠",
    emoji: "👑",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "受到攻击时，为攻击者附加 2 层穿孔。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack && dmg.sourceId && dmg.sourceId !== c.ownerId)
          c.ops.applyStatus(c.state, dmg.sourceId, "pierce", 2, undefined, undefined, c.ownerId);
      },
    },
  },
  halfDraw: {
    id: "halfDraw",
    name: "半熟保鲜",
    emoji: "🥭",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "本回合下一次满弓只移除所需穿孔层数的一半。",
  },
  agaveBloom: {
    id: "agaveBloom",
    name: "龙舌花信",
    emoji: "🌺",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "本回合下一次攻击命中时，为目标附加 1 层穿孔，然后移除本状态。",
    hooks: {
      onAfterAttack: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.missed || dmg.sourceId !== c.ownerId) return;
        c.ops.applyStatus(c.state, dmg.targetId, "pierce", 1, undefined, undefined, c.ownerId);
        c.inst.stacks = 0;
      },
    },
  },
  debuffImmune: {
    id: "debuffImmune",
    name: "免疫",
    emoji: "🛡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "持续期间免疫负面状态。",
  },
  rootNetwork: {
    id: "rootNetwork",
    name: "根系网络",
    emoji: "🌿",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "培育牌成熟时对所有敌人穿孔 1；过熟时对穿孔最多的敌人穿孔 1。",
    hooks: {
      onCultivateStage: (c: StatusCtx, _card: Card, stage) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner?.alive) return;
        const foes = foesOf(c.state, owner);
        if (stage === "mature") {
          for (const foe of foes) c.ops.applyStatus(c.state, foe.id, "pierce", 1, undefined, undefined, c.ownerId);
        } else if (stage === "overripe") {
          const targetId = foes.reduce<string | undefined>((bestId, foe) => {
            if (!bestId) return foe.id;
            const best = c.state.combatants[bestId];
            const bestStacks = best?.statuses.find((status) => status.id === "pierce")?.stacks ?? 0;
            const currentStacks = foe.statuses.find((status) => status.id === "pierce")?.stacks ?? 0;
            return currentStacks > bestStacks ? foe.id : bestId;
          }, undefined);
          if (targetId) c.ops.applyStatus(c.state, targetId, "pierce", 1, undefined, undefined, c.ownerId);
        }
      },
    },
  },
};
