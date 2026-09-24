import type { StatusDef, StatusInstance } from "../types";
import { ILL_OMEN_MARK, PROPHECY_LIST, type ProphecyDef } from "../prophecy/prophecyDefs";

// 预言状态: 只挂在预言家身上, 不可叠加、不可驱散; 期限到时由 onExpire 走落空分支。
function prophecyStatus(def: ProphecyDef): StatusDef {
  return {
    id: def.statusId,
    name: `预言·${def.name}`,
    emoji: def.emoji,
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    undispellable: true,
    ...(def.durationStartsImmediately ? { durationStartsImmediately: true } : {}),
    desc: def.desc,
    ...(def.goal != null
      ? {
          detailStats: (inst: StatusInstance) => [
            { label: "当前进度", value: inst.data?.progress ?? 0, suffix: `/ ${def.goal}` },
          ],
        }
      : {}),
    hooks: {
      onExpire: (c) =>
        c.ops.prophecyEvent(c.state, { type: "expired", statusId: def.statusId, ownerId: c.ownerId }),
    },
  };
}

export const PROPHECY_STATUS_DEFS: Record<string, StatusDef> = {
  ...Object.fromEntries(PROPHECY_LIST.map((def) => [def.statusId, prophecyStatus(def)])),
  [ILL_OMEN_MARK]: {
    id: ILL_OMEN_MARK,
    name: "凶兆",
    emoji: "🦉",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "keep",
    undispellable: true,
    desc: "被预言家的凶兆预言。下次行动若为攻击招式，这次攻击的伤害 -50%。",
    hooks: {
      modifyOutgoingDamage: (c, dmg, mods) => {
        if (dmg.isAttack && c.inst.data?.armed === 1) mods.mulDealt(0.5);
      },
    },
  },
};
