// ============================================================================
// 引擎原语 —— 伤害结算管线、治疗、护盾、状态施加、状态生命周期、胜负判定。
// 这些是所有效果/AI/状态最终落地的地方, 都经过事件钩子, 便于组合出复杂联动。
//
// ★ 非固定伤害的结算顺序是硬规定(《角色养成设计.md》3.3):
//     状态修正 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP
//   固定伤害跳过"防御"与"格挡"两段, 但仍可被护盾吸收。
// ============================================================================

import type {
  BattleState,
  Combatant,
  DamageCtx,
  DamageOpts,
  DamageResult,
  EngineOps,
  StatBlock,
  StatusCtx,
  StatusInstance,
} from "./types";
import { STATUS_DEFS } from "./statuses";
import { RULES } from "./rules";
import { rngFloat } from "./rng";
import { addMod, critChance, defenseMultiplier, hitChance, statOf } from "./stats";
import { noteChallengeDamage, noteChallengeKill } from "./challenges";

export function log(state: BattleState, text: string): void {
  state.log.push({ round: state.round, tick: state.tick, text });
}

export function allIds(state: BattleState): string[] {
  return [...state.playerIds, ...state.enemyIds];
}

export function getStatus(cmb: Combatant, id: string): StatusInstance | undefined {
  return cmb.statuses.find((s) => s.id === id);
}

function cleanup(cmb: Combatant): void {
  cmb.statuses = cmb.statuses.filter((s) => s.stacks > 0 && (s.duration == null || s.duration > 0));
}

function ctxFor(state: BattleState, ownerId: string, inst: StatusInstance): StatusCtx {
  return { state, ownerId, inst, ops };
}

// 掷一次百分点概率(0~100)。走战斗 RNG, 保证同种子可复现。
function roll(state: BattleState, chancePct: number): boolean {
  if (chancePct <= 0) return false;
  if (chancePct >= 100) return true;
  return rngFloat(state) * 100 < chancePct;
}

export function markDead(state: BattleState, cmb: Combatant): void {
  if (!cmb.alive) return;
  cmb.hp = 0;
  cmb.alive = false;
  log(state, `${cmb.emoji} ${cmb.name} 倒下了`);
  if (cmb.team === "player") purgeOwnerCards(state, cmb.charId, `${cmb.emoji} ${cmb.name}`);
  if (cmb.team === "enemy") noteChallengeKill(state, cmb);
}

// 死者的个人卡牌立刻退场: 抽牌堆/手牌/弃牌堆一并清空。
// 刻意不进消耗堆, 也刻意保留 state.cards 的条目 —— UI 的手牌离场动画还要按 uid 查卡面。
function purgeOwnerCards(state: BattleState, ownerId: string, ownerLabel: string): void {
  const ownsCard = (uid: string) => state.cards[uid]?.ownerCharId === ownerId;
  state.draw = state.draw.filter((uid) => !ownsCard(uid));
  state.hand = state.hand.filter((uid) => !ownsCard(uid));
  state.discard = state.discard.filter((uid) => !ownsCard(uid));
  if (state.pendingChoice && ownsCard(state.pendingChoice.sourceCardUid)) state.pendingChoice = null;
  log(state, `${ownerLabel} 的个人卡牌已清场`);
}

// ---------------------------------------------------------------------------
// 伤害结算管线
// ---------------------------------------------------------------------------
export function dealDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: DamageOpts = {},
): DamageResult {
  const target = state.combatants[targetId];
  if (!target || !target.alive) return null;

  const dmg: DamageCtx = {
    sourceId,
    targetId,
    amount,
    flags: opts.flags ?? [],
    isAttack: opts.isAttack ?? false,
    fixed: opts.fixed ?? false,
    missed: false,
    crit: false,
    blockRolled: false,
    blocked: 0,
    hpLost: 0,
  };

  // ---- 0. 状态修正(力量 +, 虚弱 ×, 易伤 ×) —— 在命中判定之前完成基础值调整 ----
  const src = sourceId ? state.combatants[sourceId] : undefined;
  if (src) {
    for (const inst of [...src.statuses])
      STATUS_DEFS[inst.id]?.hooks?.modifyOutgoingDamage?.(ctxFor(state, sourceId!, inst), dmg);
  }
  for (const inst of [...target.statuses])
    STATUS_DEFS[inst.id]?.hooks?.modifyIncomingDamage?.(ctxFor(state, targetId, inst), dmg);

  // ---- 1. 命中判定 —— 只有"攻击"需要命中; 无施法者(中毒/荆棘等)与必中效果直接跳过 ----
  if (dmg.isAttack && src && !opts.mustHit) {
    if (!roll(state, hitChance(state, src, target, opts.hitBonus ?? 0))) {
      dmg.missed = true;
      dmg.amount = 0;
      log(state, `${target.emoji} ${target.name} 闪避了这次攻击`);
      return "missed";
    }
  }

  // ---- 2. 暴击判定(命中之后) ----
  if (dmg.isAttack && src && roll(state, critChance(state, src))) {
    dmg.crit = true;
    dmg.amount *= statOf(src, "critDamage") / 100;
  }

  // ---- 3. 防御减伤 / 4. 格挡(固定伤害两段都跳过) ----
  if (!dmg.fixed) {
    dmg.amount *= defenseMultiplier(target);
    if (roll(state, statOf(target, "blockRate"))) {
      dmg.blockRolled = true;
      dmg.amount *= RULES.combat.blockReduction;
    }
  }

  dmg.amount = Math.max(0, Math.round(dmg.amount));

  // ---- 5. 护盾吸收 ----
  if (!opts.unblockable && target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg.amount);
    target.shield -= absorbed;
    dmg.amount -= absorbed;
    dmg.blocked = absorbed;
  }

  // ---- 6. 落到 HP ----
  const downed = target.team === "player" && target.hp <= 0;
  if (downed && dmg.amount > 0) {
    dmg.downed = true;
    dmg.fatal = roll(state, RULES.combat.downedDeathChance);
    dmg.amount = 0;
    dmg.hpLost = 0;
    log(state, `${target.emoji} ${target.name} ${dmg.fatal ? "没能撑住" : "顶住了这次攻击"}`);

    // 濒死判定仍算一次受击, 保留荆棘等 onAfterAttacked 联动, 但不产生 HP 损失。
    for (const inst of [...target.statuses])
      STATUS_DEFS[inst.id]?.hooks?.onAfterAttacked?.(ctxFor(state, targetId, inst), dmg);
    cleanup(target);
    if (dmg.fatal) markDead(state, target);
    return "hit";
  }

  if (target.team === "player" && target.hp > 0 && dmg.amount > 0 && !getStatus(target, "buzhou"))
    target.hpLimit = Math.max(1, target.hp);
  target.hp = target.team === "player" ? Math.max(0, target.hp - dmg.amount) : target.hp - dmg.amount;
  dmg.hpLost = dmg.amount;

  const marks =
    (dmg.crit ? " 暴击!" : "") +
    (dmg.blockRolled ? "(格挡)" : "") +
    (dmg.blocked > 0 ? `(护盾挡下 ${dmg.blocked})` : "");
  log(state, `${target.emoji} ${target.name} 受到 ${dmg.hpLost} 点伤害${marks}`);
  noteChallengeDamage(state, sourceId, dmg.hpLost);

  // 被攻击后触发(荆棘等)
  for (const inst of [...target.statuses])
    STATUS_DEFS[inst.id]?.hooks?.onAfterAttacked?.(ctxFor(state, targetId, inst), dmg);
  cleanup(target);

  if (target.team !== "player" && target.hp <= 0) markDead(state, target);
  return "hit";
}

// 最终治疗 =(基础治疗 + 治愈力)×(1 + 治愈强度)。倍率型治疗的基础值已是治愈力 × 倍率,
// 此时只乘治愈强度, 避免重复叠加治愈力。sourceId 缺省 = 无施法者, 不吃两项加成。
export function heal(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: { scaled?: boolean } = {},
): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount <= 0) return;
  const src = sourceId ? state.combatants[sourceId] : undefined;
  let final = amount;
  if (src) {
    final = (opts.scaled ? amount : amount + statOf(src, "healPower")) * (1 + statOf(src, "healBoost") / 100);
  }

  const before = t.hp;
  t.hp = Math.min(t.hpLimit, t.hp + Math.round(final));
  log(state, `${t.emoji} ${t.name} 回复 ${t.hp - before} 点生命`);
}

// 最终护盾 = 基础护盾 ×(1 + 护盾强度)。sourceId 缺省 = 无施法者, 不吃护盾强度。
export function gainShield(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount <= 0) return;
  const src = sourceId ? state.combatants[sourceId] : undefined;
  const final = Math.round(src ? amount * (1 + statOf(src, "shieldBoost") / 100) : amount);
  if (final <= 0) return;
  t.shield += final;
  log(state, `${t.emoji} ${t.name} 获得 ${final} 点护盾`);
}

export function applyStatus(
  state: BattleState,
  targetId: string,
  statusId: string,
  stacks: number,
  duration?: number,
): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || stacks === 0) return;
  const def = STATUS_DEFS[statusId];

  // 异常抗性 —— 每种异常只抵抗"施加概率 / 层数 / 持续回合"中的一项(见 statuses.resistMode)。
  if (def && def.kind === "debuff" && stacks > 0) {
    const resist = statOf(t, "ailmentResist");
    if (resist > 0) {
      if (def.resistMode === "chance") {
        if (roll(state, resist)) {
          log(state, `${t.emoji} ${t.name} 抵抗了 ${def.name}`);
          return;
        }
      } else if (def.resistMode === "stacks" || def.resistMode === "duration") {
        stacks = Math.max(1, Math.round(stacks * (1 - resist / 100)));
      }
    }
  }

  const existing = getStatus(t, statusId);
  if (existing) {
    existing.stacks += stacks;
    if (duration != null) existing.duration = Math.max(existing.duration ?? 0, duration);
  } else {
    t.statuses.push({ id: statusId, stacks, ...(duration != null ? { duration } : {}) });
  }
  if (def?.maxStacks != null) {
    const inst = getStatus(t, statusId)!;
    inst.stacks = Math.min(inst.stacks, def.maxStacks);
  }
  cleanup(t);
  log(state, `${t.emoji} ${t.name} 获得 ${def?.name ?? statusId} ${stacks > 0 ? "+" : ""}${stacks}`);
}

// 战斗内属性修正(卡牌/状态/场景)。只活到本场战斗结束。
export function applyStatMod(
  state: BattleState,
  targetId: string,
  stat: keyof StatBlock,
  amount: number,
  pct = false,
): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount === 0) return;
  addMod(t, stat, amount, pct);
  // maxHp 修正要同步实时上限, 否则改了面板血条不动。
  if (stat === "maxHp" && !pct) {
    t.maxHp = Math.max(1, t.maxHp + amount);
    t.hpLimit = Math.min(t.maxHp, t.hpLimit + amount);
    if (amount > 0) t.hp += amount;
    t.hp = Math.min(t.hp, t.maxHp);
  }
  log(state, `${t.emoji} ${t.name} ${stat} ${amount > 0 ? "+" : ""}${amount}${pct ? "%" : ""}`);
}

// 供状态钩子使用的原语集合
export const ops: EngineOps = {
  dealDamage,
  heal,
  gainShield,
  applyStatus,
  applyStatMod,
  discard: () => undefined,
  log,
};

// ---------------------------------------------------------------------------
// 状态生命周期 —— 在回合/时刻边界统一驱动所有单位身上的状态钩子。
// ---------------------------------------------------------------------------
function runLifecycle(state: BattleState, hook: "onRoundStart" | "onRoundEnd" | "onTick"): void {
  for (const id of allIds(state)) {
    const cmb = state.combatants[id];
    if (!cmb.alive) continue;
    for (const inst of [...cmb.statuses]) {
      if (!cmb.alive) break;
      STATUS_DEFS[inst.id]?.hooks?.[hook]?.(ctxFor(state, id, inst));
    }
    cleanup(cmb);
    if (cmb.team !== "player" && cmb.hp <= 0) markDead(state, cmb);
  }
}

export function runRoundStart(state: BattleState): void {
  runLifecycle(state, "onRoundStart");
}
export function runRoundEnd(state: BattleState): void {
  runLifecycle(state, "onRoundEnd");
  for (const id of allIds(state)) {
    const cmb = state.combatants[id];
    for (const inst of cmb.statuses) {
      if (inst.duration != null) inst.duration -= 1;
    }
    cleanup(cmb);
  }
}
export function runTick(state: BattleState): void {
  runLifecycle(state, "onTick");
}

// ---------------------------------------------------------------------------
// 胜负判定
// ---------------------------------------------------------------------------
export function checkEnd(state: BattleState): void {
  if (state.phase !== "player") return;
  const playersAlive = state.playerIds.some((id) => state.combatants[id].alive);
  const enemiesAlive = state.enemyIds.some((id) => state.combatants[id].alive);
  if (!enemiesAlive) {
    state.phase = "won";
    log(state, "🎉 战斗胜利!");
  } else if (!playersAlive) {
    state.phase = "lost";
    log(state, "💀 全员阵亡……");
  }
}
