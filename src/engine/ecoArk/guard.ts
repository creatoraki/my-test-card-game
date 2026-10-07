import type { BattleState, Card, DamageCtx, Enemy } from "../types";
import type { ArkAttackFrame } from "../types/ecoArk";
import { arkEnemy, livingEnemies } from "./shared";

export function isGardenProtected(state: BattleState, enemyId: string): boolean {
  const target = state.combatants[enemyId];
  return target?.team === "enemy" && target.alive && livingEnemies(state).some((enemy) =>
    enemy.statuses.some((status) => status.id === "arkGardenShelter" && status.stacks > 0) && enemy.id !== enemyId,
  );
}

export function gardenReduces(state: BattleState, enemyId: string, ownerId: string): boolean {
  const enemy = state.combatants[enemyId];
  return enemy?.team === "enemy" && enemy.statuses.some((status) => status.id === "arkGardenProtected" && status.stacks > 0) && isGardenProtected(state, enemyId) && enemy.ark?.guardOwnerId === ownerId;
}

export function beginArkAttack(state: BattleState, card: Card, existing?: ArkAttackFrame): ArkAttackFrame {
  const owner = state.playerIds.map((id) => state.combatants[id])
    .find((unit) => unit.team === "player" && unit.charId === card.ownerCharId);
  const frame = existing ?? {
    cardUid: card.uid,
    ownerId: owner?.id ?? card.ownerCharId,
    reducedIds: state.enemyIds.filter((id) => gardenReduces(state, id, owner?.id ?? card.ownerCharId)),
    hitIds: [],
  };
  state.ark.attacks.push(frame);
  return frame;
}

export function finishArkAttack(state: BattleState): ArkAttackFrame | undefined {
  const frame = state.ark.attacks.pop();
  if (!frame) return;
  for (const id of frame.hitIds) {
    const enemy = state.combatants[id];
    if (enemy?.team === "enemy" && isGardenProtected(state, id)) arkEnemy(enemy).guardOwnerId = frame.ownerId;
  }
  return frame;
}

function cardAttack(state: BattleState, dmg: Readonly<DamageCtx>): boolean {
  return dmg.isAttack && !dmg.flags.some((flag) => ["poison", "burn", "thorns", "reflect"].includes(flag)) &&
    Boolean(dmg.sourceId && state.combatants[dmg.sourceId]?.team === "player");
}

// 同一张牌的所有段共用开牌时的记忆，第一段命中不会让后面的段突然减半。
export function gardenDamageMultiplier(state: BattleState, dmg: Readonly<DamageCtx>): number {
  if (!cardAttack(state, dmg) || !isGardenProtected(state, dmg.targetId)) return 1;
  const frame = state.ark.attacks[state.ark.attacks.length - 1];
  const reduced = frame && frame.ownerId === dmg.sourceId
    ? frame.reducedIds.includes(dmg.targetId)
    : gardenReduces(state, dmg.targetId, dmg.sourceId!);
  return reduced ? 0.5 : 1;
}

export function noteArkAttackHit(state: BattleState, dmg: DamageCtx): void {
  const frame = state.ark.attacks[state.ark.attacks.length - 1];
  if (!frame || frame.ownerId !== dmg.sourceId || !cardAttack(state, dmg) ||
      !isGardenProtected(state, dmg.targetId) || dmg.hpLost + dmg.blocked <= 0) return;
  if (!frame.hitIds.includes(dmg.targetId)) frame.hitIds.push(dmg.targetId);
}

export function markGardenOwner(state: BattleState, ownerId: string): void {
  for (const enemy of livingEnemies(state)) {
    if (isGardenProtected(state, enemy.id)) arkEnemy(enemy).guardOwnerId = ownerId;
  }
}

export function clearGardenMemory(state: BattleState): void {
  for (const id of state.enemyIds) {
    const enemy = state.combatants[id] as Enemy;
    if (!isGardenProtected(state, id)) {
      if (enemy.ark) delete enemy.ark.guardOwnerId;
      enemy.statuses = enemy.statuses.filter((status) => status.id !== "arkGardenProtected");
    }
  }
}
