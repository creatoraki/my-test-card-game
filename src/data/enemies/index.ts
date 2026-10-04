import { BOSS_ENEMIES as FLOOR_BOSSES } from "./floor/boss";
import { ELITE_ENEMIES as FLOOR_ELITES } from "./floor/elites";
import { MIMIC_ENEMIES } from "./floor/mimics";
import { MINION_ENEMIES as FLOOR_MINIONS } from "./minions";
import { ARK_MINIONS } from "./ecoArk/minions";
import { ARK_ELITES } from "./ecoArk/elites";
import { ARK_BOSSES } from "./ecoArk/boss";

const MINION_ENEMIES = [...FLOOR_MINIONS, ...ARK_MINIONS];
const ELITE_ENEMIES = [...FLOOR_ELITES, ...ARK_ELITES];
const BOSS_ENEMIES = [...FLOOR_BOSSES, ...ARK_BOSSES];

export { BOSS_ENEMIES, ELITE_ENEMIES, MIMIC_ENEMIES, MINION_ENEMIES };
export type { EnemyDef, EnemyMove, MoveBias, MoveBiasWhen } from "./types";

export const ENEMIES = [...MINION_ENEMIES, ...MIMIC_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];

// 首领判定(咒杀阈值、咒怨人偶的首领例外等读取)。
const BOSS_ENEMY_IDS = new Set(BOSS_ENEMIES.map((def) => def.id));
export function isBossEnemyDefId(defId: string): boolean {
  return BOSS_ENEMY_IDS.has(defId);
}
