import type { Ally, DamageCtx, StatusCtx, StatusDef } from "../types";
import { OVERLOAD_STATUS_ID, RULES } from "../rules";
import { rngPick } from "../rng";

export const BUFF_STATUS_DEFS: Record<string, StatusDef> = {
  starlight: {
    id: "starlight",
    name: "星辉",
    emoji: "✨",
    kind: "buff",
    maxStacks: RULES.combat.starlightMax,
    stackMode: "add",
    refreshMode: "max",
    desc: "应星卡牌可以消耗星辉替代法力水晶。",
  },
  ironwall: {
    id: "ironwall",
    name: "铁壁",
    emoji: "🛡️",
    kind: "buff",
    stackMode: "add",
    refreshMode: "max",
    statMods: { defense: RULES.combat.ironwallDefense },
    desc: `每层防御力 +${RULES.combat.ironwallDefense}。`,
  },
  strength: {
    id: "strength",
    name: "力量",
    emoji: "💪",
    kind: "buff",
    stackMode: "add",
    refreshMode: "max",
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
    stackMode: "add",
    refreshMode: "max",
    desc: `每层: 闪避 +${RULES.combat.overloadDodgePerStack}%。持续存在。`,
  },
  sharp: {
    id: "sharp",
    name: "锋利",
    emoji: "🗡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: `造成的攻击伤害 ×${RULES.combat.sharpMultiplier}。持续指定拍数。`,
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.sharpMultiplier;
      },
    },
  },
  chargedShell: {
    id: "chargedShell",
    name: "充能外壳",
    emoji: "🔋",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: `造成的攻击伤害 ×${RULES.combat.chargedShellDamageMultiplier}。护盾被击破时眩晕 1 拍并掉落一张随机归属的废料弹片。`,
    hooks: {
      modifyOutgoingDamage: (_c: StatusCtx, dmg: DamageCtx) => {
        if (dmg.isAttack) dmg.amount *= RULES.combat.chargedShellDamageMultiplier;
      },
      onShieldBroken: (c: StatusCtx) => {
        const owner = c.state.combatants[c.ownerId];
        if (!owner || owner.team !== "enemy") return;
        const allies = c.state.playerIds
          .map((id) => c.state.combatants[id])
          .filter((combatant): combatant is Ally => combatant.alive && combatant.team === "player");
        c.ops.applyStatus(c.state, c.ownerId, "stun", 1, 1);
        if (allies.length > 0)
          c.ops.addCardToHand(c.state, "scrap-shrapnel", rngPick(c.state, allies).charId);
        c.inst.stacks = 0;
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
    desc: "持续期间体力极限不会下降。持续指定拍数。",
  },
  insight: {
    id: "insight",
    name: "洞察",
    emoji: "👁️",
    kind: "buff",
    desc: "可以看见该敌人的攻击意图。",
  },
  tequila: {
    id: "tequila",
    name: "龙舌兰",
    emoji: "🌵",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    statModsPct: { attack: 20 },
    desc: "攻击力 +20%。",
  },
  defenseUp: {
    id: "defenseUp",
    name: "坚固",
    emoji: "🛡️",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    statModsPct: { defense: 20 },
    desc: "防御力 +20%。",
  },
  taunt: {
    id: "taunt",
    name: "嘲讽",
    emoji: "💢",
    kind: "buff",
    maxStacks: 1,
    stackMode: "max",
    refreshMode: "override",
    desc: "持续指定拍数, 敌人优先攻击该目标。",
  },
};