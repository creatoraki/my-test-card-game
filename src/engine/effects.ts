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

function counterOf(state: BattleState, source: CounterSource): number {
  if (source === "discardsThisRound") return state.discardsThisRound;
  if (source === "lastDiscardBatch") return state.lastDiscardBatch;
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((card) => card.cardType === "fast").length;
  return state.playedThisRound.length;
}

function conditionMet(state: BattleState, effect: EffectDescriptor): boolean {
  if (effect.condition === "discardedThisRound")
    return counterOf(state, "discardsThisRound") > 0;
  if (effect.condition === "noFastPlaysThisRound")
    return counterOf(state, "fastPlaysThisRound") === 0;
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
      return foes.length ? [rngPick(state, foes).id] : [];
    }
    case "randomAlly": {
      const allies = alliesOf(state, src);
      return allies.length ? [rngPick(state, allies).id] : [];
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
): void {
  if (!conditionMet(state, effect)) return;
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
      let dmg = fixed ? amount : statOf(src, "attack") * (effect.multiplier ?? 1);
      if (effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null) {
        dmg *= 1 + counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer;
      }
      const hits = effect.hitsFrom
        ? counterOf(state, effect.hitsFrom)
        : Math.max(
            1,
            (effect.hits ?? 1) +
              (effect.bonusHitsFrom
                ? Math.min(counterOf(state, effect.bonusHitsFrom), effect.maxBonusHits ?? Infinity)
                : 0),
          );
      for (let i = 0; i < hits; i++)
        for (const id of targetIds)
          ops.dealDamage(state, sourceId, id, dmg, {
            isAttack: true,
            fixed,
            mustHit,
            flags: effect.flags,
            unblockable,
            hitBonus: effect.hitBonus,
          });
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
    case "APPLY_STATUS":
      for (const id of targetIds) ops.applyStatus(state, id, effect.status!, effect.stacks ?? 0);
      break;
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
      for (const uid of selected) ops.discard(state, uid, "effect");
      state.lastDiscardBatch = selected.length;
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
        ops.log(state, "弃牌堆为空或手牌已满，无法回收牌");
        break;
      }
      state.pendingChoice = { kind: "recoverFromDiscard", sourceCardUid: sourceId, count };
      ops.log(state, "请选择一张弃牌堆中的牌回到手牌");
      break;
    }
    case "MARK_CARDS": {
      if (effect.markPick !== "handRandom" || !effect.mark) break;
      const amountToMark = Math.max(0, Math.floor(effect.amount ?? 0));
      const pool = [...state.hand];
      for (let i = 0; i < amountToMark && pool.length > 0; i++) {
        const uid = rngPick(state, pool);
        const card = state.cards[uid];
        if (card) {
          card.marks ??= [];
          if (!card.marks.includes(effect.mark)) card.marks.push(effect.mark);
        }
        pool.splice(pool.indexOf(uid), 1);
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
}

// 依次结算一张卡 / 一个招式的所有效果。
export function resolveEffects(
  state: BattleState,
  effects: EffectDescriptor[],
  sourceId: string,
  primaryId: string | undefined,
): void {
  for (const effect of effects) {
    const targets = resolveTargets(state, effect, sourceId, primaryId);
    applyEffect(state, effect, sourceId, targets);
  }
}
