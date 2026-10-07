import type { BattleState, Enemy } from "../types";

export const ARK = {
  crab: "ark-moss-crab",
  moth: "ark-spore-moth",
  gardener: "ark-thorn-mantis",
  snail: "ark-irrigation-snail",
  sentry: "ark-seed-sentry",
  spore: "arkSpore",
  pods: "arkParasiticPods",
  burst: "ark-seed-burst",
  barrage: "ark-seed-blockade",
  groupDance: "ark-moth-dance",
  transplant: "ark-mantis-transplant",
} as const;

export function livingEnemies(state: BattleState): Enemy[] {
  return state.enemyIds.map((id) => state.combatants[id] as Enemy).filter((enemy) => enemy.alive);
}

export function livingPlayers(state: BattleState) {
  return state.playerIds.map((id) => state.combatants[id]).filter((unit) => unit.alive);
}

export function arkEnemy(enemy: Enemy) {
  return enemy.ark ??= { heldCards: [], heldMana: 0, barrageCooldown: 0 };
}

export function isArkMinion(enemy: Enemy): boolean {
  return [ARK.crab, ARK.moth, ARK.gardener, ARK.snail, ARK.sentry].some((id) => id === enemy.enemyDefId);
}

export function cardLocked(state: BattleState, uid: string): boolean {
  return Boolean(state.cards[uid]?.rooted) || livingEnemies(state).some((enemy) => enemy.ark?.heldCards.includes(uid));
}

export function availableHand(state: BattleState): string[] {
  return state.hand.filter((uid) => !cardLocked(state, uid));
}
