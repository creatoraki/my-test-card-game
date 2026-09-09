import { BOSS_ENEMIES } from "./boss";
import { ELITE_ENEMIES } from "./elites";
import { MIMIC_ENEMIES } from "./mimics";
import { MINION_ENEMIES } from "./minions";

export { BOSS_ENEMIES, ELITE_ENEMIES, MIMIC_ENEMIES, MINION_ENEMIES };
export type { EnemyDef, EnemyMove } from "./types";

export const ENEMIES = [...MINION_ENEMIES, ...MIMIC_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
