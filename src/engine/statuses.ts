// ============================================================================
// 状态效果注册表 —— 机制在这里(带行为钩子)。只 import 类型 + 规则, 不 import 引擎实现,
// 因此不会与 ops.ts 形成循环依赖(钩子通过 ctx.ops 调用引擎原语)。
// 新增一个状态 = 在此加一条定义。
// ============================================================================

import type { Enemy, StatusCtx, StatusDef, DamageCtx } from "./types";
import { OVERLOAD_STATUS_ID, RULES } from "./rules";
import { alliesOf } from "./targeting";
import { rngPick } from "./rng";

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
    desc: `回合开始时每层回复 ${RULES.combat.regenHealPerStack} 点生命。`,
    hooks: {
      onRoundStart: (c: StatusCtx) => {
        // 施法者传 undefined —— 再生是状态自身在跳血, 不该再吃一次治愈力/治愈强度。
        if (c.inst.stacks > 0)
          c.ops.heal(c.state, undefined, c.ownerId, RULES.combat.regenHealPerStack * c.inst.stacks);
      },
    },
  },

  starlight: {
    id: "starlight",
    name: "星辉",
    emoji: "✨",
    kind: "buff",
    maxStacks: RULES.combat.starlightMax,
    desc: "应星卡牌可以消耗星辉替代法力水晶。",
  },
  ironwall: {
    id: "ironwall",
    name: "铁壁",
    emoji: "🛡️",
    kind: "buff",
    statMods: { defense: RULES.combat.ironwallDefense },
    desc: `每层防御力 +${RULES.combat.ironwallDefense}。`,
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
  overload: {
    id: OVERLOAD_STATUS_ID,
    name: "过载",
    emoji: "☢️",
    kind: "buff",
    desc: `每层: 造成的攻击伤害 +${RULES.combat.overloadDamagePerStack * 100}%, 闪避 +${RULES.combat.overloadDodgePerStack}%。持续存在。`,
    hooks: {
      modifyOutgoingDamage: (c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack)
          dmg.amount *= 1 + RULES.combat.overloadDamagePerStack * c.inst.stacks;
      },
    },
  },
  sharp: {
    id: "sharp",
    name: "锋利",
    emoji: "🗡️",
    kind: "buff",
    maxStacks: 1,
    desc: `造成的攻击伤害 ×${RULES.combat.sharpMultiplier}。不可叠层, 每回合结束层数 -1。`,
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.sharpMultiplier;
      },
      onRoundEnd: (c: StatusCtx) => {
        c.inst.stacks -= 1;
      },
    },
  },
  chargedShell: {
    id: "chargedShell",
    name: "充能外壳",
    emoji: "🔋",
    kind: "buff",
    maxStacks: 1,
    desc: `造成的攻击伤害 ×${RULES.combat.chargedShellDamageMultiplier}。护盾被击破时眩晕 1 层并掉落一张随机归属的废料弹片。`,
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.chargedShellDamageMultiplier;
      },
      onShieldBroken: (c: StatusCtx) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner || owner.team !== "enemy") return;
        const allies = alliesOf(c.state, owner);
        c.ops.applyStatus(c.state, c.ownerId, "stun", 1);
        if (allies.length > 0)
          c.ops.addCardToHand(c.state, "scrap-shrapnel", rngPick(c.state, allies).charId);
        c.inst.stacks = 0;
        const enemy = owner as Enemy;
        enemy.aiMemory ??= {
          actsSinceRecycle: 0,
          hammerCooldown: 0,
          openingDone: true,
          justBrokeShell: false,
        };
        enemy.aiMemory.justBrokeShell = true;
        c.ops.log(c.state, `${owner.emoji} ${owner.name} 的充能外壳被击破`);
      },
    },
  },
  buzhou: {
    id: "buzhou",
    name: "不周山",
    emoji: "🏔️",
    kind: "buff",
    desc: "持续期间体力极限不会下降。每回合结束层数 -1。",
    hooks: {
      onRoundEnd: (c: StatusCtx) => {
        c.inst.stacks -= 1;
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
  // 敌人由 ai.ts 在行动时机消耗眩晕; 我方在回合结束结算, 避免同一层被扣两次。
  stun: {
    id: "stun",
    name: "眩晕",
    emoji: "💫",
    kind: "debuff",
    desc: "无法行动。敌人行动时机到来时消耗 1 层并跳过; 我方角色本回合无法打出其卡牌, 回合结束层数 -1。",
    resistMode: "chance", // 开关型控制 ⇒ 异常抗性抵抗的是"是否被施加"
    hooks: {
      onRoundEnd: (c: StatusCtx) => {
        if (c.state.combatants[c.ownerId]?.team === "player") c.inst.stacks -= 1;
      },
    },
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
  aimed: {
    id: "aimed",
    name: "瞄准",
    emoji: "🎯",
    kind: "debuff",
    maxStacks: 1,
    desc: "被瞄准。下次瞄准卡命中该目标时移除，并触发该卡的瞄准效果。",
  },
  tequila: {
    id: "tequila",
    name: "龙舌兰",
    emoji: "🌵",
    kind: "buff",
    maxStacks: 1,
    statModsPct: { attack: 20 },
    desc: "攻击力 +20%。",
  },
};

export function getStatusDef(id: string): StatusDef | undefined {
  return STATUS_DEFS[id];
}
