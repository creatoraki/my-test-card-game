import { BOSS_ENEMIES } from "./boss";
import { ELITE_ENEMIES } from "./elites";
import { MINION_ENEMIES } from "./minions";

export { BOSS_ENEMIES, ELITE_ENEMIES, MINION_ENEMIES };
export type { EnemyDef, EnemyMove } from "./types";

export const ENEMIES = [...MINION_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
