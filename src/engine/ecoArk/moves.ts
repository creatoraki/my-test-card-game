import type { BattleState, Enemy } from "../types";
import type { EnemyMove } from "@/data/enemies/types";
import { getStatus } from "../core/ops";
import { rngPick, rngPickWeighted } from "../core/rng";
import { canSeizeMana } from "./resources";
import { ARK, isArkMinion, livingEnemies, livingPlayers } from "./shared";
import { BURST_BUFF, clearBurstBuff, setBurstTarget } from "./burstBuff";

export function arkMoveAvailable(state: BattleState, enemy: Enemy, move: EnemyMove): boolean {
  switch (move.id) {
    case "ark-crab-crystal": return canSeizeMana(state, enemy);
    case "ark-crab-carry": return (enemy.ark?.heldCards.length ?? 0) < 3 && state.hand.some((uid) => state.cards[uid]?.rooted);
    case "ark-moth-pollen": return livingEnemies(state).some((unit) => unit.id !== enemy.id);
    case "ark-snail-germinate": return livingPlayers(state).some((unit) => getStatus(unit, ARK.spore));
    case ARK.transplant: return livingPlayers(state).length >= 2 && livingPlayers(state).some((unit) => getStatus(unit, "poison"));
    case ARK.barrage: return !(enemy.ark?.barrageCooldown ?? 0) && !livingEnemies(state).some((unit) => unit.ark?.barrage);
    default: return true;
  }
}

// 方舟小怪开蓄时选好并保留目标，便于显示点名、授粉与移栽预告。
export function prepareArkIntent(state: BattleState, enemy: Enemy, move: EnemyMove): void {
  if (!isArkMinion(enemy)) return;
  clearBurstBuff(enemy);
  delete enemy.intent.primaryId;
  delete enemy.intent.secondaryId;
  let targets = livingPlayers(state);
  if (move.targeting === "ally") {
    const allies = livingEnemies(state).filter((unit) => unit.id !== enemy.id);
    if (allies.length) enemy.intent.primaryId = rngPick(state, allies).id;
    return;
  }
  if (move.targeting !== "foe") return;
  if (move.id === "ark-snail-germinate") targets = targets.filter((unit) => getStatus(unit, ARK.spore));
  if (move.id === ARK.transplant) targets = targets.filter((unit) => getStatus(unit, "poison"));
  if (!targets.length) return;
  enemy.intent.primaryId = rngPick(state, targets).id;
  if (move.id === ARK.burst) {
    setBurstTarget(state, enemy, enemy.intent.primaryId);
    delete enemy.intent.primaryId;
  }
  if (move.id === ARK.transplant) {
    const receivers = livingPlayers(state).filter((unit) => unit.id !== enemy.intent.primaryId);
    if (receivers.length) enemy.intent.secondaryId = rngPick(state, receivers).id;
  }
}

export function arkPrimaryTarget(state: BattleState, enemy: Enemy, move: EnemyMove): string | undefined {
  if (!isArkMinion(enemy)) return;
  const existing = move.id === ARK.burst ? getStatus(enemy, BURST_BUFF)?.targetId : enemy.intent.primaryId;
  const target = existing ? state.combatants[existing] : undefined;
  if (move.targeting === "ally" && target?.id === enemy.id) return;
  const status = move.id === "ark-snail-germinate" ? ARK.spore : move.id === ARK.transplant ? "poison" : undefined;
  if (target?.alive && (!status || getStatus(target, status))) return existing;
  prepareArkIntent(state, enemy, move);
  if (move.id === ARK.burst) return getStatus(enemy, BURST_BUFF)?.targetId;
  return enemy.intent.primaryId && state.combatants[enemy.intent.primaryId]?.alive ? enemy.intent.primaryId : undefined;
}

export function pickMothFollowUp(state: BattleState, enemy: Enemy, moves: EnemyMove[]): EnemyMove | undefined {
  const pool = moves.filter((move) => move.cost < 6 && move.cost <= enemy.ap && arkMoveAvailable(state, enemy, move));
  return pool.length ? rngPickWeighted(state, pool, (move) => move.weight ?? 1) : undefined;
}
