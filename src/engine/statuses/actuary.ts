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
  // 假装受伤 —— 急诊模组的产物: 只作为「本回合被打过」的替身标记, 自身不带任何结算钩子。
  // ★ durationStartsImmediately: 与保险同一口径, 持续 N 回合 = 含施加当回合在内的 N 个回合,
  //   所以 duration 1 正好只覆盖打出模组卡的这一回合。
  feignInjury: {
    id: "feignInjury",
    name: "假装受伤",
    emoji: "🎭",
    kind: "buff",
    desc: "持续期间自身视为本回合已被攻击，可直接触发急诊。",
    durationStartsImmediately: true,
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "max",
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
