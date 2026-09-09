// 敌人注册入口。具体定义按小怪、宝箱怪、精英与 BOSS 分层维护，外部继续从本路径读取聚合表。
export { BOSS_ENEMIES, ELITE_ENEMIES, ENEMIES, MIMIC_ENEMIES, MINION_ENEMIES } from "./enemies/index";
export type { EnemyDef, EnemyMove } from "./enemies/types";
