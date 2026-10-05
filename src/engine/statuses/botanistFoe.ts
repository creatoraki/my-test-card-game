// 植物学家施加给敌人的负面状态 —— 捕虫夹(下一次出招被削弱并催熟花园)、迟滞(连续推迟 2 次招式)。

import type { Enemy, StatusCtx, StatusDef } from "../types";
import { advanceCultivate, cultivateCanAdvance } from "../deck/cultivate";

// 捕虫夹: 触发那一招的伤害倍率。
export const INSECT_TRAP_DAMAGE_MULT = 0.7;
// 迟滞: 对接下来几次招式生效。
export const SLOW_ACTS = 2;

function delaySlowedMove(c: StatusCtx, delta: number): void {
  const owner = c.state.combatants[c.ownerId];
  if (!owner || owner.team !== "enemy" || delta <= 0) return;
  const enemy = owner as Enemy;
  if (enemy.nextActTick == null) return;
  enemy.nextActTick += delta;
  (c.inst.data ??= {}).delayed = (c.inst.data.delayed ?? 0) + delta;
  c.ops.log(c.state, `${enemy.emoji} ${enemy.name} 的${enemy.intent.name}推迟 ${delta} 时刻`);
}

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
    desc: `下一次发动招式时，本次招式伤害降低 ${Math.round((1 - INSECT_TRAP_DAMAGE_MULT) * 100)}%，并且手牌中所有生长中的培育牌推进 1 层。触发后移除。`,
    hooks: {
      onBeforeAct: (c: StatusCtx) => {
        const data = (c.inst.data ??= {});
        if (data.armed) return;
        data.armed = 1;
        const owner = c.state.combatants[c.ownerId];
        if (owner) c.ops.log(c.state, `${owner.emoji} ${owner.name} 出招时触发了捕虫夹`);
        for (const uid of [...c.state.hand]) {
          const card = c.state.cards[uid];
          if (card && cultivateCanAdvance(card)) advanceCultivate(c.state, card, 1);
        }
      },
      // 只削弱触发那一招: 出招结束后由 expiresOnAct 移除。
      modifyOutgoingDamage: (c, _dmg, mods) => {
        if (c.inst.data?.armed) mods.mulDealt(INSECT_TRAP_DAMAGE_MULT);
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
    desc: `每层使该敌人招式的发动时刻推迟 1；持续 ${SLOW_ACTS} 拍：对接下来的 ${SLOW_ACTS} 次招式都生效，第 ${SLOW_ACTS} 次招式发动后移除。`,
    detailStats: (inst) => [{ label: "剩余招式", value: inst.data?.acts ?? SLOW_ACTS, suffix: " 次" }],
    hooks: {
      // 重新获得时刷新为 2 拍; 当前招式只补推新增的层数(data.delayed 记录已推迟的时刻)。
      onApplied: (c: StatusCtx) => {
        const data = (c.inst.data ??= {});
        data.acts = SLOW_ACTS;
        delaySlowedMove(c, c.inst.stacks - (data.delayed ?? 0));
      },
      onAfterAct: (c: StatusCtx) => {
        const data = (c.inst.data ??= {});
        data.acts = (data.acts ?? SLOW_ACTS) - 1;
        data.delayed = 0;
        if (data.acts <= 0) c.inst.stacks = 0; // 由状态清理流程移除
      },
      // 新招式开始蓄力: 按当前层数推迟。
      onCharge: (c: StatusCtx) => {
        const data = (c.inst.data ??= {});
        delaySlowedMove(c, c.inst.stacks - (data.delayed ?? 0));
      },
    },
  },
};
