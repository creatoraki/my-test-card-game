// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, Card, Combatant, EffectDescriptor, StatBlock } from "../types";
import { ops } from "../core/ops";
import { addMod, attackDamage, healValue, offenseStatOf, statOf } from "../combat/stats";
import { drawCards } from "../deck/deck";
import { foesOf } from "../combat/targeting";
import { resolveTargets } from "./effectTargets";
import { rngPick } from "../core/rng";
import { counterOf } from "../combat/counters";
import { getStatusDef } from "../statuses";
import { runStatusTickNow } from "../combat/statusLifecycle";
import { addPollution } from "../combat/pollution";
import { settleInsurance } from "../combat/insurance";
import { applyHandEffect } from "./effectsHand";
import { applyDamageEffect } from "./effectsDamage";
import { applyStripStatusEffect } from "./effectsStrip";
import { applyRevealEffect } from "./effectsReveal";
import { applyStatusMoveEffect } from "./effectsStatusMove";
import { applyProphetEffect } from "./effectsProphet";
import { filterFullDrawTargets, fullDrawGateMatches } from "../deck/fullDraw";
import { conditionMet } from "./effectConditions";
import { reduceStatusStacks } from "../statuses/stacking";
export { conditionMet } from "./effectConditions";
export { resolveTargets } from "./effectTargets";
import {
  ASSEMBLE_IDS,
  gainSquadBuff,
  consumeAllSquadBuffs,
  missingAssembleIds,
  removeRandomSquadBuff,
  squadBuffIds,
  type AssembleId,
} from "../combat/squadBuff";

export interface EffectResolution {
  missed: string[];
  hit: string[];
}

// 本批效果是否施加过灼烧; resolveEffects 负责保存/恢复, 供「burnApplied」被动事件使用。
let burnAppliedInBatch = false;

function mergeResolution(target: EffectResolution, source: EffectResolution): void {
  target.missed.push(...source.missed);
  target.hit.push(...source.hit);
}

// 由施法者属性换算出的数值(层数 / 状态参数)。★ 攻击力与治愈力都是 100 基准面板,
// 一律先 ÷ 各自的 divisor 再乘卡牌倍率, 与伤害/治疗的口径保持一致。
function sourceStatValue(state: BattleState, source: Combatant | undefined, stat: keyof StatBlock): number {
  if (!source) return 0;
  if (stat === "attack") return attackDamage(offenseStatOf(state, source, stat), 1);
  if (stat === "healPower") return healValue(offenseStatOf(state, source, stat));
  return statOf(source, stat);
}

function scaleFactor(state: BattleState, effect: EffectDescriptor): number {
  if (!effect.scaleByCounter) return 1;
  const { counter, per = 1, min, max, add = 0 } = effect.scaleByCounter;
  let value = counterOf(state, counter) * per + add;
  if (min != null) value = Math.max(min, value);
  if (max != null) value = Math.min(max, value);
  return value;
}

// 治疗/护盾的计数加算倍率(与 DAMAGE 的 bonusMultiplierFrom / bonusMultiplierPer 同口径)。
function supportBonusMultiplier(state: BattleState, effect: EffectDescriptor): number {
  if (!effect.bonusMultiplierFrom || effect.bonusMultiplierPer == null) return 0;
  return Math.min(
    effect.maxBonusMultiplier ?? Infinity,
    counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer,
  );
}

function applyEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  primaryId: string | undefined,
  contextCard?: Card,
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  if (state.autoPlaySuppress && (
    effect.condition === "waterfall" ||
    (effect.type === "APPLY_STATUS" && effect.status === "starlight")
  )) return resolution;
  if (effect.fullDraw && !fullDrawGateMatches(state, effect.fullDraw)) return resolution;
  if (!conditionMet(state, effect, contextCard, targetIds, primaryId)) return resolution;
  const amount = effect.amount ?? 0;
  const src = state.combatants[sourceId];
  switch (effect.type) {
    case "DAMAGE":
      return applyDamageEffect(state, effect, sourceId, targetIds, {
        resolveTargets,
        resolveEffects,
        scaleFactor,
      });
    // 失去生命: 不是伤害 —— 不吃护盾/防御/格挡/命中/暴击, 也不触发受击类钩子。
    case "LOSE_HP": {
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target?.alive) continue;
        const lost = effect.pctOfCurrentHp != null ? target.hp * effect.pctOfCurrentHp : amount;
        if (lost > 0) ops.loseHp(state, id, lost);
      }
      break;
    }
    case "GAIN_POLLUTION": {
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target?.alive || target.team !== "player") continue;
        addPollution(state, target, amount);
      }
      break;
    }
    case "DRAIN_SHIELD": {
      let drained = 0;
      const maxAmount = effect.maxAmount == null ? Infinity : Math.max(0, effect.maxAmount);
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target || !target.alive) continue;
        const amountToDrain = Math.min(target.shield, maxAmount);
        drained += amountToDrain;
        target.shield -= amountToDrain;
      }
      if (drained > 0 || amount > 0) {
        ops.gainShield(state, sourceId, sourceId, drained + amount);
        ops.log(state, `${src.name} 回收了 ${drained} 点护盾`);
      }
      break;
    }
    case "GAIN_SHIELD": {
      // amount = 固定基础护盾; multiplier = 治愈力÷healDivisor × 倍率。护盾强度仍在 ops 里结算。
      // bonusMultiplierFrom / Per 与 DAMAGE 同口径: 按计数**加算**到倍率上(鲸鸢按转换张数给盾)。
      const shieldMultiplier =
        effect.multiplier != null ? effect.multiplier + supportBonusMultiplier(state, effect) : null;
      const shield =
        (shieldMultiplier != null
          ? healValue(offenseStatOf(state, src, "healPower"), shieldMultiplier)
          : amount + (effect.amountBonusFrom
            ? counterOf(state, effect.amountBonusFrom) * (effect.amountBonusPer ?? 1)
            : 0)) *
        (1 + state.playValueBonusPct / 100) * scaleFactor(state, effect);
      for (const id of targetIds) ops.gainShield(state, sourceId, id, shield);
      break;
    }
    case "HEAL": {
      // amount = 固定基础治疗; multiplier = 治愈力÷healDivisor × 倍率。治愈强度仍在 ops 里结算。
      const scaled = effect.multiplier != null;
      const healMultiplier = scaled ? effect.multiplier! + supportBonusMultiplier(state, effect) : 0;
      const healing =
        (scaled ? healValue(offenseStatOf(state, src, "healPower"), healMultiplier) : amount) *
        (1 + state.playValueBonusPct / 100) * scaleFactor(state, effect);
      for (const id of targetIds)
        ops.heal(state, sourceId, id, healing, { scaled, single: targetIds.length === 1 });
      break;
    }
    case "SETTLE_INSURANCE":
      settleInsurance(state, sourceId, targetIds, effect.multiplier ?? 1);
      break;
    case "VALUE_BOOST": {
      const boostPct = effect.boostPct ?? 0;
      if (boostPct <= 0) break;
      if (effect.boostSource === "spendPartyStarlight") {
        let spent = 0;
        for (const id of state.playerIds) {
          const ally = state.combatants[id];
          if (!ally?.alive) continue;
          const starlight = ally.statuses.find((status) => status.id === "starlight");
          if (!starlight || starlight.stacks <= 0) continue;
          ops.applyStatus(state, id, "starlight", -1);
          spent += 1;
        }
        state.playValueBonusPct += spent * boostPct;
        if (spent > 0) ops.prophecyEvent(state, { type: "starlightSpent", amount: spent });
        break;
      }
      if (effect.boostSource === "fullDraw" && state.fullDraw.hitIds.length > 0)
        state.playValueBonusPct += boostPct;
      break;
    }
    case "CULTIVATE_TICK":
    case "DISCARD":
    case "RECOVER_FROM_DISCARD":
    case "MARK_CARDS":
    case "CONVERT_CARD_TYPE":
    case "ADD_CARD_TO_HAND":
    case "RESONATE":
    case "TRANSFORM_CARD":
    case "COPY_CARD_TO_HAND":
    case "CHOOSE_HAND_CARD":
    case "EXHAUST_HAND_CARDS":
      return applyHandEffect(state, effect, sourceId, targetIds, resolveEffects);
    case "EXTEND_STATUS":
    case "TRANSFER_STATUS":
    case "TRANSFER_DEBUFFS":
      applyStatusMoveEffect(state, effect, sourceId, targetIds);
      break;
    case "REVEAL_CARDS":
      return applyRevealEffect(state, effect, sourceId, resolveEffects);
    case "START_PROPHECY":
    case "DELAY_ENEMY_ACT":
      applyProphetEffect(state, effect, sourceId, targetIds, primaryId);
      break;
    case "APPLY_STATUS": {
      if (!effect.status) break;
      const generatedData = effect.statusDataFrom
        ? {
            ...effect.statusData,
            [effect.statusDataFrom.key]: sourceStatValue(state, src, effect.statusDataFrom.stat) * effect.statusDataFrom.multiplier,
          }
        : effect.statusData;
      for (const id of targetIds) {
        const statBonus = effect.stacksFromStat
          ? Math.min(
              effect.stacksFromStat.bonusMultiplierMax ?? Infinity,
              effect.stacksFromStat.bonusMultiplierFrom && effect.stacksFromStat.bonusMultiplierPer != null
                ? counterOf(state, effect.stacksFromStat.bonusMultiplierFrom) * effect.stacksFromStat.bonusMultiplierPer
                : effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
                  ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
                  : 0,
            )
          : 0;
        const statMultiplier = effect.stacksFromStat ? effect.stacksFromStat.multiplier + statBonus : 0;
        // 中毒层数吃出牌数值加成(嫁接等), 与伤害 / 治疗 / 护盾同口径。
        const valueBonus = effect.status === "poison" ? 1 + state.playValueBonusPct / 100 : 1;
        const statStacks = effect.stacksFromStat
          ? Math.round(sourceStatValue(state, src, effect.stacksFromStat.stat) * statMultiplier * valueBonus)
          : 0;
        const counterStacks = effect.stacksFrom
          ? counterOf(state, effect.stacksFrom) * (effect.stacksFromPer ?? 1)
          : 0;
        const rawStacks = (effect.stacks ?? 0) + statStacks + counterStacks;
        const stacks = Math.min(effect.maxStacks ?? Infinity, Math.round(rawStacks * scaleFactor(state, effect)));
        const duration = (effect.duration != null || effect.durationFrom)
          ? (effect.duration ?? 0) + (effect.durationFrom ? counterOf(state, effect.durationFrom.counter) * (effect.durationFrom.per ?? 1) : 0)
          : undefined;
        if (effect.setStacks) {
          const existing = state.combatants[id]?.statuses.find((status) => status.id === effect.status);
          if (stacks <= 0) {
            if (existing) state.combatants[id].statuses = state.combatants[id].statuses.filter((status) => status !== existing);
          } else if (existing) {
            existing.stacks = stacks;
            if (duration != null) existing.duration = duration;
          } else {
            ops.applyStatus(state, id, effect.status, stacks, duration, generatedData, sourceId);
          }
        } else if (stacks > 0) {
          const before = state.combatants[id]?.statuses.find((status) => status.id === effect.status)?.stacks ?? 0;
          ops.applyStatus(state, id, effect.status, stacks, duration, generatedData, sourceId);
          if (effect.status === "burn") burnAppliedInBatch = true;
          const after = state.combatants[id]?.statuses.find((status) => status.id === effect.status)?.stacks ?? 0;
          if (effect.tickNow && after > before)
            runStatusTickNow(state, id, effect.status, after - before);
        }
      }
      break;
    }
    case "APPLY_STAT_MOD":
      for (const id of targetIds)
        ops.applyStatMod(state, id, effect.stat!, amount, effect.pct ?? false);
      break;
    // 出牌期临时面板 —— 目标恒为施放者(不读 target), 写进 mods 后记一笔台账,
    // 由 battle.playCard 在出牌结束时逆向撤回。走 mods ⇒ 所有 statOf 读取自动吃到。
    case "PLAY_STAT_BONUS": {
      const scaledAmount = amount * scaleFactor(state, effect);
      if (!effect.stat || !src || scaledAmount === 0) break;
      const pct = effect.pct ?? false;
      ops.applyStatMod(state, sourceId, effect.stat, scaledAmount, pct);
      state.playStatMods.push({ targetId: sourceId, stat: effect.stat, amount: scaledAmount, pct });
      break;
    }
    case "DRAW":
      drawCards(state, (effect.amountFrom ? counterOf(state, effect.amountFrom) : amount) * scaleFactor(state, effect));
      break;
    case "GAIN_RESOURCE": {
      const res = effect.resource ?? "mana";
      const resourceAmount = Math.floor(Math.min(
        effect.maxAmount ?? Infinity,
        (effect.amountFrom ? counterOf(state, effect.amountFrom) : amount) * scaleFactor(state, effect),
      ));
      if (resourceAmount <= 0) break;
      state.resources[res] = (state.resources[res] ?? 0) + resourceAmount;
      ops.log(state, `✨ 获得 ${resourceAmount} 点${res === "mana" ? "法力水晶" : res}`);
      break;
    }
    case "RESTORE_HP_LIMIT":
      {
        const restoreAmount =
          (effect.multiplier != null ? healValue(offenseStatOf(state, src, "healPower"), effect.multiplier) : amount) *
          scaleFactor(state, effect);
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target || !target.alive || restoreAmount <= 0) continue;
        const before = target.hpLimit;
        target.hpLimit = Math.min(target.maxHp, target.hpLimit + restoreAmount);
        const restored = target.hpLimit - before;
        ops.heal(state, undefined, id, restored);
        ops.log(state, `${target.emoji} ${target.name} 体力极限恢复 ${restored}`);
      }
      break;
      }
    case "REMOVE_STATUS": {
      const kind = effect.statusKind ?? "debuff";
      state.lastRemovedStatusCount = 0;
      state.lastRemovedStatuses = [];
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target) continue;
        target.statuses = target.statuses.filter((status) => {
          const def = getStatusDef(status.id);
          const removed = !def?.undispellable && (kind === "all" || def?.kind === kind);
          if (removed) {
            state.lastRemovedStatusCount += 1;
            state.lastRemovedStatuses.push(structuredClone(status));
          }
          return !removed;
        });
      }
      break;
    }
    case "STRIP_STATUS":
      return applyStripStatusEffect(state, effect, sourceId, targetIds, { resolveEffects });
    case "GAIN_SQUAD_BUFF": {
      if (effect.squadBuffPick === "choose") {
        if (!state.pendingChoice)
          state.pendingChoice = { kind: "pickSquadBuff", options: [...ASSEMBLE_IDS] };
        break;
      }
      const missing = effect.squadBuffPick === "randomMissing" ? missingAssembleIds(state) : [];
      if (effect.squadBuffPick === "randomMissing" && missing.length === 0) break;
      const id = effect.squadBuffPick === "randomMissing" ? rngPick(state, missing) : effect.squadBuff;
      if (id) gainSquadBuff(state, id as AssembleId);
      break;
    }
    case "REMOVE_SQUAD_BUFF":
      if (effect.squadBuffPick === "all") consumeAllSquadBuffs(state);
      else if (effect.squadBuffPick === "random") removeRandomSquadBuff(state);
      else if (effect.squadBuffPick === "choose") {
        const owned = squadBuffIds(state);
        if (owned.length > 0 && !state.pendingChoice)
          state.pendingChoice = { kind: "pickSquadBuff", options: [...owned], mode: "remove" };
      }
      break;
    case "CONSUME_STATUS": {
      state.lastConsumedStatusStacks = 0;
      if (!effect.status) break;
      for (const id of targetIds) {
        const target = state.combatants[id];
        const status = target?.statuses.find((entry) => entry.id === effect.status);
        if (!target || !status) continue;
        let limit = status.stacks;
        if (effect.consumePct != null) limit = Math.min(limit, Math.floor(status.stacks * effect.consumePct));
        if (effect.maxStacks != null) limit = Math.min(limit, Math.floor(effect.maxStacks));
        const consumed = reduceStatusStacks(status, limit);
        if (consumed <= 0) continue;
        state.lastConsumedStatusStacks += consumed;
        if (status.stacks <= 0) target.statuses = target.statuses.filter((entry) => entry !== status);
        ops.log(state, `${target.emoji} ${target.name} 的${getStatusDef(effect.status)?.name ?? effect.status}被消耗 ${consumed} 层`);
      }
      break;
    }
    case "SPREAD_STATUS": {
      if (!effect.status) break;
      const spreadTargets = foesOf(state, src).filter((target) =>
        !effect.targetHasStatus || target.statuses.some((status) => status.id === effect.targetHasStatus && status.stacks > 0),
      );
      for (const sourceTargetId of targetIds) {
        const sourceTarget = state.combatants[sourceTargetId];
        const sourceStatus = sourceTarget?.statuses.find((entry) => entry.id === effect.status);
        if (!sourceStatus) continue;
        const stacks = Math.floor(sourceStatus.stacks * (effect.spreadPct ?? 0.5));
        if (stacks <= 0) continue;
        for (const target of spreadTargets) {
          if (target.id !== sourceTargetId)
            ops.applyStatus(state, target.id, effect.status, stacks, effect.duration ?? sourceStatus.duration, undefined, sourceId);
          if (effect.status === "burn") burnAppliedInBatch = true;
        }
      }
      break;
    }
    // 毒发 N: 按当前全部层数立即结算 N 次, 不扣层数也不扣持续。
    case "TICK_STATUS": {
      if (!effect.status) break;
      const times = Math.max(1, Math.floor(effect.amount ?? 1));
      for (const id of targetIds)
        for (let i = 0; i < times; i++) runStatusTickNow(state, id, effect.status);
      break;
    }
  }
  return resolution;
}

// 子模块(effectsHand / effectsReveal)需要回调结算器时由这里注入, 它们只认这个签名。
export type ResolveEffectsFn = typeof resolveEffects;

// 依次结算一张卡 / 一个招式的所有效果。
export function resolveEffects(
  state: BattleState,
  effects: EffectDescriptor[],
  sourceId: string,
  primaryId: string | undefined,
  contextCard?: Card,
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  const outerBurnFlag = burnAppliedInBatch;
  burnAppliedInBatch = false;
  try {
    for (const effect of effects) {
      const targets = filterFullDrawTargets(state, effect, resolveTargets(state, effect, sourceId, primaryId));
      mergeResolution(resolution, applyEffect(state, effect, sourceId, targets, primaryId, contextCard));
    }
  } finally {
    const applied = burnAppliedInBatch;
    burnAppliedInBatch = outerBurnFlag;
    if (applied && state.combatants[sourceId]?.team === "player")
      ops.firePassive(state, { type: "burnApplied" });
  }
  return resolution;
}
