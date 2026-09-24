// 效果目标解析 —— 从 effects.ts 拆出: 把 EffectDescriptor.target 翻译成具体单位 id 列表。

import type { BattleState, EffectDescriptor } from "../types";
import { alliesOf, foesOf } from "../combat/targeting";
import { rngPick } from "../core/rng";
import { mostPiercedFoe } from "../combat/pierce";

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
      (!effect.excludePrimary || candidate.id !== primaryId) &&
      (!effect.targetHasStatus || candidate.statuses.some((status) => status.id === effect.targetHasStatus)) &&
      (!effect.targetWithoutStatus || !candidate.statuses.some((status) => status.id === effect.targetWithoutStatus)),
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
  const targets = (() => {
    switch (t) {
    case "primary":
      return primaryId && (state.combatants[primaryId]?.alive || effect.type === "TRANSFER_STATUS") ? [primaryId] : [];
    case "self":
      return src?.alive ? [sourceId] : [];
    case "allFoes":
      return foesOf(state, src)
        .filter(
          (candidate) =>
            (!effect.targetHasStatus || candidate.statuses.some((status) => status.id === effect.targetHasStatus)) &&
            (!effect.targetWithoutStatus || !candidate.statuses.some((status) => status.id === effect.targetWithoutStatus)),
        )
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
    case "mostPiercedFoe": {
      const id = mostPiercedFoe(state, sourceId);
      return id ? [id] : [];
    }
      default:
        return [];
    }
  })();
  return effect.excludePrimary ? targets.filter((id) => id !== primaryId) : targets;
}
