// ============================================================================
// 随机地图的物件清单 —— 决定每间房放哪些可交互物, 不负责槽位坐标(见 generate.ts)。
//
// · 治疗交互按配额投放: 约每 roomsPerHeal 间房 1 个, 按深度分段, 每段 1 间, 避免扎堆;
// · 风险房按配额投放: 约每 roomsPerRisk 间房 1 间, 只落在普通房, 进房立即触发;
// · 其余名额按 RANDOM_CURIO_WEIGHTS 不放回加权抽取, 偏向获取物品的交互;
// · 流浪货商额外追加, 不占普通物件名额。
// ============================================================================

import { rngInt, rngPick, rngPickWeighted, shuffle } from "../../engine/rng";
import { HEAL_CURIO_KINDS, RANDOM_CURIO_WEIGHTS, RISK_CURIO_KINDS } from "../../data/curios";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import type { CurioKind } from "../corridor/types";
import type { RoomNode } from "./types";

/** 配额至少 1 个, 不超过可投放的房间数。 */
function quota(wanted: number, available: number): number {
  return Math.min(available, Math.max(1, wanted));
}

/** 按深度排序后均分成 count 段, 每段随机取 1 间 —— 让配额物件沿路线均匀分布。 */
function pickSpread(s: ExploreState, ids: string[], rooms: Record<string, RoomNode>, count: number): string[] {
  const sorted = [...ids].sort((a, b) => rooms[a].depth - rooms[b].depth);
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const from = Math.floor((i * sorted.length) / count);
    const to = Math.max(from + 1, Math.floor(((i + 1) * sorted.length) / count));
    picked.push(rngPick(s, sorted.slice(from, to)));
  }
  return picked;
}

/** 按权重不放回抽取 count 个普通物件。 */
function drawWeightedKinds(s: ExploreState, count: number): CurioKind[] {
  const pool = Object.keys(RANDOM_CURIO_WEIGHTS) as CurioKind[];
  const picks: CurioKind[] = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    const kind = rngPickWeighted(s, pool, (candidate) => RANDOM_CURIO_WEIGHTS[candidate] ?? 0);
    picks.push(kind);
    pool.splice(pool.indexOf(kind), 1);
  }
  return picks;
}

/** 生成整张随机地图每间房的物件清单(房间 id → 物件种类, 货商排在最后)。 */
export function planRoomCurios(
  s: ExploreState,
  rooms: Record<string, RoomNode>,
  order: string[],
  merchantRooms: ReadonlySet<string>,
): Record<string, CurioKind[]> {
  const { roomsPerHeal, roomsPerRisk, curiosPerRoom } = EXPLORE_RULES.dungeon;
  const roomCount = order.length;

  const healCandidates = order.filter((id) => rooms[id].kind !== "start");
  const healCount = quota(Math.floor(roomCount / roomsPerHeal), healCandidates.length);
  const healRooms = new Set(pickSpread(s, healCandidates, rooms, healCount));

  const riskCandidates = order.filter((id) => rooms[id].kind === "normal" && !healRooms.has(id));
  const riskCount = quota(Math.round(roomCount / roomsPerRisk), riskCandidates.length);
  const riskRooms = new Set(shuffle(s, riskCandidates).slice(0, riskCount));

  const [minCurio, maxCurio] = curiosPerRoom;
  const plan: Record<string, CurioKind[]> = {};
  for (const id of order) {
    if (rooms[id].kind === "start") {
      plan[id] = ["dispatch"];
      continue;
    }
    const fixed: CurioKind[] = [];
    if (riskRooms.has(id)) fixed.push(rngPick(s, [...RISK_CURIO_KINDS]));
    if (healRooms.has(id)) fixed.push(rngPick(s, [...HEAL_CURIO_KINDS]));
    const total = minCurio + rngInt(s, maxCurio - minCurio + 1);
    const picks = [...fixed, ...drawWeightedKinds(s, Math.max(0, total - fixed.length))];
    if (merchantRooms.has(id)) picks.push("merchant");
    plan[id] = picks;
  }
  return plan;
}
