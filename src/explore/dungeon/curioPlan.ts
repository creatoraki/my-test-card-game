// ============================================================================
// 随机地图的物件清单 —— 决定每间房放哪些可交互物, 不负责槽位坐标(见 generate.ts)。
//
// 一切产出都由概率与权重决定, 不做配额或保底:
// · 起始房固定: 只有临时祝福匣(一次性随机遗物);
// · 其余房间 1-2 个物件, 货商房的货商占 1 个名额;
// · 陷阱房: 固定 1 个陷阱物件排在最前, 其余名额照常抽取;
// · 治疗: 非陷阱房每房 healChance 独立掷骰;
// · 剩余名额按 RANDOM_CURIO_WEIGHTS 房内不放回加权抽取(期望推算见该表注释)。
// ============================================================================

import { rngFloat, rngInt, rngPick, rngPickWeighted } from "../../engine/rng";
import { HEAL_CURIO_KINDS, RANDOM_CURIO_WEIGHTS, TRAP_CURIO_KINDS } from "../../data/curios";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import type { CurioKind } from "../corridor/types";
import type { RoomNode } from "./types";
import { allowsCardRemoval } from "@/data/curios/growthBalance";
import { difficultyMapConfig } from "../../data/mapDifficulty";
import type { MapDef } from "../../data/maps";

const START_ROOM_CURIOS: readonly CurioKind[] = ["temporaryRelicCache"];

/** 按权重不放回抽取 count 个普通物件。 */
function drawWeightedKinds(s: ExploreState, count: number, excluded: CurioKind[], map: MapDef): CurioKind[] {
  const weights = { ...RANDOM_CURIO_WEIGHTS, ...map.curioPool?.weights };
  const pool = (Object.keys(weights) as CurioKind[])
    .filter(kind => (weights[kind] ?? 0) > 0 && !excluded.includes(kind) && (kind !== "cardArchive" || allowsCardRemoval(s)));
  const picks: CurioKind[] = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    const kind = rngPickWeighted(s, pool, (candidate) => weights[candidate] ?? 0);
    picks.push(kind);
    pool.splice(pool.indexOf(kind), 1);
  }
  return picks;
}

/** 单间非起点房的物件清单。 */
function planRoom(s: ExploreState, room: RoomNode, merchant: boolean, map: MapDef): CurioKind[] {
  const { curiosPerRoom, healChance } = EXPLORE_RULES.dungeon;
  const [minCurio, maxCurio] = curiosPerRoom;
  const total = minCurio + rngInt(s, maxCurio - minCurio + 1);
  const fixed: CurioKind[] = [];
  if (room.kind === "trap") fixed.push(rngPick(s, [...(map.curioPool?.trapKinds ?? TRAP_CURIO_KINDS)]));
  else if (rngFloat(s) < healChance) fixed.push(rngPick(s, [...(map.curioPool?.healKinds ?? HEAL_CURIO_KINDS)]));
  const slots = Math.max(0, total - fixed.length - (merchant ? 1 : 0));
  const picks = [...fixed, ...drawWeightedKinds(s, slots, fixed, map)].slice(0, merchant ? total - 1 : total);
  // 货商排在最后, 由布局随机分配槽位。
  return merchant ? [...picks, "merchant"] : picks;
}

/** 生成整张随机地图每间房的物件清单(房间 id → 物件种类)。 */
export function planRoomCurios(
  s: ExploreState,
  rooms: Record<string, RoomNode>,
  order: string[],
  merchantRooms: ReadonlySet<string>,
): Record<string, CurioKind[]> {
  const plan: Record<string, CurioKind[]> = {};
  const map = difficultyMapConfig(s.mapId, s.difficulty);
  for (const id of order) {
    const room = rooms[id];
    plan[id] = room.kind === "start" ? [...START_ROOM_CURIOS] : planRoom(s, room, merchantRooms.has(id), map);
  }
  return plan;
}
