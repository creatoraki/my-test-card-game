// ============================================================================
// 随机地图的物件清单 —— 决定每间房放哪些可交互物, 不负责槽位坐标(见 generate.ts)。
//
// 普通物件由概率与权重决定，锻造师每图固定一位:
// · 起始房固定: 只有临时祝福匣(一次性随机遗物);
// · 其余房间 1-2 个物件, 货商与锻造师各占 1 个名额;
// · 陷阱房: 固定 1 个陷阱物件排在最前, 其余名额照常抽取;
// · 治疗: 非陷阱房每房 healChance 独立掷骰;
// · 剩余名额按 RANDOM_CURIO_WEIGHTS 房内不放回加权抽取(期望推算见该表注释)。
// ============================================================================

import { rngFloat, rngInt, rngPick, rngPickWeighted } from "@/engine/core/rng";
import { HEAL_CURIO_KINDS, RANDOM_CURIO_WEIGHTS, TRAP_CURIO_KINDS } from "@/data/curios";
import { EXPLORE_RULES } from "../core/exploreRules";
import type { ExploreState } from "../types";
import type { CurioKind } from "../corridor/types";
import type { RoomNode } from "./types";
import { seedMessengers } from "../curio/messenger";
import { difficultyMapConfig } from "@/data/maps/mapDifficulty";
import type { MapDef } from "@/data/maps";

const START_ROOM_CURIOS: readonly CurioKind[] = ["temporaryRelicCache"];

/** 按权重不放回抽取 count 个普通物件。 */
function drawWeightedKinds(s: ExploreState, count: number, excluded: CurioKind[], map: MapDef): CurioKind[] {
  const weights = { ...RANDOM_CURIO_WEIGHTS, ...map.curioPool?.weights };
  const pool = (Object.keys(weights) as CurioKind[])
    .filter(kind => (weights[kind] ?? 0) > 0 && !excluded.includes(kind) && kind !== "blacksmith" && kind !== "merchant" && kind !== "dispatch");
  const picks: CurioKind[] = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    const kind = rngPickWeighted(s, pool, (candidate) => weights[candidate] ?? 0);
    picks.push(kind);
    pool.splice(pool.indexOf(kind), 1);
  }
  return picks;
}

/** 单间非起点房的物件清单。 */
function planRoom(s: ExploreState, room: RoomNode, merchant: boolean, blacksmith: boolean, map: MapDef): CurioKind[] {
  const { curiosPerRoom, healChance } = EXPLORE_RULES.dungeon;
  const [minCurio, maxCurio] = curiosPerRoom;
  const npcs: CurioKind[] = [...(merchant ? ["merchant" as const] : []), ...(blacksmith ? ["blacksmith" as const] : [])];
  const required = npcs.length + (room.kind === "trap" ? 1 : 0);
  const total = Math.max(required, minCurio + rngInt(s, maxCurio - minCurio + 1));
  const fixed: CurioKind[] = [];
  if (room.kind === "trap") fixed.push(rngPick(s, [...(map.curioPool?.trapKinds ?? TRAP_CURIO_KINDS)]));
  else if (total > npcs.length && rngFloat(s) < healChance) fixed.push(rngPick(s, [...(map.curioPool?.healKinds ?? HEAL_CURIO_KINDS)]));
  const slots = Math.max(0, total - fixed.length - npcs.length);
  return [...fixed, ...drawWeightedKinds(s, slots, [...fixed, ...npcs], map), ...npcs];
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
  const eligible = order.filter(id => rooms[id].kind !== "start");
  const candidates = [
    eligible.filter(id => rooms[id].kind === "normal" && !merchantRooms.has(id)),
    eligible.filter(id => rooms[id].kind === "normal"),
    eligible.filter(id => rooms[id].kind === "battle"),
    eligible.filter(id => rooms[id].kind === "trap"),
    eligible.filter(id => rooms[id].kind === "boss"),
  ].find(ids => ids.length) ?? [];
  const blacksmithRoom = candidates.length ? rngPick(s, candidates) : null;
  for (const id of order) {
    const room = rooms[id];
    plan[id] = room.kind === "start" ? [...START_ROOM_CURIOS] : planRoom(s, room, merchantRooms.has(id), id === blacksmithRoom, map);
  }
  seedMessengers(s, plan);
  return plan;
}
