import type { DamageCtx, StatusDef, StatusCtx } from "../types";
import { growInsurance, settleInsurance } from "../insurance";

function isEnemyAttack(c: StatusCtx, dmg: DamageCtx): boolean {
  return dmg.isAttack && Boolean(dmg.sourceId && c.state.combatants[dmg.sourceId]?.team === "enemy");
}

export const ACTUARY_STATUS_DEFS: Record<string, StatusDef> = {
  insurance: {
    id: "insurance",
    name: "保险",
    emoji: "🧾",
    kind: "buff",
    desc: "状态结束时按保险层数回复生命；受到敌方直接攻击时，层数提升 20%。",
    durationStartsImmediately: true,
    stackMode: "add",
    refreshMode: "max",
    hooks: {
      onAfterAttacked: (c, dmg) => {
        if (isEnemyAttack(c, dmg)) growInsurance(c.state, c.ownerId, c.inst);
      },
      onExpire: (c) => settleInsurance(c.state, c.inst.sourceId, [c.ownerId], 1),
    },
  },
  echo: {
    id: "echo",
    name: "回响",
    emoji: "🔁",
    kind: "buff",
    desc: "回响卡牌的基础效果会同步作用于带有回响的队友。",
    durationStartsImmediately: true,
    maxStacks: 1,
  },
  deductible: {
    id: "deductible",
    name: "免赔",
    emoji: "📉",
    kind: "buff",
    desc: "受到的伤害降低 20%。",
    hooks: {
      modifyIncomingDamage: (_c, dmg) => {
        dmg.amount *= 0.8;
      },
    },
  },
};
