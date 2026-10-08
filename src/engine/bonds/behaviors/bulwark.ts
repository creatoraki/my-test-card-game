// 壁垒系: 高塔(碎盾反击) · 女祭司(溢疗与净化) · 皇帝(分担与伤害上限)。
// 女祭司 9 的「单体治疗变全体」与皇帝 8 的群攻收束都在 bonds/bondTargets.ts 改写目标。

import type { BattleState } from "../../types";
import { STATUS_DEFS } from "../../core/hookRegistry";
import { log, loseHp, ops } from "../../core/ops";
import type { BondBehavior } from "../types";
import { aliveAllies, aliveFoes, isAlly, isFoe } from "../bondState";
import { effectiveTargeting } from "../../deck/cultivate";
import { activeEffectsOf } from "../../cards/cardEffects";

const TOWER_SHIELD_COST = 8;

const tower: BondBehavior = {
  onShieldBroken: (ctx, dmg, shieldBefore) => {
    const { state } = ctx;
    if (!isAlly(state, dmg.targetId) || !isFoe(state, dmg.sourceId) || shieldBefore <= 0) return;
    const targets = ctx.tier >= 3 ? aliveFoes(state).map((foe) => foe.id) : [dmg.sourceId!];
    log(state, `高塔·崩塌：碎盾反击 ${shieldBefore} 点`);
    for (const id of targets)
      ops.dealDamage(state, dmg.targetId, id, shieldBefore, { fixed: true, pure: true, flags: ["bondRetaliate"] });
  },
  modifyStatusApply: (ctx, info) => {
    if (ctx.tier < 2 || info.stacks <= 0 || info.cancelled) return;
    const def = STATUS_DEFS[info.statusId];
    const target = ctx.state.combatants[info.targetId];
    if (!def || def.kind !== "debuff" || def.mark || target?.team !== "player") return;
    if (target.shield < TOWER_SHIELD_COST) return;
    target.shield -= TOWER_SHIELD_COST;
    info.cancelled = true;
    log(ctx.state, `高塔·崩塌：${target.name} 失去 ${TOWER_SHIELD_COST} 点护盾，抵消了 ${def.name}`);
  },
};

// 移除一个可驱散的减益: 优先剩余持续最短的。
function removeOneDebuff(state: BattleState, unitId: string): string | null {
  const unit = state.combatants[unitId];
  if (!unit) return null;
  const candidates = unit.statuses.filter((status) => {
    const def = STATUS_DEFS[status.id];
    return status.stacks > 0 && def?.kind === "debuff" && !def.mark && !def.undispellable;
  });
  if (!candidates.length) return null;
  const pick = candidates.reduce((best, cur) =>
    (cur.duration ?? Infinity) < (best.duration ?? Infinity) ? cur : best);
  unit.statuses = unit.statuses.filter((status) => status !== pick);
  return STATUS_DEFS[pick.id]?.name ?? pick.id;
}

const priestess: BondBehavior = {
  // 9 档: 本回合第一张「治疗主目标」的单体治疗牌改为作用于全队(目标改写见 bonds/bondTargets)。
  beforeCardEffects: (ctx, card) => {
    const { state } = ctx;
    if (ctx.tier < 3 || state.bond.round.priestessUsed || effectiveTargeting(card) !== "ally") return;
    const singleHeal = activeEffectsOf(card).some((effect) =>
      effect.type === "HEAL" && (effect.target ?? "primary") === "primary");
    if (!singleHeal) return;
    state.bond.round.priestessUsed = true;
    state.bond.play.healAll = true;
    log(state, `女祭司·帷幕：${card.name} 改为治疗全队`);
  },
  afterCardPlay: (ctx) => {
    ctx.state.bond.play.healAll = false;
  },
  afterHeal: (ctx, info) => {
    const { state } = ctx;
    const target = state.combatants[info.targetId];
    if (!target || target.team !== "player" || !target.alive) return;
    if (info.overflow > 0) {
      ops.gainShield(state, undefined, target.id, info.overflow);
    }
    if (ctx.tier >= 2 && info.sourceId && info.hpBefore < target.maxHp * 0.3) {
      const removed = removeOneDebuff(state, target.id);
      if (removed) log(state, `女祭司·帷幕：${target.name} 的${removed}被移除`);
    }
  },
};

const emperor: BondBehavior = {
  beforeHpLoss: (ctx, dmg) => {
    const { state } = ctx;
    const target = state.combatants[dmg.targetId];
    if (!target || target.team !== "player") return;
    // 4 档: 敌人单体攻击由生命最高的另一名队友代为承受 30%(直接扣护盾 / 生命)。
    if (dmg.single && dmg.isAttack && isFoe(state, dmg.sourceId) && !dmg.guarded) {
      const guardian = aliveAllies(state)
        .filter((ally) => ally.id !== target.id && ally.hp > 0)
        .sort((a, b) => b.hp - a.hp)[0];
      const share = Math.round(dmg.amount * 0.3);
      if (guardian && share > 0) {
        dmg.amount -= share;
        const absorbed = Math.min(guardian.shield, share);
        guardian.shield -= absorbed;
        log(state, `皇帝·王座：${guardian.name} 代为承受 ${share} 点伤害`);
        if (share - absorbed > 0) loseHp(state, guardian.id, share - absorbed);
      }
    }
    // 12 档: 单次伤害不超过最大生命的 25%。
    if (ctx.tier >= 3) {
      const cap = Math.ceil(target.maxHp * 0.25);
      if (dmg.amount > cap) {
        log(state, `皇帝·王座：${target.name} 本次伤害被压到 ${cap} 点`);
        dmg.amount = cap;
      }
    }
  },
};

export const BULWARK_BOND_BEHAVIORS: Record<string, BondBehavior> = { tower, priestess, emperor };
