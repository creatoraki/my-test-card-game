// ============================================================================
// 引擎原语 —— 治疗、护盾、状态施加、状态生命周期、胜负判定。
// 这些是所有效果/AI/状态最终落地的地方, 都经过事件钩子, 便于组合出复杂联动。
// 伤害结算管线在 ./damage; ops.dealDamage 由 damage/index 在加载时注入(与 draw / discard 同一晚绑定模式),
// 本文件因此不 import 伤害管线, 也不 import 状态定义本体(查 hookRegistry) —— 两者都会反过来调用这里。
// ============================================================================

import type {
  BattleState,
  Combatant,
  EngineOps,
  HealCtx,
  StatBlock,
  StatusCtx,
  StatusInstance,
} from "./types";
import { STATUS_DEFS } from "./hookRegistry";
import { rngFloat } from "./rng";
import { addMod, healValue, offenseStatOf, statOf } from "./stats";
import { checkChallengesOnWin, noteChallengeKill } from "./challenges";
import { recordHitPart } from "./animHits";
import { capStatusStacks, mergeStatus, syncSegments } from "./statuses/stacking";
import { runRelicHook } from "./relicBehaviors/types";

export function log(state: BattleState, text: string): void {
  state.log.push({ round: state.round, tick: state.tick, text });
}

export function allIds(state: BattleState): string[] {
  return [...state.playerIds, ...state.enemyIds];
}

export function getStatus(cmb: Combatant, id: string): StatusInstance | undefined {
  return cmb.statuses.find((s) => s.id === id);
}

export function cleanup(cmb: Combatant): void {
  cmb.statuses = cmb.statuses.filter((s) => s.stacks > 0 && (s.duration == null || s.duration > 0));
}

export function ctxFor(state: BattleState, ownerId: string, inst: StatusInstance, stacks = inst.stacks): StatusCtx {
  return { state, ownerId, inst, stacks, ops };
}

// 掷一次百分点概率(0~100)。走战斗 RNG, 保证同种子可复现。
function roll(state: BattleState, chancePct: number): boolean {
  if (chancePct <= 0) return false;
  if (chancePct >= 100) return true;
  return rngFloat(state) * 100 < chancePct;
}

export function markDead(state: BattleState, cmb: Combatant): void {
  if (!cmb.alive) return;
  if (cmb.team === "enemy") {
    ops.firePassive(state, {
      type: "enemyKilled",
      targetId: cmb.id,
      targetStatuses: structuredClone(cmb.statuses),
    });
    ops.fireRelic(state, {
      type: "enemyKilled",
      targetId: cmb.id,
      targetStatuses: structuredClone(cmb.statuses),
    });
    runRelicHook(state, "onEnemyKilled", cmb.id);
  }
  cmb.hp = 0;
  cmb.alive = false;
  log(state, `${cmb.emoji} ${cmb.name} 倒下了`);
  if (cmb.team === "player") {
    purgeOwnerCards(state, cmb.charId, `${cmb.emoji} ${cmb.name}`);
    runRelicHook(state, "onAllyDeath", cmb.id);
  }
  if (cmb.team === "enemy") noteChallengeKill(state, cmb);
}

// 死者的个人卡牌立刻退场: 抽牌堆/手牌/弃牌堆一并清空。
// 刻意不进消耗堆, 也刻意保留 state.cards 的条目 —— UI 的手牌离场动画还要按 uid 查卡面。
function purgeOwnerCards(state: BattleState, ownerId: string, ownerLabel: string): void {
  const ownsCard = (uid: string) => state.cards[uid]?.ownerCharId === ownerId;
  state.draw = state.draw.filter((uid) => !ownsCard(uid));
  state.hand = state.hand.filter((uid) => !ownsCard(uid));
  state.discard = state.discard.filter((uid) => !ownsCard(uid));
  if (state.pendingChoice?.kind === "recoverFromDiscard" && ownsCard(state.pendingChoice.sourceCardUid))
    state.pendingChoice = null;
  log(state, `${ownerLabel} 的个人卡牌已清场`);
}

// 失去生命 —— 不是伤害: 不吃护盾/防御/格挡/命中/暴击, 也不触发受击与护盾击破钩子。
// 我方仍走濒死与体力极限口径, 敌人归零即死。血坏这类"自残"代价走这里。
export function loseHp(state: BattleState, targetId: string, amount: number): void {
  const target = state.combatants[targetId];
  const lost = Math.max(0, Math.round(amount));
  if (!target || !target.alive || lost <= 0) return;

  if (target.team === "player" && target.hp > 0)
    target.hpLimit = Math.max(1, Math.min(target.hpLimit, target.hp));
  target.hp = target.team === "player" ? Math.max(0, target.hp - lost) : target.hp - lost;
  recordHitPart(targetId, lost);
  log(state, `${target.emoji} ${target.name} 失去 ${lost} 点生命`);
  if (target.team !== "player" && target.hp <= 0) markDead(state, target);
}

// 最终治疗 =(基础治疗 + 治愈力÷healDivisor)×(1 + 治愈强度)。倍率型治疗的基础值已是治愈力÷healDivisor × 倍率,
// 此时只乘治愈强度, 避免重复叠加治愈力。sourceId 缺省 = 无施法者, 不吃两项加成。
export function heal(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: { scaled?: boolean; single?: boolean; splash?: boolean } = {},
): number {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount <= 0) return 0;
  const src = sourceId ? state.combatants[sourceId] : undefined;
  let final = amount;
  if (src) {
    final =
      (opts.scaled ? amount : amount + healValue(offenseStatOf(state, src, "healPower"))) *
      (1 + statOf(src, "healBoost") / 100);
  }

  const incomingHeal: HealCtx = {
    sourceId,
    targetId,
    amount: final,
    healed: 0,
    single: opts.single === true,
    splash: opts.splash === true,
  };
  for (const inst of [...t.statuses]) {
    incomingHeal.amount = final;
    const multiplier = STATUS_DEFS[inst.id]?.hooks?.modifyIncomingHeal?.(
      ctxFor(state, targetId, inst),
      incomingHeal,
    );
    if (multiplier != null) final *= Math.max(0, multiplier);
  }

  const before = t.hp;
  t.hp = Math.min(t.hpLimit, t.hp + Math.round(final));
  log(state, `${t.emoji} ${t.name} 回复 ${t.hp - before} 点生命`);
  // 满血时 t.hp - before = 0: 仍记一段(hpDelta 0), 保证目标照样闪治疗光效, 只是不飘数字。
  recordHitPart(targetId, before - t.hp);
  const healed = t.hp - before;
  runRelicHook(state, "afterHeal", { targetId, hpBefore: before, overflow: Math.max(0, Math.round(final) - healed) });
  if (opts.single && !opts.splash) {
    incomingHeal.amount = final;
    incomingHeal.healed = healed;
    for (const inst of [...t.statuses])
      STATUS_DEFS[inst.id]?.hooks?.onHealed?.(ctxFor(state, targetId, inst), incomingHeal);
  }
  return healed;
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
  data?: Record<string, number>,
  sourceId?: string,
): void {
  const t = state.combatants[targetId];
  stacks = Math.trunc(stacks); // 层数只允许整数: 舍去小数部分(0.9 层 ⇒ 不施加)
  if (!t || !t.alive || stacks === 0) return;
  const def = STATUS_DEFS[statusId];

  if (
    def?.kind === "debuff" &&
    statusId !== "debuffImmune" &&
    t.statuses.some((status) => status.id === "debuffImmune" && status.stacks > 0)
  ) {
    log(state, `${t.emoji} ${t.name} 免疫了 ${def.name}`);
    return;
  }

  // 异常抗性 —— 每种异常只抵抗"施加概率 / 层数 / 持续拍数"中的一项(见 statuses.resistMode)。
  if (def && def.kind === "debuff" && stacks > 0) {
    const resist = statOf(t, "ailmentResist");
    if (resist > 0) {
      if (def.resistMode === "chance") {
        if (roll(state, resist)) {
          log(state, `${t.emoji} ${t.name} 抵抗了 ${def.name}`);
          return;
        }
      } else if (def.resistMode === "stacks" || def.resistMode === "duration") {
        if (def.resistMode === "duration" && duration != null)
          duration = Math.max(1, Math.round(duration * (1 - resist / 100)));
        else stacks = Math.max(1, Math.round(stacks * (1 - resist / 100)));
      }
    }
  }

  const info = { targetId, statusId, stacks };
  runRelicHook(state, "modifyStatusApply", info);
  stacks = info.stacks;

  const existing = getStatus(t, statusId);
  if (existing) {
    mergeStatus(existing, def ?? { id: statusId, name: statusId, emoji: "", kind: "buff", desc: "" }, stacks, duration, t.tempo);
    if (data) existing.data = { ...existing.data, ...data };
    if (sourceId) existing.sourceId = sourceId;
  } else {
    const instance: StatusInstance = {
      id: statusId,
      stacks,
      ...(duration != null ? { duration } : {}),
      ...(data ? { data: { ...data } } : {}),
      ...(sourceId ? { sourceId } : {}),
      appliedAt: t.tempo,
    };
    if (def?.stackMode === "segments") {
      instance.segments = [{ stacks, ...(duration != null ? { duration } : {}), appliedAt: t.tempo }];
      syncSegments(instance);
    }
    t.statuses.push(instance);
  }
  const inst = getStatus(t, statusId);
  if (!inst) {
    log(state, `${t.emoji} ${t.name} 的${def?.name ?? statusId}被移除`);
    return;
  }
  if (def) capStatusStacks(inst, def);
  if (def) def.hooks?.onApplied?.(ctxFor(state, targetId, inst));
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
  getStat: (state, targetId, stat) => {
    const target = state.combatants[targetId];
    return target ? statOf(target, stat) : 0;
  },
  dealDamage: () => null,
  heal,
  gainShield,
  applyStatus,
  applyStatMod,
  loseHp,
  addCardToHand: () => undefined,
  discard: () => undefined,
  flushAutoPlays: () => undefined,
  draw: () => undefined,
  firePassive: () => undefined,
  fireRelic: () => undefined,
  log,
};

// ---------------------------------------------------------------------------
// 胜负判定
// ---------------------------------------------------------------------------
export function checkEnd(state: BattleState): void {
  if (state.phase !== "player") return;
  const playersAlive = state.playerIds.some((id) => state.combatants[id].alive);
  const enemiesAlive = state.enemyIds.some((id) => state.combatants[id].alive);
  if (!enemiesAlive) {
    state.phase = "won";
    checkChallengesOnWin(state);
    log(state, "🎉 战斗胜利!");
  } else if (!playersAlive) {
    state.phase = "lost";
    log(state, "💀 全员阵亡……");
  }
}
