import type { BattleState, Enemy, EnemyAiMemory } from "./types";
import type { EnemyDef, EnemyMove } from "../data";
import { alliesOf } from "./targeting";
import { rngFloat, rngPickWeighted } from "./rng";

function memoryOf(enemy: Enemy): EnemyAiMemory {
  return (enemy.aiMemory ??= {
    actsSinceRecycle: 0,
    hammerCooldown: 0,
    openingDone: false,
    justBrokeShell: false,
  });
}

function moveOf(def: EnemyDef, moveId: string): EnemyMove | undefined {
  return def.moves.find((move) => move.id === moveId);
}

function breather(def: EnemyDef, script: NonNullable<EnemyDef["ai"]>, available: Set<string>): EnemyMove[] {
  return script.breatherMoveIds
    .map((id) => moveOf(def, id))
    .filter((move): move is EnemyMove => Boolean(move && available.has(move.id)));
}

function pickBreather(
  state: BattleState,
  def: EnemyDef,
  script: NonNullable<EnemyDef["ai"]>,
  available: Set<string>,
): EnemyMove {
  const candidates = breather(def, script, available);
  if (candidates.length > 0)
    return rngPickWeighted(state, candidates, (move) => script.breatherWeights[move.id] ?? 0);
  return def.moves[0];
}

function shieldState(state: BattleState, script: NonNullable<EnemyDef["ai"]>): "A" | "B" | "C" {
  const allies = state.playerIds
    .map((id) => state.combatants[id])
    .filter((combatant) => combatant?.alive);
  if (allies.length === 0) return "C";
  const totalShield = allies.reduce((sum, ally) => sum + ally.shield, 0);
  const averageShield = totalShield / allies.length;
  const maxShield = Math.max(...allies.map((ally) => ally.shield));
  const concentrated = totalShield > 0 && (maxShield / totalShield) * 100 >= script.thresholds.concentration;
  const imbalanced = averageShield > 0 && maxShield >= averageShield * script.thresholds.imbalanceRatio;
  if (
    maxShield >= script.thresholds.soloShield ||
    totalShield >= script.thresholds.partyShield ||
    concentrated ||
    imbalanced
  )
    return "A";
  if (totalShield <= script.thresholds.nearZeroShield) return "B";
  return "C";
}

function usableMoves(
  enemy: Enemy,
  def: EnemyDef,
  script: NonNullable<EnemyDef["ai"]>,
  lastMoveId: string | undefined,
): Set<string> {
  const available = new Set<string>();
  for (const move of def.moves) {
    if (move.id === lastMoveId) continue;
    if (move.id === script.recycleMoveId && enemy.shield > 0) continue;
    if (move.id === script.hammerMoveId && memoryOf(enemy).hammerCooldown > 0) continue;
    available.add(move.id);
  }
  return available;
}

export function pickScriptedMove(state: BattleState, enemy: Enemy, def: EnemyDef): EnemyMove {
  const script = def.ai;
  if (!script) return def.moves[0];
  const memory = memoryOf(enemy);
  const available = usableMoves(enemy, def, script, memory.lastMoveId);
  const recycle = moveOf(def, script.recycleMoveId);
  const shred = moveOf(def, script.shredMoveId);
  const hammer = moveOf(def, script.hammerMoveId);

  if (!memory.openingDone) return moveOf(def, script.openingMoveId) ?? recycle ?? def.moves[0];
  if (memory.justBrokeShell) return pickBreather(state, def, script, available);
  if (memory.lastMoveId === script.shredMoveId) return pickBreather(state, def, script, available);
  if (memory.lastMoveId === script.recycleMoveId) return pickBreather(state, def, script, available);
  if (memory.actsSinceRecycle >= script.recycleInsurance && enemy.shield <= 0 && recycle)
    return recycle;

  const stateId = shieldState(state, script);
  if (
    stateId === "A" &&
    memory.hammerCooldown <= 0 &&
    hammer &&
    available.has(hammer.id) &&
    rngFloat(state) * 100 < script.hammerOverride
  )
    return hammer;

  const weights = script.successors[memory.lastMoveId ?? ""] ?? {};
  const candidates = def.moves.filter((move) => available.has(move.id));
  const weightedCandidates = candidates.filter((move) => (weights[move.id] ?? 0) > 0);
  if (weightedCandidates.length > 0)
    return rngPickWeighted(state, weightedCandidates, (move) => {
      const baseWeight = weights[move.id] ?? 0;
      return stateId === "B" && move.id === script.shredMoveId
        ? baseWeight * script.brittleShredBias
        : baseWeight;
    });
  return pickBreather(state, def, script, available);
}

export function updateAiMemory(
  enemy: Enemy,
  move: EnemyMove,
  script?: NonNullable<EnemyDef["ai"]>,
): void {
  const memory = memoryOf(enemy);
  const recycleMoveId = script?.recycleMoveId ?? "guardian-recycle";
  const hammerMoveId = script?.hammerMoveId ?? "guardian-hammer";
  memory.actsSinceRecycle = move.id === recycleMoveId ? 0 : memory.actsSinceRecycle + 1;
  memory.hammerCooldown = move.id === hammerMoveId ? script?.hammerCooldown ?? 1 : Math.max(0, memory.hammerCooldown - 1);
  memory.lastMoveId = move.id;
  memory.openingDone = true;
  memory.justBrokeShell = false;
}

export function pickScriptedTarget(
  state: BattleState,
  enemy: Enemy,
  move: EnemyMove,
): string | undefined {
  if (move.targetPick !== "highestShield") return undefined;
  const candidates = alliesOf(state, enemy);
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, candidate) => {
    if (candidate.shield !== best.shield) return candidate.shield > best.shield ? candidate : best;
    const candidateRatio = candidate.shield / Math.max(1, candidate.maxHp);
    const bestRatio = best.shield / Math.max(1, best.maxHp);
    return candidateRatio > bestRatio ? candidate : best;
  }).id;
}
