import { getEnemyDef } from "../data";
import type { BattleState, Enemy, FxRecorder } from "./types";
import { checkEnd, log } from "./ops";

const EMPTY_INTENT = { moveId: "", name: "", emoji: "", kind: "special" as const };

export function runEnemyFlee(state: BattleState, rec?: FxRecorder): void {
  if (state.phase !== "player") return;

  for (const id of state.enemyIds) {
    const enemy = state.combatants[id] as Enemy;
    if (!enemy?.alive) continue;

    const def = getEnemyDef(enemy.enemyDefId);
    if (def.fleeAfterRound == null || state.round < def.fleeAfterRound) continue;

    enemy.fled = true;
    enemy.alive = false;
    enemy.nextActTick = null;
    enemy.intent = { ...EMPTY_INTENT };
    log(state, `${enemy.emoji} ${enemy.name} 卷起战利品溜走了`);
    rec?.steps.push({
      kind: "flee",
      actorId: enemy.id,
      enemyDefId: enemy.enemyDefId,
      snapshot: structuredClone(state),
    });
  }

  checkEnd(state);
}
