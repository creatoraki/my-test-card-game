// 锋刃系: 力量(重攻) · 战车(集火) · 审判(残血处决)。
// 力量 9 / 战车 9 的「视为速攻」与降费在 bonds/bondPlay.ts 里随出牌结算。

import type { DamageCtx } from "../../types";
import { ops } from "../../core/ops";
import type { BondBehavior, BondCtx } from "../types";
import {
  activeCard,
  addDamageFlags,
  aliveFoes,
  isAlly,
  isFoe,
  isHeavyAttack,
} from "../bondState";

// 我方出牌期的攻击伤害(不含反伤 / 溅射这类羁绊自己打出的固定伤害)。
function isCardAttack(ctx: BondCtx, dmg: DamageCtx): boolean {
  return dmg.isAttack && isAlly(ctx.state, dmg.sourceId) && isFoe(ctx.state, dmg.targetId) && Boolean(ctx.state.activeCardUid);
}

const strength: BondBehavior = {
  afterDamageModified: (ctx, dmg) => {
    if (isCardAttack(ctx, dmg) && isHeavyAttack(activeCard(ctx.state))) addDamageFlags(dmg.flags, "noBlock");
  },
  afterDamageDealt: (ctx, dmg) => {
    if (ctx.tier < 2 || !isCardAttack(ctx, dmg) || !isHeavyAttack(activeCard(ctx.state))) return;
    const amount = Math.round((dmg.hpLost + dmg.blocked) * 0.3);
    if (amount <= 0) return;
    for (const foe of aliveFoes(ctx.state)) {
      if (foe.id === dmg.targetId) continue;
      ops.dealDamage(ctx.state, dmg.sourceId, foe.id, amount, { fixed: true, pure: true, flags: ["bondSplash"] });
    }
  },
};

const chariot: BondBehavior = {
  // 第几次攻击 = 本回合此前打过它的攻击牌张数 + 本张。多段牌每一段读到的都是同一个序号。
  afterDamageModified: (ctx, dmg) => {
    if (!isCardAttack(ctx, dmg)) return;
    const { round, play } = ctx.state.bond;
    if (!play.touched.includes(dmg.targetId)) play.touched.push(dmg.targetId);
    const index = (round.chariotHits[dmg.targetId] ?? 0) + 1;
    if (index >= 2) addDamageFlags(dmg.flags, "mustHit");
    if (index >= 3 && ctx.tier >= 2) addDamageFlags(dmg.flags, "noDefense");
  },
  afterCardPlay: (ctx) => {
    const { round, play } = ctx.state.bond;
    for (const id of play.touched) round.chariotHits[id] = (round.chariotHits[id] ?? 0) + 1;
    play.touched = [];
  },
  onEnemyKilled: (ctx, targetId) => {
    const { round, play } = ctx.state.bond;
    if (ctx.tier < 3 || round.chariotFastUsed) return;
    const attacks = (round.chariotHits[targetId] ?? 0) + (play.touched.includes(targetId) ? 1 : 0);
    if (attacks < 2) return;
    round.chariotFastUsed = true;
    round.chariotFastPending = true;
    ops.log(ctx.state, "战车·驰骋：下一张攻击牌视为速攻");
  },
};

const judgement: BondBehavior = {
  modifyCritChance: (ctx, info) => {
    const target = ctx.state.combatants[info.targetId];
    if (!isAlly(ctx.state, info.sourceId) || !target || target.team !== "enemy") return;
    if (target.maxHp > 0 && target.hp / target.maxHp < 0.3) info.force = true;
  },
  onCritRolled: (ctx, dmg) => {
    if (ctx.tier >= 3 && isAlly(ctx.state, dmg.sourceId)) addDamageFlags(dmg.flags, "noDefense", "pierceShield");
  },
  // 溢伤转移: 暴击击杀, 或上一次转移的伤害又打死了人(可连锁)。
  afterDamageDealt: (ctx, dmg) => {
    if (ctx.tier < 2 || !isAlly(ctx.state, dmg.sourceId) || !isFoe(ctx.state, dmg.targetId)) return;
    if (!(dmg.crit || dmg.flags.includes("bondOverflow")) || (dmg.overkill ?? 0) <= 0) return;
    const next = aliveFoes(ctx.state)
      .filter((foe) => foe.id !== dmg.targetId)
      .sort((a, b) => a.hp - b.hp)[0];
    if (!next) return;
    ops.log(ctx.state, `审判·号角：${dmg.overkill} 点溢出伤害转向 ${next.name}`);
    ops.dealDamage(ctx.state, dmg.sourceId, next.id, dmg.overkill ?? 0, { fixed: true, pure: true, flags: ["bondOverflow"] });
  },
};

export const BLADE_BOND_BEHAVIORS: Record<string, BondBehavior> = { strength, chariot, judgement };
