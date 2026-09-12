// 遭遇战数据 —— enemies 引用敌人 id，站位只供战斗 UI 取景。

export interface EnemyPlacement {
  id: string;
  dx?: number;
  dy?: number;
  scale?: number;
  flip?: boolean;
  lift?: number; // 飞行单位离地高度(px), 只供 UI 把落地阴影放回地面
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
  return slot.dx == null &&
    slot.dy == null &&
    slot.scale == null &&
    slot.flip == null &&
    slot.lift == null
    ? undefined
    : slot;
}

// .combatant 宽 256px + .enemy-row gap 20px；与战斗布局 CSS 保持一致。
export const SLOT_PITCH = 276;

const GROUND_DY = 220;
const SPIDER_DY = GROUND_DY - 80;
const FLY_LIFT = 140; // 飞行单位离地高度; dy 抬高多少, lift 就是多少

interface StandSpec extends Omit<EnemyPlacement, "id" | "dx"> {
  id: string;
  x?: number; // 相对舞台中心的绝对站位, placeRow 会折算为槽位偏移
}

function ground(id: string, options: Omit<StandSpec, "id"> = {}): StandSpec {
  return { id, dy: GROUND_DY, scale: 1, flip: false, ...options };
}

function flyer(id: string, options: Omit<StandSpec, "id"> = {}): StandSpec {
  return ground(id, { dy: GROUND_DY - FLY_LIFT, lift: FLY_LIFT, ...options });
}

function placeRow(...specs: StandSpec[]): EnemyPlacement[] {
  const n = specs.length;
  return specs.map(({ x = 0, ...rest }, i) => ({
    ...rest,
    dx: x - (i - (n - 1) / 2) * SLOT_PITCH,
  }));
}

const T1_SCOUT = placeRow(
  ground("maintenance-spider", { x: -238, dy: SPIDER_DY, scale: 1.1 }),
  ground("radio-bot", { x: 238, dy: GROUND_DY + 30, scale: 0.7, flip: true }),
);

const T1_SWEEP = placeRow(
  ground("sweep-drone", { x: -238, scale: 1.1 }),
  ground("traffic-light-bot", { x: 238, flip: true }),
);

const T1_DRIFT = placeRow(
  flyer("glass-jelly", { x: -238, scale: 1.2 }),
  ground("radio-bot", { x: 238, scale: 0.7, flip: true }),
);

const T2_CREW = placeRow(
  ground("maintenance-spider", { x: -426, dy: SPIDER_DY, scale: 1.1 }),
  ground("radio-bot", { dy: GROUND_DY + 30, scale: 0.7 }),
  ground("sweep-drone", { x: 426, scale: 1.2, flip: true }),
);

const T2_BEACON = placeRow(
  ground("radio-bot", { x: -426 }),
  ground("traffic-light-bot"),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

const T2_CURRENT = placeRow(
  flyer("glass-jelly", { x: -426, scale: 1.2 }),
  ground("traffic-light-bot"),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

const T2_DUO_CRUSH = placeRow(
  ground("sweep-drone", { x: -238, scale: 1.1 }),
  ground("sweep-drone", { x: 238, scale: 1.1, flip: true }),
);

const T2_DUO_TORCH = placeRow(
  ground("maintenance-spider", { x: -238, dy: SPIDER_DY, scale: 1.1 }),
  ground("traffic-light-bot", { x: 238, flip: true }),
);

const T3_PATROL = placeRow(
  ground("maintenance-spider", { x: -426, dy: SPIDER_DY, scale: 1.1 }),
  ground("sweep-drone", { scale: 1.1 }),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

const T3_BLOCKADE = placeRow(
  ground("traffic-light-bot", { x: -426 }),
  ground("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

const T3_SWARM = placeRow(
  flyer("glass-jelly", { x: -426, scale: 1.2 }),
  ground("sweep-drone", { scale: 1.1 }),
  flyer("glass-jelly", {
    x: 426,
    dy: GROUND_DY - FLY_LIFT - 30,
    scale: 1.2,
    flip: true,
  }),
);

const T4_PATROL = placeRow(
  ground("radio-bot", { x: -594, flip: true }),
  ground("radio-bot", { x: -198, scale: 0.7 }),
  ground("maintenance-spider", { x: 198, dy: SPIDER_DY, scale: 1.1 }),
  ground("sweep-drone", { x: 594, scale: 1.1, flip: true }),
);

const T4_BLOCKADE = placeRow(
  ground("traffic-light-bot", { x: -594 }),
  ground("traffic-light-bot", { x: -198 }),
  ground("radio-bot", { x: 198, scale: 0.7, dy: GROUND_DY + 30 }),
  ground("sweep-drone", { x: 594, scale: 1.1, flip: true }),
);

const T4_ELITE_GUARD = placeRow(
  ground("pole-bot", { x: -426 }),
  ground("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  ground("radio-bot", { x: 426, scale: 0.7, dy: GROUND_DY + 30, flip: true }),
);

const T4_COMPACTOR = placeRow(
  ground("scrap-bot", { x: -234 }),
  ground("pole-bot", { x: 234, flip: true }),
);

const T4_STORM = placeRow(
  flyer("glass-jelly", { x: -426, scale: 1.2 }),
  ground("pole-bot"),
  ground("maintenance-spider", { x: 426, dy: SPIDER_DY, scale: 1.1, flip: true }),
);

const MIMIC_GEAR = placeRow(
  ground("radio-bot", { x: -426, scale: 0.7, dy: GROUND_DY + 30 }),
  ground("treasure-mimic-gear", { scale: 1.15 }),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

const MIMIC_CARD = placeRow(
  ground("maintenance-spider", { x: -440, dy: SPIDER_DY, scale: 1.1 }),
  ground("treasure-mimic-card", { scale: 1.1 }),
  ground("traffic-light-bot", { x: 440, flip: true }),
);

const T5_BOSS = placeRow(ground("scrap-mountain-guardian", { dy: -60 }));

const TUT_T1_INTRO = placeRow(
  ground("radio-bot", { x: -238, scale: 0.7 }),
  ground("traffic-light-bot", { x: 238, flip: true }),
);

const TUT_T1_SCOUT = placeRow(
  ground("radio-bot", { x: -238, scale: 0.7 }),
  ground("maintenance-spider", { x: 238, dy: SPIDER_DY, scale: 1.1, flip: true }),
);

const TUT_T2_CREW = placeRow(
  ground("radio-bot", { x: -426, scale: 0.7 }),
  ground("radio-bot", { scale: 0.7, dy: GROUND_DY + 30 }),
  ground("traffic-light-bot", { x: 426, flip: true }),
);

const TUT_T2_SIGNAL = placeRow(
  ground("radio-bot", { x: -426, scale: 0.7 }),
  ground("traffic-light-bot"),
  ground("maintenance-spider", { x: 426, dy: SPIDER_DY, scale: 1.1, flip: true }),
);

const TUT_T3_LINE = placeRow(
  ground("traffic-light-bot", { x: -426 }),
  ground("traffic-light-bot"),
  ground("maintenance-spider", { x: 426, dy: SPIDER_DY, scale: 1.1, flip: true }),
);

const TUT_T3_RELAY = placeRow(
  ground("radio-bot", { x: -426, scale: 0.7 }),
  ground("maintenance-spider", { dy: SPIDER_DY, scale: 1.1 }),
  ground("sweep-drone", { x: 426, scale: 1.1, flip: true }),
);

export const ENCOUNTERS: EncounterDef[] = [
  { id: "n-t1-scout", name: "初遇侦察", enemies: T1_SCOUT },
  { id: "n-t1-sweep", name: "双机清扫", enemies: T1_SWEEP },
  { id: "n-t1-drift", name: "浮游巡检", enemies: T1_DRIFT },
  { id: "n-t2-crew", name: "清运班组", enemies: T2_CREW },
  { id: "n-t2-beacon", name: "巡回信标", enemies: T2_BEACON },
  { id: "n-t2-current", name: "电涌信标", enemies: T2_CURRENT },
  { id: "n-t2-duo-crush", name: "双机压实", enemies: T2_DUO_CRUSH },
  { id: "n-t2-duo-torch", name: "焊修路障", enemies: T2_DUO_TORCH },
  { id: "n-t3-patrol", name: "维修巡线", enemies: T3_PATROL },
  { id: "n-t3-blockade", name: "路口封锁", enemies: T3_BLOCKADE },
  { id: "n-t3-swarm", name: "群浮拦截", enemies: T3_SWARM },
  { id: "n-t4-patrol", name: "四方清运", enemies: T4_PATROL },
  { id: "n-t4-blockade", name: "路口压制", enemies: T4_BLOCKADE },
  { id: "n-t4-elite-guard", name: "高压拦截", enemies: T4_ELITE_GUARD },
  { id: "n-t4-compactor", name: "报废压缩机", enemies: T4_COMPACTOR },
  { id: "n-t4-storm", name: "高压电场", enemies: T4_STORM },
  { id: "n-mimic-gear", name: "械匣暗格", enemies: MIMIC_GEAR },
  { id: "n-mimic-card", name: "牌匣暗格", enemies: MIMIC_CARD },
  { id: "n-t5-boss", name: "回收总控", enemies: T5_BOSS },
  { id: "tut-t1-intro", name: "入门巡逻", enemies: TUT_T1_INTRO },
  { id: "tut-t1-scout", name: "初次接触", enemies: TUT_T1_SCOUT },
  { id: "tut-t2-crew", name: "训练班组", enemies: TUT_T2_CREW },
  { id: "tut-t2-signal", name: "信号巡线", enemies: TUT_T2_SIGNAL },
  { id: "tut-t3-line", name: "清运测试", enemies: TUT_T3_LINE },
  { id: "tut-t3-relay", name: "中继压制", enemies: TUT_T3_RELAY },
];
