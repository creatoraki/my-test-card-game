// 咒术师的状态 —— 专属五咒(厄运 / 怨咒 / 封印 / 停摆 / 痛楚)、三种标记(锁魂 / 疫病 / 咒丝)与自身增益。
// 标记以减益形态挂在敌人身上, 但 mark = true: 不计入恶毒种类, 也不会被转移、复制、汇集。

import type { DamageCtx, StatusCtx, StatusDef } from "../types";

const THREAD_SHARE = 0.4; // 咒丝传导比例
const DOOM_CRIT_BONUS = 20; // 厄运: 攻击者暴击率加成(百分点)

// 疫病复制出的减益不会再次扩散: 复制期间关闭所有疫病的监听。
let plagueSpreading = false;

function isLiveAttackHit(dmg: DamageCtx): boolean {
  return dmg.isAttack && !dmg.missed && dmg.hpLost + dmg.blocked > 0;
}

export const HEXER_STATUS_DEFS: Record<string, StatusDef> = {
  doom: {
    id: "doom",
    name: "厄运",
    emoji: "🎲",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    desc: `受到攻击时，攻击者本次暴击率 +${DOOM_CRIT_BONUS}%。`,
    hooks: {
      modifyIncomingCrit: () => DOOM_CRIT_BONUS,
    },
  },
  grudge: {
    id: "grudge",
    name: "怨咒",
    emoji: "🧿",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    desc: "每受到 1 段攻击伤害，额外失去施加者攻击力 10% 的生命；无视防御、格挡与护盾。",
    detailStats: (inst) => [{ label: "每段失去生命", value: Math.round(inst.data?.damage ?? 0) }],
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        const damage = c.inst.data?.damage ?? 0;
        if (damage <= 0 || !isLiveAttackHit(dmg)) return;
        c.ops.loseHp(c.state, c.ownerId, damage);
      },
    },
  },
  seal: {
    id: "seal",
    name: "封印",
    emoji: "📜",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
    resistMode: "duration",
    blocksBuffs: true,
    desc: "无法获得增益。",
  },
  stall: {
    id: "stall",
    name: "停摆",
    emoji: "⏸️",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: "本回合内，我方对持有者打出的攻击牌不推进时刻；群体攻击牌只要目标中有一名持有停摆就不推进。",
  },
  boneRot: {
    id: "boneRot",
    name: "痛楚",
    emoji: "🦴",
    kind: "debuff",
    stackMode: "segments",
    resistMode: "stacks",
    desc: "每拍每层受到 1 点伤害（无视护盾，不降低体力极限），持续 5 回合。每次施加形成独立一段。",
    hooks: {
      onTempo: (c: StatusCtx) => {
        if (c.stacks <= 0) return;
        c.ops.dealDamage(c.state, undefined, c.ownerId, c.stacks, {
          flags: ["boneRot"],
          fixed: true,
          pure: true,
          unblockable: true,
          noLimitLoss: true,
        });
      },
    },
  },
  soulLock: {
    id: "soulLock",
    name: "锁魂",
    emoji: "🔒",
    kind: "debuff",
    mark: true,
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    desc: "不会因行动点达到阈值被强制放大招，下一次抽招不会抽到大招；抽招后移除。不计入减益种类。",
  },
  plague: {
    id: "plague",
    name: "疫病",
    emoji: "🦠",
    kind: "debuff",
    mark: true,
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: "本回合内，持有者每获得 1 种减益，其他所有敌人也获得一份相同的减益；复制出的减益不会再次扩散。不计入减益种类。",
    hooks: {
      onOwnerStatusApplied: (c, info) => {
        if (!info.countsAsDebuff || plagueSpreading || info.stacks <= 0) return;
        plagueSpreading = true;
        try {
          for (const id of c.state.enemyIds) {
            if (id === c.ownerId || !c.state.combatants[id]?.alive) continue;
            c.ops.applyStatus(c.state, id, info.statusId, info.stacks, info.duration, info.data, info.sourceId);
          }
        } finally {
          plagueSpreading = false;
        }
      },
    },
  },
  curseThread: {
    id: "curseThread",
    name: "咒丝",
    emoji: "🕸️",
    kind: "debuff",
    mark: true,
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: `本回合内，持有者受到攻击伤害后，其他持有咒丝的敌人失去该伤害 ${THREAD_SHARE * 100}% 的生命；无视防御、格挡与护盾，不会再次传导。不计入减益种类。`,
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || dmg.missed || dmg.hpLost <= 0) return;
        const share = dmg.hpLost * THREAD_SHARE;
        for (const id of c.state.enemyIds) {
          if (id === c.ownerId) continue;
          const other = c.state.combatants[id];
          if (other?.alive && other.statuses.some((status) => status.id === "curseThread" && status.stacks > 0))
            c.ops.loseHp(c.state, id, share);
        }
      },
    },
  },
  counterHex: {
    id: "counterHex",
    name: "反咒",
    emoji: "🪬",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: "本回合内受到敌方攻击时，对攻击者施加厄运 1 回合。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (!dmg.isAttack || !dmg.sourceId) return;
        const attacker = c.state.combatants[dmg.sourceId];
        if (!attacker?.alive || attacker.team === c.state.combatants[c.ownerId]?.team) return;
        c.ops.applyStatus(c.state, attacker.id, "doom", 1, 1, undefined, c.ownerId);
      },
    },
  },
  hexOath: {
    id: "hexOath",
    name: "咒誓",
    emoji: "🩸",
    kind: "buff",
    undispellable: true,
    maxStacks: 1,
    stackMode: "max",
    desc: "本场战斗中，咒术师的恶毒判定时，目标减益种类视为 +1。",
  },
  witching: {
    id: "witching",
    name: "逢魔",
    emoji: "🌘",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    expiresOnRoundEnd: true,
    desc: "本回合内，咒术师的普通牌每张多推进 1 时刻。",
  },
};
