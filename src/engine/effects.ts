// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, Card, Combatant, EffectDescriptor, StatBlock } from "./types";
import { ops } from "./ops";
import { addMod, attackDamage, healValue, offenseStatOf, statOf } from "./stats";
import { drawCards } from "./deck";
import { alliesOf, foesOf } from "./targeting";
import { rngPick } from "./rng";
import { counterOf } from "./counters";
import { getStatusDef } from "./statuses";
import { playableHandUids } from "./passiveCards";
import { runStatusTickNow } from "./statusLifecycle";
import { addPollution } from "./pollution";
import { settleInsurance } from "./insurance";
import { applyHandEffect } from "./effectsHand";
import { applyDamageEffect } from "./effectsDamage";
import {
  ASSEMBLE_IDS,
  gainSquadBuff,
  consumeAllSquadBuffs,
  missingAssembleIds,
  removeRandomSquadBuff,
  type AssembleId,
} from "./squadBuff";

export interface EffectResolution {
  missed: string[];
  hit: string[];
}

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

// ★ 导出给 hitPreview 复用 —— 预览要判定条件型 PLAY_STAT_BONUS 当前是否成立,
//   两边各写一份的话条件枚举一改就会漏。
export function conditionMet(
  state: BattleState,
  effect: EffectDescriptor,
  card?: Card,
  targetIds?: string[],
): boolean {
  if (effect.condition === "discardedThisRound")
    return counterOf(state, "discardsThisRound") > 0;
  if (effect.condition === "noFastPlaysThisRound")
    return counterOf(state, "fastPlaysThisRound") === 0;
  if (effect.condition === "noPlaysThisRound")
    return counterOf(state, "cardsPlayedThisRound") === 0;
  if (effect.condition === "waterfall") return state.waterfallPlay;
  // ★ 手牌口径的条件一律走 playableHandUids —— 被动卡无费用、不可打出, 不参与统计。
  if (effect.condition === "handHasCostAtLeast")
    return playableHandUids(state).some((uid) => (state.cards[uid]?.cost ?? 0) >= (effect.conditionValue ?? 0));
  if (effect.condition === "fastCardsInHandAtLeast")
    return playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "fast").length >= (effect.conditionValue ?? 0);
  if (effect.condition === "counterAtLeast")
    return counterOf(state, effect.conditionCounter!, card) >= (effect.conditionValue ?? 0);
  if (effect.condition === "counterBelow")
    return counterOf(state, effect.conditionCounter!, card) < (effect.conditionValue ?? 0);
  if (effect.condition === "eventTargetHasStatus")
    return Boolean(
      effect.conditionStatus &&
        state.passiveEventTargetStatuses?.some(
          (status) => status.id === effect.conditionStatus && status.stacks > 0,
        ),
    );
  if (effect.condition === "targetAttackedThisRound" || effect.condition === "targetNotAttackedThisRound") {
    const targetWasAttacked =
      targetIds == null
        ? state.attackedThisRound.length > 0 || state.playerIds.some((id) => feignsInjury(state, id))
        : targetIds.some((id) => state.attackedThisRound.includes(id) || feignsInjury(state, id));
    return effect.condition === "targetAttackedThisRound" ? targetWasAttacked : !targetWasAttacked;
  }
  return true;
}

/** 《假装受伤》= 伪造的受击记录。★ 急诊的判定口径只有这一处, 真受击与假装受伤必须在这里等价。 */
function feignsInjury(state: BattleState, id: string): boolean {
  return Boolean(
    state.combatants[id]?.statuses.some((status) => status.id === "feignInjury" && status.stacks > 0),
  );
}

function scaleFactor(state: BattleState, effect: EffectDescriptor): number {
  if (!effect.scaleByCounter) return 1;
  const { counter, per = 1, min, max } = effect.scaleByCounter;
  let value = counterOf(state, counter) * per;
  if (min != null) value = Math.max(min, value);
  if (max != null) value = Math.min(max, value);
  return value;
}

// 解析单条效果作用到哪些单位(相对施放者)
export function resolveTargets(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  primaryId: string | undefined,
): string[] {
  const src = state.combatants[sourceId];
  const t = effect.target ?? "primary";
  const pickUnique = (candidates: ReturnType<typeof foesOf>): string[] => {
    const pool = candidates.filter((candidate) =>
      !effect.targetHasStatus || candidate.statuses.some((status) => status.id === effect.targetHasStatus),
    );
    const selected: string[] = [];
    const count = Math.max(1, Math.floor(effect.targetCount ?? 1));
    for (let i = 0; i < count && pool.length > 0; i++) {
      const target = rngPick(state, pool);
      selected.push(target.id);
      pool.splice(pool.indexOf(target), 1);
    }
    return selected;
  };
  switch (t) {
    case "primary":
      return primaryId && state.combatants[primaryId]?.alive ? [primaryId] : [];
    case "self":
      return src?.alive ? [sourceId] : [];
    case "allFoes":
      return foesOf(state, src)
        .filter((candidate) => !effect.targetHasStatus || candidate.statuses.some((status) => status.id === effect.targetHasStatus))
        .map((c) => c.id);
    case "allAllies":
      return alliesOf(state, src).map((c) => c.id);
    case "randomFoe": {
      const foes = foesOf(state, src);
      return foes.length ? pickUnique(foes) : [];
    }
    case "randomAlly": {
      const allies = alliesOf(state, src);
      return allies.length ? pickUnique(allies) : [];
    }
    case "lowestHpAlly": {
      const allies = alliesOf(state, src);
      if (allies.length === 0) return [];
      const target = allies.reduce((mostInjured, current) => {
        const injured = current.maxHp - current.hp;
        const mostInjuredAmount = mostInjured.maxHp - mostInjured.hp;
        return injured > mostInjuredAmount ? current : mostInjured;
      });
      return [target.id];
    }
    default:
      return [];
  }
}

// 治疗/护盾的计数加算倍率(与 DAMAGE 的 bonusMultiplierFrom / bonusMultiplierPer 同口径)。
function supportBonusMultiplier(state: BattleState, effect: EffectDescriptor): number {
  return effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
    ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
    : 0;
}

function applyEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  if (!conditionMet(state, effect, undefined, targetIds)) return resolution;
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
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target || !target.alive) continue;
        drained += target.shield;
        target.shield = 0;
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
        (shieldMultiplier != null ? healValue(offenseStatOf(state, src, "healPower"), shieldMultiplier) : amount) *
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
      for (const id of targetIds) ops.heal(state, sourceId, id, healing, { scaled });
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
        break;
      }
      if (effect.boostSource === "primaryAimed") {
        const primaryId = targetIds.find((id) => state.combatants[id]?.alive) ?? foesOf(state, src)[0]?.id;
        if (primaryId && state.combatants[primaryId].statuses.some((status) => status.id === "aimed"))
          state.playValueBonusPct += boostPct;
      }
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
      return applyHandEffect(state, effect, sourceId, targetIds);
    case "APPLY_STATUS": {
      if (!effect.status) break;
      const generatedData = effect.statusDataFrom
        ? {
            ...effect.statusData,
            [effect.statusDataFrom.key]: sourceStatValue(state, src, effect.statusDataFrom.stat) * effect.statusDataFrom.multiplier,
          }
        : effect.statusData;
      for (const id of targetIds) {
        const aimed = state.combatants[id]?.statuses.some((status) => status.id === "aimed");
        const baseStacks = effect.stacksFromStat
          ? Math.round(sourceStatValue(state, src, effect.stacksFromStat.stat) * effect.stacksFromStat.multiplier)
          : effect.stacksFrom
            ? counterOf(state, effect.stacksFrom)
            : effect.stacks ?? 0;
        const aimedStacks = effect.aimedStacks && aimed ? effect.aimedStacks : 0;
        const aimedMultiplier = effect.aimedStacksMultiplier != null && aimed ? effect.aimedStacksMultiplier : 1;
        const stacks = Math.round(baseStacks * aimedMultiplier * scaleFactor(state, effect)) + aimedStacks;
        if (effect.setStacks) {
          const existing = state.combatants[id]?.statuses.find((status) => status.id === effect.status);
          if (stacks <= 0) {
            if (existing) state.combatants[id].statuses = state.combatants[id].statuses.filter((status) => status !== existing);
          } else if (existing) {
            existing.stacks = stacks;
            if (effect.duration != null) existing.duration = effect.duration;
          } else {
            ops.applyStatus(state, id, effect.status, stacks, effect.duration, generatedData, sourceId);
          }
        } else if (stacks > 0) {
          ops.applyStatus(state, id, effect.status, stacks, effect.duration, generatedData, sourceId);
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
      if (!effect.stat || !src || amount === 0) break;
      const pct = effect.pct ?? false;
      ops.applyStatMod(state, sourceId, effect.stat, amount, pct);
      state.playStatMods.push({ targetId: sourceId, stat: effect.stat, amount, pct });
      break;
    }
    case "DRAW":
      drawCards(state, (effect.amountFrom ? counterOf(state, effect.amountFrom) : amount) * scaleFactor(state, effect));
      break;
    case "GAIN_RESOURCE": {
      const res = effect.resource ?? "mana";
      const resourceAmount = Math.floor(
        (effect.amountFrom ? counterOf(state, effect.amountFrom) : amount) * scaleFactor(state, effect),
      );
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
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target) continue;
        target.statuses = target.statuses.filter((status) => {
          const def = getStatusDef(status.id);
          const removed = kind === "all" || def?.kind === kind;
          if (removed) state.lastRemovedStatusCount += 1;
          return !removed;
        });
      }
      break;
    }
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
      break;
    case "CONSUME_STATUS": {
      state.lastConsumedStatusStacks = 0;
      if (!effect.status) break;
      for (const id of targetIds) {
        const target = state.combatants[id];
        const status = target?.statuses.find((entry) => entry.id === effect.status);
        if (!target || !status) continue;
        const consumed = Math.min(status.stacks, Math.max(0, Math.floor(effect.maxStacks ?? status.stacks)));
        if (consumed <= 0) continue;
        state.lastConsumedStatusStacks += consumed;
        status.stacks -= consumed;
        if (status.stacks <= 0) target.statuses = target.statuses.filter((entry) => entry !== status);
        ops.log(state, `${target.emoji} ${target.name} 的${effect.status}被消耗 ${consumed} 层`);
      }
      break;
    }
    case "SPREAD_STATUS": {
      if (!effect.status) break;
      const spreadTargets = foesOf(state, src);
      for (const sourceTargetId of targetIds) {
        const sourceTarget = state.combatants[sourceTargetId];
        const sourceStatus = sourceTarget?.statuses.find((entry) => entry.id === effect.status);
        if (!sourceStatus) continue;
        const stacks = Math.floor(sourceStatus.stacks * (effect.spreadPct ?? 0.5));
        if (stacks <= 0) continue;
        for (const target of spreadTargets) {
          if (target.id !== sourceTargetId) ops.applyStatus(state, target.id, effect.status, stacks, undefined, undefined, sourceId);
        }
      }
      break;
    }
    case "TICK_STATUS":
      if (effect.status)
        for (const id of targetIds) runStatusTickNow(state, id, effect.status);
      break;
  }
  return resolution;
}

// 依次结算一张卡 / 一个招式的所有效果。
export function resolveEffects(
  state: BattleState,
  effects: EffectDescriptor[],
  sourceId: string,
  primaryId: string | undefined,
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  for (const effect of effects) {
    const targets = resolveTargets(state, effect, sourceId, primaryId);
    mergeResolution(resolution, applyEffect(state, effect, sourceId, targets));
  }
  return resolution;
}
