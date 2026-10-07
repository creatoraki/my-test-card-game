import type { BattleState } from "../types";
import { applyStatus, getStatus } from "../core/ops";
import { ARK, livingEnemies } from "./shared";

export function initializeArkBuffs(state: BattleState): void {
  for (const enemy of livingEnemies(state)) {
    if (enemy.enemyDefId === ARK.snail) applyStatus(state, enemy.id, "arkRootReturn", 1);
    if (enemy.enemyDefId === ARK.gardener) applyStatus(state, enemy.id, "arkGardenShelter", 1);
  }
  for (const enemy of livingEnemies(state)) {
    const gardener = livingEnemies(state).find((unit) => unit.id !== enemy.id && getStatus(unit, "arkGardenShelter"));
    if (gardener) applyStatus(state, enemy.id, "arkGardenProtected", 1);
  }
}
