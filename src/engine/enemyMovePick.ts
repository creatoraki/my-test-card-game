import type { BattleState, Combatant, Enemy, StatusInstance } from "./types";
import type { EnemyMove, MoveBiasWhen } from "../data";
import { alliesOf, foesOf, tauntedAmong } from "./targeting";
import { rngPick } from "./rng";

function hasStatus(status: StatusInstance, statusId: string): boolean {
  return status.id === statusId && status.stacks > 0;
}

function combatantHasStatus(combatant: Combatant, statusId: string): boolean {
  return combatant.statuses.some((status) => hasStatus(status, statusId));
}

export function biasConditionMet(state: BattleState, enemy: Enemy, condition: MoveBiasWhen): boolean {
  const foes = foesOf(state, enemy);
  const allies = alliesOf(state, enemy);
  switch (condition.when) {
    case "anyFoeHasStatus":
      return foes.some((foe) => foe.statuses.some((status) => hasStatus(status, condition.status)));
    case "noFoeHasStatus":
      return !foes.some((foe) => foe.statuses.some((status) => hasStatus(status, condition.status)));
    case "anyFoeHealRoomAtLeast":
      return foes.some((foe) => foe.hpLimit - foe.hp >= condition.value);
    case "allyCountAtLeast":
      return allies.length >= condition.value;
    case "selfHasStatus":
      return combatantHasStatus(enemy, condition.status);
    case "selfLacksStatus":
      return !combatantHasStatus(enemy, condition.status);
    case "anyAllyHpBelowPct":
      return allies.some((ally) => ally.maxHp > 0 && (ally.hp / ally.maxHp) * 100 < condition.value);
    case "allyCountBelow":
      return allies.length < condition.value;
  }
}

export function enemyMoveWeight(state: BattleState, enemy: Enemy, move: EnemyMove): number {
  return (move.weight ?? 1) * (move.bias ?? []).reduce(
    (weight, bias) => biasConditionMet(state, enemy, bias) ? weight * bias.multiplier : weight,
    1,
  );
}

export function pickScriptedTarget(
  state: BattleState,
  enemy: Enemy,
  move: EnemyMove,
): string | undefined {
  // 玩家嘲讽交给公共目标选择逻辑处理, 脚本筛选不能绕过嘲讽。
  const foes = foesOf(state, enemy);
  if (tauntedAmong(foes).length > 0) return undefined;
  const candidates = foes;
  if (candidates.length === 0) return undefined;
  switch (move.targetPick) {
    case "highestShield":
      return candidates.reduce((best, candidate) => {
        if (candidate.shield !== best.shield) return candidate.shield > best.shield ? candidate : best;
        const candidateRatio = candidate.shield / Math.max(1, candidate.maxHp);
        const bestRatio = best.shield / Math.max(1, best.maxHp);
        return candidateRatio > bestRatio ? candidate : best;
      }).id;
    case "highestHealRoom":
      return candidates.reduce((best, candidate) => {
        const candidateRoom = candidate.hpLimit - candidate.hp;
        const bestRoom = best.hpLimit - best.hp;
        if (candidateRoom !== bestRoom) return candidateRoom > bestRoom ? candidate : best;
        return candidate.hp < best.hp ? candidate : best;
      }).id;
    case "withStatus": {
      if (!move.targetStatus) return undefined;
      const matching = candidates.filter((candidate) =>
        candidate.statuses.some((status) => hasStatus(status, move.targetStatus!)),
      );
      return matching.length > 0 ? rngPick(state, matching).id : undefined;
    }
    case "withoutStatus": {
      if (!move.targetStatus) return undefined;
      const matching = candidates.filter((candidate) =>
        !candidate.statuses.some((status) => hasStatus(status, move.targetStatus!)),
      );
      return matching.length > 0 ? rngPick(state, matching).id : undefined;
    }
    default:
      return undefined;
  }
}

export function pickAllyTarget(state: BattleState, enemy: Enemy, move: EnemyMove): string | undefined {
  const otherAllies = alliesOf(state, enemy).filter((ally) => ally.id !== enemy.id);
  if (move.targetPick === "escortAlly") {
    const escorted = otherAllies.filter((ally) => combatantHasStatus(ally, "escort"));
    if (escorted.length > 0) return rngPick(state, escorted).id;
  }
  return otherAllies.length > 0 ? rngPick(state, otherAllies).id : enemy.id;
}
