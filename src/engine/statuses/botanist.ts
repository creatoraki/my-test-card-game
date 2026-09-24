import type { Card, DamageCtx, StatusCtx, StatusDef } from "../types";
import { foesOf } from "../combat/targeting";
import { applyPierce } from "../combat/pierce";

// 菌丝网络: 每名敌人每回合最多因中毒结算获得的穿孔层数。
export const MYCELIUM_PIERCE_CAP_PER_ROUND = 2;

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
  pollen: {
    id: "pollen",
    name: "花粉",
    emoji: "🌼",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "攻击每次命中，为目标附加穿孔；每张牌因此附加的穿孔有上限。",
    detailStats: (inst) => [
      { label: "每次命中", value: inst.data?.perHit ?? 1, suffix: " 层" },
      { label: "每张牌上限", value: inst.data?.cap ?? 2, suffix: " 层" },
    ],
    hooks: {
      onAfterAttack: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.missed || dmg.sourceId !== c.ownerId) return;
        const target = c.state.combatants[dmg.targetId];
        if (!target?.alive || target.team !== "enemy" || c.state.fullDraw.hitIds.includes(dmg.targetId)) return;
        // 出牌结算期间 playedThisRound 尚未追加本张牌, 回合号 + 已出牌数即可唯一标识“这张牌”。
        const data = (c.inst.data ??= {});
        const playKey = c.state.round * 1000 + c.state.playedThisRound.length;
        if (data.playKey !== playKey) {
          data.playKey = playKey;
          data.used = 0;
        }
        const amount = Math.min(data.perHit ?? 1, (data.cap ?? 2) - (data.used ?? 0));
        if (amount <= 0) return;
        data.used = (data.used ?? 0) + applyPierce(c.state, dmg.targetId, amount, c.ownerId);
      },
    },
  },
  bloom: {
    id: "bloom",
    name: "盛放",
    emoji: "🌸",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    durationStartsImmediately: true,
    desc: "本回合打出成熟牌时，其培育效果额外结算一次；打出过熟牌时，其过熟效果额外结算一次。",
  },
  myceliumWeb: {
    id: "myceliumWeb",
    name: "菌丝网络",
    emoji: "🍄",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: `本场战斗中，敌人的中毒每结算一次（包括毒发），为其附加 1 层穿孔；每名敌人每回合最多因此获得 ${MYCELIUM_PIERCE_CAP_PER_ROUND} 层。`,
    hooks: {
      onFoePoisonTick: (c: StatusCtx, victimId: string) => {
        const holder = c.state.combatants[c.ownerId];
        const victim = c.state.combatants[victimId];
        if (!holder?.alive || !victim || victim.team === holder.team) return;
        const data = (c.inst.data ??= {});
        if (data.round !== c.state.round) {
          for (const key of Object.keys(data)) delete data[key];
          data.round = c.state.round;
        }
        const key = `n:${victimId}`;
        if ((data[key] ?? 0) >= MYCELIUM_PIERCE_CAP_PER_ROUND) return;
        if (applyPierce(c.state, victimId, 1, c.ownerId) > 0) data[key] = (data[key] ?? 0) + 1;
      },
    },
  },
};
