// ============================================================================
// 伤害结算管线。★ 非固定伤害的结算顺序是硬规定(《角色养成设计.md》3.3):
//     乘区修正 → 命中前 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → 扣血前 → HP → 结算后
//   固定伤害跳过"防御"与"格挡"两段, 但仍可被护盾吸收。
// 新机制优先写成状态/遗物钩子, 不要在这里按状态 id 写特判。
// ============================================================================

import type { BattleState, Combatant, DamageCtx, DamageOpts, DamageResult } from "../types";
import { RULES } from "../rules";
import { rngFloat } from "../rng";
import { critChance, defenseMultiplier, hitChance, statOf } from "../stats";
import { noteChallengeDamage } from "../challenges";
import { recordHitPart } from "../animHits";
import { runRelicHook } from "../relicBehaviors/types";
import { cleanup, log, markDead, ops } from "../ops";
import { runGuardHooks, runStatusHooks } from "./hooks";
import { applyDamageModifiers, collectDamageModifiers, createDamageCtx } from "./modifiers";

// 掷一次百分点概率(0~100)。走战斗 RNG, 保证同种子可复现。
function roll(state: BattleState, chancePct: number): boolean {
  if (chancePct <= 0) return false;
  if (chancePct >= 100) return true;
  return rngFloat(state) * 100 < chancePct;
}

function noteAttacked(state: BattleState, dmg: DamageCtx): void {
  const source = dmg.sourceId ? state.combatants[dmg.sourceId] : undefined;
  const target = state.combatants[dmg.targetId];
  if (!dmg.isAttack || source?.team !== "enemy" || target?.team !== "player") return;
  if (!state.attackedThisRound.includes(target.id)) state.attackedThisRound.push(target.id);
  ops.firePassive(state, { type: "allyAttacked", targetId: target.id });
  ops.fireRelic(state, { type: "allyAttacked", targetId: target.id });
}

function markMissed(dmg: DamageCtx): "missed" {
  dmg.missed = true;
  dmg.amount = 0;
  recordHitPart(dmg.targetId, 0, true);
  return "missed";
}

// 命中与暴击。返回 false 表示本次攻击落空。
function rollHitAndCrit(state: BattleState, dmg: DamageCtx, src: Combatant | undefined, target: Combatant, opts: DamageOpts): boolean {
  if (!dmg.isAttack || !src) return true;
  if (!opts.mustHit && !roll(state, hitChance(state, src, target, opts.hitBonus ?? 0))) {
    log(state, `${target.emoji} ${target.name} 闪避了这次攻击`);
    return false;
  }
  if (roll(state, critChance(state, src))) {
    dmg.crit = true;
    opts.onCrit?.();
    dmg.amount *= statOf(src, "critDamage") / 100;
  }
  return true;
}

function applyDefenseAndBlock(state: BattleState, dmg: DamageCtx, src: Combatant | undefined, target: Combatant): void {
  if (dmg.fixed) return;
  dmg.amount *= defenseMultiplier(target, src);
  if (roll(state, statOf(target, "blockRate"))) {
    dmg.blockRolled = true;
    dmg.amount *= RULES.combat.blockReduction;
  }
}

function absorbByShield(dmg: DamageCtx, target: Combatant, opts: DamageOpts): void {
  if (opts.unblockable || target.shield <= 0) return;
  const absorbed = Math.min(target.shield, dmg.amount);
  target.shield -= absorbed;
  dmg.amount -= absorbed;
  dmg.blocked = absorbed;
}

// 受击后的联动: 荆棘、护盾击破、暴击遗物、同伴受击等。
function runAfterHit(state: BattleState, dmg: DamageCtx, target: Combatant, shieldBefore: number): void {
  runStatusHooks(state, target.id, "onAfterAttacked", dmg);
  if (shieldBefore > 0 && target.shield === 0) runStatusHooks(state, target.id, "onShieldBroken", dmg);
  if (dmg.crit) runRelicHook(state, "onCrit", dmg);
}

// 我方濒死时再挨打: 不扣 HP, 改掷死亡骰。仍算一次受击。
function resolveDowned(state: BattleState, dmg: DamageCtx, target: Combatant, shieldBefore: number): "hit" {
  dmg.downed = true;
  dmg.fatal = roll(state, RULES.combat.downedDeathChance);
  runRelicHook(state, "onDownedFatal", dmg);
  dmg.amount = 0;
  dmg.hpLost = 0;
  log(state, `${target.emoji} ${target.name} ${dmg.fatal ? "没能撑住" : "顶住了这次攻击"}`);

  runAfterHit(state, dmg, target, shieldBefore);
  if (dmg.sourceId) {
    runStatusHooks(state, dmg.sourceId, "onAfterAttack", dmg);
    const source = state.combatants[dmg.sourceId];
    if (source) cleanup(source);
  }
  noteAttacked(state, dmg);
  cleanup(target);
  if (dmg.fatal) markDead(state, target);
  recordHitPart(target.id, 0);
  return "hit";
}

function applyHpLoss(state: BattleState, dmg: DamageCtx, target: Combatant, opts: DamageOpts): void {
  if (target.team === "player" && target.hp > 0 && dmg.amount > 0 && !opts.noLimitLoss && !dmg.keepHpLimit)
    target.hpLimit = Math.max(1, target.hp);
  target.hp = target.team === "player" ? Math.max(0, target.hp - dmg.amount) : target.hp - dmg.amount;
  dmg.hpLost = dmg.amount;
  opts.onDealt?.(dmg.hpLost);
  recordHitPart(target.id, dmg.hpLost, false, dmg.crit);

  const marks =
    (dmg.crit ? " 暴击!" : "") +
    (dmg.blockRolled ? "(格挡)" : "") +
    (dmg.blocked > 0 ? `(护盾挡下 ${dmg.blocked})` : "");
  log(state, `${target.emoji} ${target.name} 受到 ${dmg.hpLost} 点伤害${marks}`);
  noteChallengeDamage(state, dmg.sourceId, target.id, dmg.hpLost);
}

export function dealDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: DamageOpts = {},
): DamageResult {
  const target = state.combatants[targetId];
  if (!target || !target.alive) return null;
  const hpBefore = target.hp;
  const src = sourceId ? state.combatants[sourceId] : undefined;
  const dmg = createDamageCtx(sourceId, targetId, amount, opts);

  // ---- 0. 乘区修正(纯计算) ----
  dmg.amount = applyDamageModifiers(dmg.amount, collectDamageModifiers(state, dmg, opts.pure));
  // 修正已落定: 一次性加成(磨刀石等)在这里消耗, 命中与否都算用掉。
  runRelicHook(state, "afterDamageModified", dmg);

  // ---- 命中前: 状态可直接判定闪避(罗生门)。★ 必须排在命中掷骰之前, 否则会白白消耗一次战斗 RNG ----
  if (!opts.pure) runStatusHooks(state, targetId, "onBeforeHitRoll", dmg);
  if (dmg.missed) return markMissed(dmg);

  // ---- 1. 命中 / 2. 暴击 —— 只有"攻击"需要; 无施法者(中毒/荆棘等)直接跳过 ----
  if (!rollHitAndCrit(state, dmg, src, target, opts)) return markMissed(dmg);

  // ---- 3. 防御减伤 / 4. 格挡 / 5. 护盾吸收 ----
  applyDefenseAndBlock(state, dmg, src, target);
  dmg.amount = Math.max(0, Math.round(dmg.amount));
  runGuardHooks(state, dmg);
  dmg.amount = Math.max(0, Math.round(dmg.amount));
  const shieldBefore = target.shield;
  absorbByShield(dmg, target, opts);

  // ---- 扣血前: 状态可改最终扣血量或保住体力极限 ----
  runStatusHooks(state, targetId, "onBeforeHpLoss", dmg);
  dmg.amount = Math.max(0, Math.round(dmg.amount));

  // ---- 6. 落到 HP ----
  if (target.team === "player" && target.hp <= 0 && dmg.amount > 0)
    return resolveDowned(state, dmg, target, shieldBefore);
  applyHpLoss(state, dmg, target, opts);

  runAfterHit(state, dmg, target, shieldBefore);
  if (target.team === "player" && hpBefore > target.maxHp * 0.5 && target.hp <= target.maxHp * 0.5)
    runRelicHook(state, "onAllyHpCrossedHalf", target.id);
  if (dmg.sourceId) {
    runStatusHooks(state, dmg.sourceId, "onAfterAttack", dmg);
    const source = state.combatants[dmg.sourceId];
    if (source) cleanup(source);
  }
  noteAttacked(state, dmg);
  cleanup(target);

  if (target.team !== "player" && target.hp <= 0) markDead(state, target);
  return "hit";
}
