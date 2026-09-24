// 植物学家施加给敌人的负面状态 —— 捕虫夹、迟滞。二者都在敌人发动招式后移除(expiresOnAct)。

import type { Enemy, StatusCtx, StatusDef } from "../types";
import { RULES } from "../core/battleRules";

export const BOTANIST_FOE_STATUS_DEFS: Record<string, StatusDef> = {
  insectTrap: {
    id: "insectTrap",
    name: "捕虫夹",
    emoji: "🪤",
    kind: "debuff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    expiresOnAct: true,
    desc: "下一次发动招式前，先受到记录的伤害；若因此被击杀，招式取消，植物学家回复 1 点法力。",
    detailStats: (inst) => [{ label: "陷阱伤害", value: Math.round(inst.data?.damage ?? 0) }],
    hooks: {
      onBeforeAct: (c: StatusCtx) => {
        const damage = c.inst.data?.damage ?? 0;
        c.inst.stacks = 0; // 触发即合拢, 由状态清理流程移除
        if (damage <= 0) return;
        const owner = c.state.combatants[c.ownerId];
        const sourceId = c.inst.sourceId && c.state.combatants[c.inst.sourceId]?.alive ? c.inst.sourceId : undefined;
        if (owner) c.ops.log(c.state, `${owner.emoji} ${owner.name} 出招时触发了捕虫夹`);
        c.ops.dealDamage(c.state, sourceId, c.ownerId, damage, { flags: ["insectTrap"], fixed: true });
        if (owner && !owner.alive) {
          const resource = RULES.resource.name;
          c.state.resources[resource] = (c.state.resources[resource] ?? 0) + 1;
          c.ops.log(c.state, "✨ 捕虫夹击杀敌人，回复 1 点法力水晶");
        }
      },
    },
  },
  slow: {
    id: "slow",
    name: "迟滞",
    emoji: "🐌",
    kind: "debuff",
    maxStacks: 2,
    stackMode: "add",
    refreshMode: "keep",
    expiresOnAct: true,
    desc: "每层使当前招式的发动时刻推迟 1；招式发动后移除。",
    hooks: {
      // 只推迟新增的层数: data.delayed 记录已经推迟过多少时刻。
      onApplied: (c: StatusCtx) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner || owner.team !== "enemy") return;
        const enemy = owner as Enemy;
        const data = (c.inst.data ??= {});
        const delta = c.inst.stacks - (data.delayed ?? 0);
        if (delta <= 0 || enemy.nextActTick == null) return;
        enemy.nextActTick += delta;
        data.delayed = c.inst.stacks;
        c.ops.log(c.state, `${enemy.emoji} ${enemy.name} 的${enemy.intent.name}推迟 ${delta} 时刻`);
      },
    },
  },
};
