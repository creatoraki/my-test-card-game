// ============================================================================
// 状态效果注册表 —— 机制在这里(带行为钩子)。只 import 类型 + 规则, 不 import 引擎实现,
// 因此不会与 ops.ts 形成循环依赖(钩子通过 ctx.ops 调用引擎原语)。
// 新增一个状态 = 在此加一条定义。
// ============================================================================

import type { StatusCtx, StatusDef, DamageCtx } from "./types";
import { RULES } from "./rules";

export const STATUS_DEFS: Record<string, StatusDef> = {
  // ---- 持续伤害 ----
  poison: {
    id: "poison",
    name: "中毒",
    emoji: "☠️",
    kind: "debuff",
    desc: "回合开始时受到等同层数的伤害(无视护盾), 然后层数 -1。",
    resistMode: "stacks", // 中毒按层数结算 ⇒ 异常抗性削减层数
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        if (c.inst.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.inst.stacks, {
            flags: ["poison"],
            fixed: true,
            unblockable: true,
          });
        c.inst.stacks -= 1;
      },
    },
  },
  burn: {
    id: "burn",
    name: "灼烧",
    emoji: "🔥",
    kind: "debuff",
    desc: "回合开始时受到等同层数的伤害(无视护盾), 然后层数减半。",
    resistMode: "stacks",
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        if (c.inst.stacks > 0)
          c.ops.dealDamage(c.state, undefined, c.ownerId, c.inst.stacks, {
            flags: ["burn"],
            fixed: true,
            unblockable: true,
          });
        c.inst.stacks = Math.floor(c.inst.stacks / 2);
      },
    },
  },

  // ---- 治疗 ----
  regen: {
    id: "regen",
    name: "再生",
    emoji: "💚",
    kind: "buff",
    desc: "回合开始时回复等同层数的生命, 然后层数 -1。",
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        // 施法者传 undefined —— 再生是状态自身在跳血, 不该再吃一次治愈力/治愈强度。
        if (c.inst.stacks > 0) c.ops.heal(c.state, undefined, c.ownerId, c.inst.stacks);
        c.inst.stacks -= 1;
      },
    },
  },

  // ---- 伤害修正 ----
  strength: {
    id: "strength",
    name: "力量",
    emoji: "💪",
    kind: "buff",
    desc: "造成的攻击伤害 + 层数。持续存在。",
    hooks: {
      modifyOutgoingDamage: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount += c.inst.stacks;
      },
    },
  },
  weak: {
    id: "weak",
    name: "虚弱",
    emoji: "💧",
    kind: "debuff",
    desc: `造成的攻击伤害 ×${RULES.combat.weakMultiplier}。每回合结束层数 -1。`,
    resistMode: "duration", // 层数即持续回合
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.weakMultiplier;
      },
      onRoundEnd: (c: StatusCtx) => {
        c.inst.stacks -= 1;
      },
    },
  },
  vulnerable: {
    id: "vulnerable",
    name: "易伤",
    emoji: "🎯",
    kind: "debuff",
    desc: `受到的伤害 ×${RULES.combat.vulnerableMultiplier}。每回合结束层数 -1。`,
    resistMode: "duration",
    hooks: {
      modifyIncomingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        dmg.amount *= RULES.combat.vulnerableMultiplier;
      },
      onRoundEnd: (c: StatusCtx) => {
        c.inst.stacks -= 1;
      },
    },
  },

  // ---- 反伤 ----
  thorns: {
    id: "thorns",
    name: "荆棘",
    emoji: "🌵",
    kind: "buff",
    desc: "被攻击时对攻击者造成等同层数的伤害。",
    hooks: {
      onAfterAttacked: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack && dmg.sourceId && dmg.sourceId !== c.ownerId)
          c.ops.dealDamage(c.state, c.ownerId, dmg.sourceId, c.inst.stacks, {
            flags: ["thorns"],
            fixed: true,
            unblockable: true,
          });
      },
    },
  },

  // ---- 控制 ----
  // 眩晕的效果在 ai.ts 的 enemyAct 里处理(行动时消耗 1 层并跳过), 这里只提供显示定义。
  stun: {
    id: "stun",
    name: "眩晕",
    emoji: "💫",
    kind: "debuff",
    desc: "无法行动。行动时机到来时消耗 1 层并跳过该次行动。",
    resistMode: "chance", // 开关型控制 ⇒ 异常抗性抵抗的是"是否被施加"
  },

  // ---- 情报 ----
  // 洞察没有引擎侧效果, UI 层(CombatantView)据此决定是否显示该敌人的意图。
  insight: {
    id: "insight",
    name: "洞察",
    emoji: "👁️",
    kind: "buff",
    desc: "可以看见该敌人的攻击意图。",
  },
};

export function getStatusDef(id: string): StatusDef | undefined {
  return STATUS_DEFS[id];
}
