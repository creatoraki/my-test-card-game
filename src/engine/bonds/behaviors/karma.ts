// 因果系: 死神(击杀抽牌 / 尸爆 / 免死) · 恶魔(血契 / 低血吸血 / 濒危免费) · 正义(格挡反击 / 闪避反击 / 减益反照)。
// 恶魔 4 与 12 涉及出牌费用, 在 bonds/bondPlay.ts。

import { STATUS_DEFS } from "../../core/hookRegistry";
import { applyStatus, heal, log, ops } from "../../core/ops";
import type { BondBehavior } from "../types";
import { aliveFoes, isAlly, isFoe } from "../bondState";

const DEATH_DRAW_LIMIT = 2;

const death: BondBehavior = {
  afterEnemyDeath: (ctx, targetId) => {
    const { state } = ctx;
    const round = state.bond.round;
    if (round.deathDraws < DEATH_DRAW_LIMIT) {
      round.deathDraws += 1;
      log(state, "死神·收割：击杀抽 1 张牌");
      ops.draw(state, 1);
    }
    if (ctx.tier < 2) return;
    const killed = state.combatants[targetId];
    const amount = killed ? Math.round(killed.maxHp * 0.1) : 0;
    if (amount <= 0) return;
    const others = aliveFoes(state);
    if (!others.length) return;
    log(state, `死神·收割：${killed!.name} 尸爆，波及其余敌人 ${amount} 点`);
    for (const foe of others)
      ops.dealDamage(state, undefined, foe.id, amount, { fixed: true, pure: true, flags: ["bondCorpse"] });
  },
  onDownedFatal: (ctx, dmg) => {
    const { state } = ctx;
    const target = state.combatants[dmg.targetId];
    if (ctx.tier < 3 || !dmg.fatal || state.bond.battle.deathSaveUsed || target?.team !== "player") return;
    state.bond.battle.deathSaveUsed = true;
    dmg.fatal = false;
    target.hp = Math.max(1, Math.round(target.maxHp * 0.3));
    target.hpLimit = Math.max(target.hpLimit, target.hp);
    log(state, `死神·收割：${target.name} 从死亡边缘被拉回`);
  },
};

const devil: BondBehavior = {
  afterDamageDealt: (ctx, dmg) => {
    if (ctx.tier < 2 || dmg.hpLost <= 0 || !isAlly(ctx.state, dmg.sourceId)) return;
    const source = ctx.state.combatants[dmg.sourceId!];
    if (!source?.alive || source.hp >= source.maxHp * 0.5) return;
    const amount = Math.round(dmg.hpLost * 0.2);
    if (amount > 0) heal(ctx.state, undefined, source.id, amount);
  },
};

const justice: BondBehavior = {
  afterDamageDealt: (ctx, dmg) => {
    const { state } = ctx;
    if (!dmg.blockRolled || (dmg.blockReduced ?? 0) <= 0) return;
    if (!isAlly(state, dmg.targetId) || !isFoe(state, dmg.sourceId)) return;
    log(state, "正义·天平：格挡反击");
    ops.dealDamage(state, dmg.targetId, dmg.sourceId!, dmg.blockReduced ?? 0, { fixed: true, pure: true, flags: ["bondRetaliate"] });
  },
  onAttackDodged: (ctx, dmg, amountBefore) => {
    const { state } = ctx;
    if (ctx.tier < 2 || !isAlly(state, dmg.targetId) || !isFoe(state, dmg.sourceId)) return;
    const amount = Math.round(amountBefore * 0.5);
    if (amount <= 0) return;
    log(state, "正义·天平：闪避反击");
    ops.dealDamage(state, dmg.targetId, dmg.sourceId!, amount, { fixed: true, pure: true, flags: ["bondRetaliate"] });
  },
  afterStatusApplied: (ctx, info) => {
    const { state } = ctx;
    const def = STATUS_DEFS[info.statusId];
    if (ctx.tier < 3 || !def || def.kind !== "debuff" || def.mark) return;
    if (!isAlly(state, info.targetId) || !isFoe(state, info.sourceId)) return;
    log(state, `正义·天平：${def.name} 反照给施加者`);
    applyStatus(state, info.sourceId!, info.statusId, info.stacks, info.duration, info.data, info.targetId);
  },
};

export const KARMA_BOND_BEHAVIORS: Record<string, BondBehavior> = { death, devil, justice };
