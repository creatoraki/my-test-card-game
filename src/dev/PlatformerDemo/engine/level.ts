import type { EnemySpawn, PickupSpawn, Platform } from "../types";

// 关卡数据：舞台 1920×1080 设计 px，世界横向 7200。
// 跳跃顶点约 254px，平台之间的高差都控制在 180 以内；地面缺口宽 260，助跑可越过。
export const STAGE_W = 1920;
export const STAGE_H = 1080;
export const WORLD_W = 7200;
export const GROUND_Y = 880;
/** 低于此高度视为坠落，回到最近的安全落脚点。 */
export const FALL_LIMIT = STAGE_H + 240;

export const PLAYER_START = { x: 260, y: GROUND_Y };

function ground(id: string, x: number, w: number): Platform {
  return { id, kind: "ground", x, y: GROUND_Y, w };
}

function float(id: string, x: number, y: number, w: number): Platform {
  return { id, kind: "float", x, y, w };
}

export const PLATFORMS: readonly Platform[] = [
  ground("g1", 0, 2300),
  ground("g2", 2560, 2140),
  ground("g3", 4960, 2240),
  float("p1", 700, 730, 260),
  float("p2", 1060, 590, 240),
  float("p3", 1480, 720, 300),
  float("p4", 2300, 700, 260),
  float("p5", 3080, 720, 280),
  float("p6", 3470, 580, 280),
  float("p7", 3880, 450, 240),
  float("p8", 4320, 640, 300),
  float("p9", 5320, 720, 260),
  float("p10", 5720, 580, 300),
  float("p11", 6220, 710, 280),
];

/** 地面缺口（两段地面之间），用于绘制断口与坠落判定展示。 */
export const GROUND_GAPS = PLATFORMS.filter((p) => p.kind === "ground")
  .map((p, index, list) => (index < list.length - 1 ? { from: p.x + p.w, to: list[index + 1].x } : null))
  .filter((gap): gap is { from: number; to: number } => gap !== null);

export const PICKUPS: readonly PickupSpawn[] = [
  { id: "i1", kind: "seedPod", x: 560, y: GROUND_Y },
  { id: "i2", kind: "dewFlask", x: 1180, y: 590 },
  { id: "i3", kind: "sporeLamp", x: 1640, y: 720 },
  { id: "i4", kind: "geneCase", x: 2430, y: 700 },
  { id: "i5", kind: "bioCore", x: 3000, y: GROUND_Y },
  { id: "i6", kind: "seedPod", x: 4000, y: 450 },
  { id: "i7", kind: "sporeLamp", x: 4470, y: 640 },
  { id: "i8", kind: "dewFlask", x: 5200, y: GROUND_Y },
  { id: "i9", kind: "geneCase", x: 5870, y: 580 },
  { id: "i10", kind: "bioCore", x: 6900, y: GROUND_Y },
];

export const ENEMIES: readonly EnemySpawn[] = [
  { id: "e1", x: 1900, y: GROUND_Y, minX: 1300, maxX: 2200 },
  { id: "e2", x: 3600, y: 580, minX: 3510, maxX: 3710 },
  { id: "e3", x: 4200, y: GROUND_Y, minX: 3900, maxX: 4640 },
  { id: "e4", x: 6000, y: GROUND_Y, minX: 5500, maxX: 6600 },
];
