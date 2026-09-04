// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, Card, Combatant, CounterSource, EffectDescriptor, StatBlock } from "./types";
import { ops } from "./ops";
import { addMod, attackDamage, healValue, offenseStatOf, partyHandLimit, statOf } from "./stats";
import { drawCards } from "./deck";
import { alliesOf, foesOf } from "./targeting";
import { rngPick } from "./rng";
import { cardCost, starPayable } from "./cost";
import { CARD_MARK_DEFS } from "./cardMarks";
import { getStatusDef } from "./statuses";
import { advanceCultivate, resetCultivate } from "./cultivate";
import { isPassive, playableHandUids } from "./passive";
import { runStatusTickNow } from "./statusLifecycle";
import { addPollution } from "./pollution";
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

function counterOf(state: BattleState, source: CounterSource): number {
  if (source === "discardsThisRound") return state.discardsThisRound;
  if (source === "lastDiscardBatch") return state.lastDiscardBatch;
  if (source === "discardsThisBattle") return state.discardsThisBattle;
  if (source === "lastDiscardBatchFast") return state.lastDiscardBatchFast;
  if (source === "lastRecoverBatchFast") return state.lastRecoverBatchFast;
  if (source === "lastDiscardBatchCost") return state.lastDiscardBatchCost;
  if (source === "lastConvertBatch") return state.lastConvertBatch;
  if (source === "squadBuffCount") return state.squadBuffs.length;
  if (source === "lastSquadBuffConsumed") return state.lastSquadBuffConsumed;
  if (source === "lastConsumedStatusStacks") return state.lastConsumedStatusStacks;
  if (source === "lastRemovedStatusCount") return state.lastRemovedStatusCount;
  if (source === "activeCardResonance") return state.activeCardResonance;
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((card) => card.cardType === "fast").length;
  return state.playedThisRound.length;
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
export function conditionMet(state: BattleState, effect: EffectDescriptor): boolean {
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
    return counterOf(state, effect.conditionCounter!) >= (effect.conditionValue ?? 0);
  if (effect.condition === "counterBelow")
    return counterOf(state, effect.conditionCounter!) < (effect.conditionValue ?? 0);
  if (effect.condition === "eventTargetHasStatus")
    return Boolean(
      effect.conditionStatus &&
        state.passiveEventTargetStatuses?.some(
          (status) => status.id === effect.conditionStatus && status.stacks > 0,
        ),
    );
  return true;
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

// 击杀触发的子效果。单独成函数是为了让 DAMAGE 分支只写一行, 语义也和主效果解耦。
function applyOnKill(
  state: BattleState,
  effects: EffectDescriptor[],
  sourceId: string,
  killedId: string,
): EffectResolution {
  return resolveEffects(state, effects, sourceId, killedId);
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
      //   写了 multiplier ⇒ 攻击力 ÷ 5 × 倍率, 走完整管线
      const fixed = effect.amount != null;
      const bonusMult =
        effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
          ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
          : 0;
      const selfStackMult =
        effect.bonusMultiplierPerSelfStack != null
          ? state.activeCardStacks * effect.bonusMultiplierPerSelfStack
          : 0;
      const baseMultiplier = (effect.multiplier ?? 1) + bonusMult + selfStackMult;
      const valueScale = scaleFactor(state, effect);
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
              let killTriggered = false;
      for (let i = 0; i < hits; i++)
        for (const id of targetIds) {
          const targetUnit = state.combatants[id];
          const targetHasShield = targetUnit?.shield > 0;
          const hpPct = targetUnit && targetUnit.maxHp > 0 ? (targetUnit.hp / targetUnit.maxHp) * 100 : 100;
          const bonusApplies =
            !fixed &&
            effect.damageBonus &&
            ((effect.damageBonus.when === "targetHasShield" && targetHasShield) ||
              (effect.damageBonus.when === "targetHasNoShield" && !targetHasShield) ||
              (effect.damageBonus.when === "targetHpBelowPct" && hpPct < (effect.damageBonus.value ?? 0)) ||
              (effect.damageBonus.when === "targetHasDebuff" && targetUnit?.statuses.some((status) => getStatusDef(status.id)?.kind === "debuff" && status.stacks > 0)));
          const aimedBonus =
            effect.aimedMultiplier != null && state.combatants[id]?.statuses.some((status) => status.id === "aimed")
              ? effect.aimedMultiplier
              : baseMultiplier;
          const damageMultiplier =
            bonusApplies
              ? aimedBonus + (effect.damageBonus?.multiplier ?? 0)
              : aimedBonus;
          const valueMultiplier = 1 + state.playValueBonusPct / 100;
          const dmg = fixed
            ? amount * (1 + bonusMult) * valueMultiplier * valueScale
            : attackDamage(offenseStatOf(state, src, "attack"), damageMultiplier) * valueMultiplier * valueScale;
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
          // 击杀触发: 本段把目标打死时结算一次, 主目标 = 被击杀者。
          if (
            effect.onKill?.length &&
            result !== null &&
            targetUnit?.alive === false &&
            (!effect.onKillOnce || !killTriggered)
          ) {
            killTriggered = true;
            mergeResolution(resolution, applyOnKill(state, effect.onKill, sourceId, id));
          }
        }
      if (effect.lifesteal != null && lifestealPool > 0)
        ops.heal(state, sourceId, sourceId, lifestealPool * effect.lifesteal, { scaled: true });
      break;
    }
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
    case "CULTIVATE_TICK": {
      const amountToTick = Math.max(1, Math.floor(effect.amount ?? 1));
      const pool = state.hand.filter((uid) => {
        const card = state.cards[uid];
        return card?.cultivate != null && (card.cultivateLeft ?? card.cultivate.turns) > 0;
      });
      for (let i = 0; i < amountToTick && pool.length > 0; i++) {
        const uid = rngPick(state, pool);
        const card = state.cards[uid];
        if (card) {
          advanceCultivate(card, 1);
          ops.log(state, `${card.name} 的培育层数 -1`);
        }
        pool.splice(pool.indexOf(uid), 1);
      }
      break;
    }
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
        if (stacks > 0)
          ops.applyStatus(state, id, effect.status, stacks, effect.duration, generatedData, sourceId);
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
      const resourceAmount = (effect.amountFrom ? counterOf(state, effect.amountFrom) : amount) * scaleFactor(state, effect);
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
      // ★ 费用合计必须在丢弃**之前**统计: 丢弃后卡还在 state.cards, 但动态费用的计数已经变了。
      const selectedCost = selected.reduce((sum, uid) => {
        const card = state.cards[uid];
        return sum + (card ? cardCost(state, card) : 0);
      }, 0);
      for (const uid of selected) ops.discard(state, uid, "effect");
      state.lastDiscardBatch = selected.length;
      state.lastDiscardBatchFast = selectedFastCount;
      state.lastDiscardBatchCost = selectedCost;
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
      // 被动卡打不出来, 标记永远不会结算 ⇒ 一律不进候选池。
      const markable = playableHandUids(state);
      // eventCard: 触发本次被动的那张牌(天眼给"刚抽到的牌"打心眼)。
      if (effect.markPick === "eventCard") {
        const uid = state.passiveEventCardUid;
        const target = uid ? state.cards[uid] : undefined;
        if (target && !isPassive(target) && state.hand.includes(target.uid)) {
          target.marks ??= [];
          if (!target.marks.includes(effect.mark)) {
            target.marks.push(effect.mark);
            ops.log(state, `${target.name} 被标记为${CARD_MARK_DEFS[effect.mark]?.name ?? effect.mark}`);
          }
        }
        break;
      }
      if (effect.markPick === "handAll") {
        for (const uid of markable) {
          const card = state.cards[uid];
          if (!card) continue;
          card.marks ??= [];
          if (!card.marks.includes(effect.mark)) card.marks.push(effect.mark);
        }
        break;
      }
      const amountToMark = Math.max(0, Math.floor(effect.amount ?? 0));
      if (effect.markPick === "handHighestCostRandom") {
        const candidates = markable
          .map((uid) => state.cards[uid])
          .filter((card) => card != null);
        const highestCost = Math.max(...candidates.map((card) => cardCost(state, card)), -Infinity);
        const highest = candidates.filter((card) => cardCost(state, card) === highestCost);
        const card = highest.length > 0 ? rngPick(state, highest) : undefined;
        if (card) {
          card.marks ??= [];
          if (!card.marks.includes(effect.mark)) {
            card.marks.push(effect.mark);
            ops.log(state, `${card.name} 被标记为${CARD_MARK_DEFS[effect.mark]?.name ?? effect.mark}`);
          }
        }
        break;
      }
      const pool = markable.filter((uid) => {
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
    case "CONVERT_CARD_TYPE": {
      const convertTo = effect.convertTo ?? "fast";
      const logConvert = (card: Card) =>
        ops.log(state, `${card.name} 转换为${card.cardType === "fast" ? "速攻" : "普通"}牌`);
      // handAllFast: 一次性转换全部速攻手牌, 张数记进 lastConvertBatch 供后续效果按量结算(鲸鸢)。
      if (effect.convertPick === "handAllFast") {
        const targets = playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "fast");
        for (const uid of targets) {
          const card = state.cards[uid];
          if (!card) continue;
          card.cardType = convertTo;
          logConvert(card);
        }
        state.lastConvertBatch = targets.length;
        break;
      }
      if (effect.convertPick !== "handRandomNormal") break;
      const amountToConvert = Math.max(0, Math.floor(effect.amount ?? 1));
      const pool = playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "normal");
      let converted = 0;
      for (let i = 0; i < amountToConvert && pool.length > 0; i++) {
        const uid = rngPick(state, pool);
        const card = state.cards[uid];
        if (card) {
          card.cardType = convertTo;
          logConvert(card);
          converted += 1;
        }
        pool.splice(pool.indexOf(uid), 1);
      }
      state.lastConvertBatch = converted;
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
        state.lastConsumedStatusStacks += status.stacks;
        target.statuses = target.statuses.filter((entry) => entry !== status);
        ops.log(state, `${target.emoji} ${target.name} 的${effect.status}被消耗`);
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
    case "RESONATE": {
      const amountToResonate = Math.max(0, Math.floor(effect.amount ?? 1));
      const activeCost = state.activeCardCost ?? Infinity;
      const targets = state.hand.filter((uid) => {
        const card = state.cards[uid];
        return card?.resonance === true &&
          (effect.resonatePick === "handAll" || card.cost < activeCost);
      });
      for (const uid of targets) {
        const card = state.cards[uid];
        if (card) card.resonanceStacks = (card.resonanceStacks ?? 0) + amountToResonate;
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
