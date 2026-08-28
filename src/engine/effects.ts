// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, CounterSource, EffectDescriptor } from "./types";
import { ops } from "./ops";
import { partyHandLimit, statOf } from "./stats";
import { drawCards } from "./deck";
import { alliesOf, foesOf } from "./targeting";
import { rngPick } from "./rng";
import { starPayable } from "./cost";
import { CARD_MARK_DEFS } from "./cardMarks";
import { getStatusDef } from "./statuses";

export interface EffectResolution {
  missed: string[];
  hit: string[];
}

function mergeResolution(target: EffectResolution, source: EffectResolution): void {
  target.missed.push(...source.missed);
  target.hit.push(...source.hit);
}

function counterOf(state: BattleState, source: CounterSource): number {
  if (source === "discardsThisRound") return state.discardsThisRound;
  if (source === "lastDiscardBatch") return state.lastDiscardBatch;
  if (source === "discardsThisBattle") return state.discardsThisBattle;
  if (source === "lastDiscardBatchFast") return state.lastDiscardBatchFast;
  if (source === "lastRecoverBatchFast") return state.lastRecoverBatchFast;
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((card) => card.cardType === "fast").length;
  return state.playedThisRound.length;
}

function conditionMet(state: BattleState, effect: EffectDescriptor): boolean {
  if (effect.condition === "discardedThisRound")
    return counterOf(state, "discardsThisRound") > 0;
  if (effect.condition === "noFastPlaysThisRound")
    return counterOf(state, "fastPlaysThisRound") === 0;
  if (effect.condition === "waterfall") return state.waterfallPlay;
  if (effect.condition === "handHasCostAtLeast")
    return state.hand.some((uid) => (state.cards[uid]?.cost ?? 0) >= (effect.conditionValue ?? 0));
  if (effect.condition === "fastCardsInHandAtLeast")
    return state.hand.filter((uid) => state.cards[uid]?.cardType === "fast").length >= (effect.conditionValue ?? 0);
  return true;
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
    const pool = [...candidates];
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
      return foesOf(state, src).map((c) => c.id);
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

function applyEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  if (!conditionMet(state, effect)) return resolution;
  const amount = effect.amount ?? 0;
  const unblockable = effect.flags?.includes("unblockable");
  const mustHit = effect.flags?.includes("mustHit");
  const src = state.combatants[sourceId];
  switch (effect.type) {
    case "DAMAGE": {
      // amount 与 multiplier 二选一(见 types.EffectDescriptor):
      //   写了 amount   ⇒ 固定伤害, 不用攻击力, 不吃防御与格挡
      //   写了 multiplier ⇒ 攻击力 × 倍率, 走完整管线
      const fixed = effect.amount != null;
      const bonusMult =
        effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
          ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
          : 0;
      const baseMultiplier = (effect.multiplier ?? 1) + bonusMult;
      const hits = effect.hitsFrom
        ? Math.min(counterOf(state, effect.hitsFrom), effect.maxHits ?? Infinity)
        : Math.max(
            1,
            (effect.hits ?? 1) +
              (effect.bonusHitsFrom
                ? Math.min(counterOf(state, effect.bonusHitsFrom), effect.maxBonusHits ?? Infinity)
                : 0),
          );
              let lifestealPool = 0;
      for (let i = 0; i < hits; i++)
        for (const id of targetIds) {
          const targetHasShield = state.combatants[id]?.shield > 0;
          const bonusApplies =
            !fixed &&
            effect.damageBonus &&
            ((effect.damageBonus.when === "targetHasShield" && targetHasShield) ||
              (effect.damageBonus.when === "targetHasNoShield" && !targetHasShield));
          const aimedBonus =
            effect.aimedMultiplier != null && state.combatants[id]?.statuses.some((status) => status.id === "aimed")
              ? effect.aimedMultiplier
              : baseMultiplier;
          const damageMultiplier =
            bonusApplies
              ? aimedBonus + effect.damageBonus.multiplier
              : aimedBonus;
          const dmg = fixed ? amount * (1 + bonusMult) : statOf(src, "attack") * damageMultiplier;
          const result = ops.dealDamage(state, sourceId, id, dmg, {
            isAttack: true,
            fixed,
            mustHit,
            flags: effect.flags,
            unblockable,
            hitBonus: effect.hitBonus,
            onDealt:
              effect.lifesteal != null
                ? (hpLost) => {
                    lifestealPool += hpLost;
                  }
                : undefined,
          });
          if (result === "missed") resolution.missed.push(id);
          else if (result === "hit") resolution.hit.push(id);
        }
      if (effect.lifesteal != null && lifestealPool > 0)
        ops.heal(state, sourceId, sourceId, lifestealPool * effect.lifesteal, { scaled: true });
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
      // amount = 固定基础护盾; multiplier = 治愈力 × 倍率。护盾强度仍在 ops 里结算。
      const shield = effect.multiplier != null ? statOf(src, "healPower") * effect.multiplier : amount;
      for (const id of targetIds) ops.gainShield(state, sourceId, id, shield);
      break;
    }
    case "HEAL": {
      // amount = 固定基础治疗; multiplier = 治愈力 × 倍率。治愈强度仍在 ops 里结算。
      const scaled = effect.multiplier != null;
      const healing = scaled ? statOf(src, "healPower") * effect.multiplier! : amount;
      for (const id of targetIds) ops.heal(state, sourceId, id, healing, { scaled });
      break;
    }
    case "APPLY_STATUS": {
      if (!effect.status) break;
      const generatedData = effect.statusDataFrom
        ? {
            ...effect.statusData,
            [effect.statusDataFrom.key]: src
              ? statOf(src, effect.statusDataFrom.stat) * effect.statusDataFrom.multiplier
              : 0,
          }
        : effect.statusData;
      for (const id of targetIds) {
        const aimedBonus =
          effect.aimedStacks && state.combatants[id]?.statuses.some((status) => status.id === "aimed")
            ? effect.aimedStacks
            : 0;
        const stacks = (effect.stacksFrom ? counterOf(state, effect.stacksFrom) : effect.stacks ?? 0) + aimedBonus;
        if (stacks > 0)
          ops.applyStatus(state, id, effect.status, stacks, effect.duration, generatedData, sourceId);
      }
      break;
    }
    case "APPLY_STAT_MOD":
      for (const id of targetIds)
        ops.applyStatMod(state, id, effect.stat!, amount, effect.pct ?? false);
      break;
    case "DRAW":
      drawCards(state, effect.amountFrom ? counterOf(state, effect.amountFrom) : amount);
      break;
    case "GAIN_RESOURCE": {
      const res = effect.resource ?? "mana";
      const resourceAmount = effect.amountFrom ? counterOf(state, effect.amountFrom) : amount;
      if (resourceAmount <= 0) break;
      state.resources[res] = (state.resources[res] ?? 0) + resourceAmount;
      ops.log(state, `✨ 获得 ${resourceAmount} 点${res === "mana" ? "法力水晶" : res}`);
      break;
    }
    case "DISCARD": {
      const amountToDiscard = Math.max(0, Math.floor(effect.amount ?? 0));
      const pick = effect.discardPick ?? "handTop";
      if (amountToDiscard === 0 && pick !== "handAll") break;
      let selected: string[];
      if (pick === "handAll") selected = [...state.hand];
      else if (pick === "handBottom") selected = state.hand.slice(-amountToDiscard);
      else if (pick === "handRandom") {
        selected = [];
        const pool = [...state.hand];
        for (let i = 0; i < amountToDiscard && pool.length > 0; i++) {
          const uid = rngPick(state, pool);
          selected.push(uid);
          pool.splice(pool.indexOf(uid), 1);
        }
      } else selected = state.hand.slice(0, amountToDiscard);
      const selectedFastCount = selected.filter((uid) => state.cards[uid]?.cardType === "fast").length;
      for (const uid of selected) ops.discard(state, uid, "effect");
      state.lastDiscardBatch = selected.length;
      state.lastDiscardBatchFast = selectedFastCount;
      break;
    }
    case "RECOVER_FROM_DISCARD": {
      const limit = partyHandLimit(state);
      const count = Math.min(
        Math.max(1, Math.floor(effect.amount ?? 1)),
        state.discard.length,
        limit - state.hand.length,
      );
      if (count <= 0 || state.pendingChoice) {
        state.lastRecoverBatchFast = 0;
        ops.log(state, "弃牌堆为空或手牌已满，无法回收牌");
        break;
      }
      if (effect.recoverPick === "random") {
        const pool = [...state.discard];
        let recoveredFastCount = 0;
        for (let i = 0; i < count && pool.length > 0; i++) {
          const uid = rngPick(state, pool);
          const card = state.cards[uid];
          if (card?.cardType === "fast") recoveredFastCount += 1;
          state.discard = state.discard.filter((id) => id !== uid);
          state.hand.push(uid);
          if (card) resetCultivate(card);
          pool.splice(pool.indexOf(uid), 1);
        }
        state.lastRecoverBatchFast = recoveredFastCount;
        ops.log(state, `从弃牌堆随机回收 ${count} 张牌`);
        break;
      }
      state.pendingChoice = { kind: "recoverFromDiscard", sourceCardUid: sourceId, count };
      ops.log(state, "请选择一张弃牌堆中的牌回到手牌");
      break;
    }
    case "MARK_CARDS": {
      if (!effect.mark || !effect.markPick) break;
      if (effect.markPick === "handAll") {
        for (const uid of state.hand) {
          const card = state.cards[uid];
          if (!card) continue;
          card.marks ??= [];
          if (!card.marks.includes(effect.mark)) card.marks.push(effect.mark);
        }
        break;
      }
      const amountToMark = Math.max(0, Math.floor(effect.amount ?? 0));
      const pool = state.hand.filter((uid) => {
        const card = state.cards[uid];
        return card && (effect.markPick !== "handRandomNonStarPay" || !starPayable(card));
      });
      for (let i = 0; i < amountToMark && pool.length > 0; i++) {
        const uid = rngPick(state, pool);
        const card = state.cards[uid];
        if (card) {
          card.marks ??= [];
          if (!card.marks.includes(effect.mark)) {
            card.marks.push(effect.mark);
            ops.log(state, `${card.name} 被标记为${CARD_MARK_DEFS[effect.mark]?.name ?? effect.mark}`);
          }
        }
        pool.splice(pool.indexOf(uid), 1);
      }
      break;
    }
    case "ADD_CARD_TO_HAND": {
      if (!effect.cardId) break;
      const allies = src ? alliesOf(state, src) : [];
      if (effect.cardOwner === "randomAlly" && allies.length === 0) break;
      const ownerCharId = effect.cardOwner === "randomAlly" ? rngPick(state, allies).charId : undefined;
      ops.addCardToHand(state, effect.cardId, ownerCharId);
      break;
    }
    case "RESTORE_HP_LIMIT":
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target || !target.alive || amount <= 0) continue;
        const before = target.hpLimit;
        target.hpLimit = Math.min(target.maxHp, target.hpLimit + amount);
        const restored = target.hpLimit - before;
        ops.heal(state, undefined, id, restored);
        ops.log(state, `${target.emoji} ${target.name} 体力极限恢复 ${restored}`);
      }
      break;
    case "REMOVE_STATUS": {
      const kind = effect.statusKind ?? "debuff";
      for (const id of targetIds) {
        const target = state.combatants[id];
        if (!target) continue;
        target.statuses = target.statuses.filter((status) => {
          const def = getStatusDef(status.id);
          return kind !== "all" && def?.kind !== kind;
        });
      }
      break;
    }
    case "CONVERT_CARD_TYPE": {
      if (effect.convertPick !== "handRandomNormal") break;
      const amountToConvert = Math.max(0, Math.floor(effect.amount ?? 1));
      const pool = state.hand.filter((uid) => state.cards[uid]?.cardType === "normal");
      for (let i = 0; i < amountToConvert && pool.length > 0; i++) {
        const uid = rngPick(state, pool);
        const card = state.cards[uid];
        if (card) {
          card.cardType = effect.convertTo ?? "fast";
          ops.log(state, `${card.name} 转换为${card.cardType === "fast" ? "速攻" : "普通"}牌`);
        }
        pool.splice(pool.indexOf(uid), 1);
      }
      break;
    }
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
