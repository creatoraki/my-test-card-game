// 遭遇战数据 —— enemies 引用敌人 id，站位只供战斗 UI 取景。

export interface EnemyPlacement {
  id: string;
  dx?: number;
  dy?: number;
  scale?: number;
  flip?: boolean;
}

export type EnemySlot = string | EnemyPlacement;

export interface EncounterDef {
  id: string;
  name: string;
  enemies: EnemySlot[];
}

export function slotDefId(slot: EnemySlot): string {
  return typeof slot === "string" ? slot : slot.id;
}

export function slotPlacement(slot: EnemySlot): EnemyPlacement | undefined {
  if (typeof slot === "string") return undefined;
  return slot.dx == null && slot.dy == null && slot.scale == null && slot.flip == null
    ? undefined
    : slot;
}

const GROUND_DY = 220;
const SPIDER_DY = GROUND_DY - 80;

type EnemyPlacementOptions = Omit<EnemyPlacement, "id">;

function placeEnemy(id: string, options: EnemyPlacementOptions = {}): EnemyPlacement {
  return {
    id,
    dx: 0,
    dy: GROUND_DY,
    scale: 1,
    flip: false,
    ...options,
  };
}

const T1_SCOUT = [
  placeEnemy("maintenance-spider", { dx: -100, dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("radio-bot", { dx: 100, dy: GROUND_DY + 30, scale: 0.7, flip: true }),
];

const T1_SWEEP = [
  placeEnemy("sweep-drone", { dx: -100, scale: 1.1 }),
  placeEnemy("traffic-light-bot", { dx: 100, flip: true }),
];

const T2_CREW = [
  placeEnemy("maintenance-spider", { dx: -150, dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("radio-bot", { scale: 0.7, dy: GROUND_DY + 30 }),
  placeEnemy("sweep-drone", { dx: 150, scale: 1.2, flip: true }),
];

const T2_BEACON = [
  placeEnemy("radio-bot", { dx: -150 }),
  placeEnemy("traffic-light-bot"),
  placeEnemy("sweep-drone", { dx: 150, scale: 1.1, flip: true }),
];

const T3_PATROL = [
  placeEnemy("maintenance-spider", { dx: -150, dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("sweep-drone", { scale: 1.1 }),
  placeEnemy("sweep-drone", { dx: 150, scale: 1.1, flip: true }),
];

const T3_BLOCKADE = [
  placeEnemy("traffic-light-bot", { dx: -150 }),
  placeEnemy("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("sweep-drone", { dx: 150, scale: 1.1, flip: true }),
];

const T4_PATROL = [
  placeEnemy("radio-bot", { dx: -180, flip: true }),
  placeEnemy("radio-bot", { dx: -60, scale: 0.7 }),
  placeEnemy("maintenance-spider", { dx: 60, dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("sweep-drone", { dx: 180, scale: 1.1, flip: true }),
];

const T4_BLOCKADE = [
  placeEnemy("traffic-light-bot", { dx: -180 }),
  placeEnemy("traffic-light-bot", { dx: -60 }),
  placeEnemy("radio-bot", { dx: 60, scale: 0.7, dy: GROUND_DY + 30 }),
  placeEnemy("sweep-drone", { dx: 180, scale: 1.1, flip: true }),
];

const T4_ELITE_GUARD = [
  placeEnemy("pole-bot", { dx: -150 }),
  placeEnemy("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("radio-bot", { dx: 150, scale: 0.7, dy: GROUND_DY + 30, flip: true }),
];

const T4_COMPACTOR = [
  placeEnemy("scrap-bot", { dx: -96 }),
  placeEnemy("pole-bot", { dx: 96, flip: true }),
];

const T5_BOSS = [placeEnemy("scrap-mountain-guardian", { dy: -60 })];

const TUT_T1_INTRO = [
  placeEnemy("radio-bot", { dx: -100, scale: 0.7 }),
  placeEnemy("traffic-light-bot", { dx: 100, flip: true }),
];

const TUT_T1_SCOUT = [
  placeEnemy("radio-bot", { dx: -100, scale: 0.7 }),
  placeEnemy("maintenance-spider", { dx: 100, dy: SPIDER_DY, scale: 1.1, flip: true }),
];

const TUT_T2_CREW = [
  placeEnemy("radio-bot", { dx: -150, scale: 0.7 }),
  placeEnemy("radio-bot", { scale: 0.7, dy: GROUND_DY + 30 }),
  placeEnemy("traffic-light-bot", { dx: 150, flip: true }),
];

const TUT_T2_SIGNAL = [
  placeEnemy("radio-bot", { dx: -150, scale: 0.7 }),
  placeEnemy("traffic-light-bot"),
  placeEnemy("maintenance-spider", { dx: 150, dy: SPIDER_DY, scale: 1.1, flip: true }),
];

const TUT_T3_LINE = [
  placeEnemy("traffic-light-bot", { dx: -150 }),
  placeEnemy("traffic-light-bot"),
  placeEnemy("maintenance-spider", { dx: 150, dy: SPIDER_DY, scale: 1.1, flip: true }),
];

const TUT_T3_RELAY = [
  placeEnemy("radio-bot", { dx: -150, scale: 0.7 }),
  placeEnemy("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  placeEnemy("sweep-drone", { dx: 150, scale: 1.1, flip: true }),
];

export const ENCOUNTERS: EncounterDef[] = [
  { id: "n-t1-scout", name: "初遇侦察", enemies: T1_SCOUT },
  { id: "n-t1-sweep", name: "双机清扫", enemies: T1_SWEEP },
  { id: "n-t2-crew", name: "清运班组", enemies: T2_CREW },
  { id: "n-t2-beacon", name: "巡回信标", enemies: T2_BEACON },
  { id: "n-t3-patrol", name: "维修巡线", enemies: T3_PATROL },
  { id: "n-t3-blockade", name: "路口封锁", enemies: T3_BLOCKADE },
  { id: "n-t4-patrol", name: "四方清运", enemies: T4_PATROL },
  { id: "n-t4-blockade", name: "路口压制", enemies: T4_BLOCKADE },
  { id: "n-t4-elite-guard", name: "高压拦截", enemies: T4_ELITE_GUARD },
  { id: "n-t4-compactor", name: "报废压缩机", enemies: T4_COMPACTOR },
  { id: "n-t5-boss", name: "回收总控", enemies: T5_BOSS },
  { id: "tut-t1-intro", name: "入门巡逻", enemies: TUT_T1_INTRO },
  { id: "tut-t1-scout", name: "初次接触", enemies: TUT_T1_SCOUT },
  { id: "tut-t2-crew", name: "训练班组", enemies: TUT_T2_CREW },
  { id: "tut-t2-signal", name: "信号巡线", enemies: TUT_T2_SIGNAL },
  { id: "tut-t3-line", name: "清运测试", enemies: TUT_T3_LINE },
  { id: "tut-t3-relay", name: "中继压制", enemies: TUT_T3_RELAY },
];
