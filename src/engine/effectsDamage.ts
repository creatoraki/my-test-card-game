import type { BattleState, EffectDescriptor } from "./types";
import type { EffectResolution } from "./effects";
import { ops } from "./ops";
import { attackDamage, offenseStatOf } from "./stats";
import { counterOf } from "./counters";
import { getStatusDef } from "./statuses";

interface DamageDeps {
  resolveTargets: (
    state: BattleState,
    effect: EffectDescriptor,
    sourceId: string,
    primaryId: string | undefined,
  ) => string[];
  resolveEffects: (
    state: BattleState,
    effects: EffectDescriptor[],
    sourceId: string,
    primaryId: string | undefined,
  ) => EffectResolution;
  scaleFactor: (state: BattleState, effect: EffectDescriptor) => number;
}

function mergeResolution(target: EffectResolution, source: EffectResolution): void {
  target.missed.push(...source.missed);
  target.hit.push(...source.hit);
}

export function applyDamageEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  deps: DamageDeps,
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  const amount = effect.amount ?? 0;
  const unblockable = effect.flags?.includes("unblockable");
  const mustHit = effect.flags?.includes("mustHit");
  const src = state.combatants[sourceId];
  const fixed = effect.amount != null;
  const rawBonusMult = effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
    ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
    : 0;
  const bonusMult = Math.min(effect.maxBonusMultiplier ?? Infinity, rawBonusMult);
  const selfStackMult = effect.bonusMultiplierPerSelfStack != null
    ? state.activeCardStacks * effect.bonusMultiplierPerSelfStack
    : 0;
  const baseMultiplier = (effect.multiplier ?? 1) + bonusMult + selfStackMult;
  const valueScale = deps.scaleFactor(state, effect);
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
  let hitTriggered = false;
  let firstHitTarget: string | undefined;

  for (let i = 0; i < hits; i++) {
    const hitTargets = effect.randomPerHit && effect.target === "randomFoe"
      ? deps.resolveTargets(state, effect, sourceId, undefined)
      : targetIds;
    for (const id of hitTargets) {
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
      const damageMultiplier = bonusApplies
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
        onDealt: effect.lifesteal != null ? (hpLost) => { lifestealPool += hpLost; } : undefined,
      });
      if (result === "missed") resolution.missed.push(id);
      else if (result === "hit") {
        resolution.hit.push(id);
        hitTriggered = true;
        firstHitTarget ??= id;
      }
      if (
        effect.onKill?.length &&
        result !== null &&
        targetUnit?.alive === false &&
        (!effect.onKillOnce || !killTriggered)
      ) {
        killTriggered = true;
        mergeResolution(resolution, deps.resolveEffects(state, effect.onKill, sourceId, id));
      }
    }
  }
  if (effect.onHit?.length && hitTriggered)
    mergeResolution(resolution, deps.resolveEffects(state, effect.onHit, sourceId, firstHitTarget));
  if (effect.lifesteal != null && lifestealPool > 0)
    ops.heal(state, sourceId, sourceId, lifestealPool * effect.lifesteal, { scaled: true });
  return resolution;
}
